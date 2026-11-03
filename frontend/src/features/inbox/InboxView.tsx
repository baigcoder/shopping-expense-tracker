import { useEffect, useMemo, useState } from 'react';
import { Check, Link2, Pencil, X } from 'lucide-react';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';

export interface InboxItem {
    id: string;
    merchant: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    source: string;
    confidence: number;
    duplicateOf?: string | null;
}

export interface InboxRule { id: string; pattern: string; category: string; matchType: string; enabled: boolean }

export type InboxStatus = 'pending' | 'approved' | 'rejected';
export interface Edits { description: string; amount: number; category: string }

export const INBOX_CATEGORIES = ['Food & Dining', 'Shopping', 'Subscriptions', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Other'];
const CONFIDENT = 0.85;

interface InboxViewProps {
    items: InboxItem[];
    rules: InboxRule[];
    status: InboxStatus;
    loading?: boolean;
    money: (n: number) => string;
    onStatus: (s: InboxStatus) => void;
    onApprove: (item: InboxItem, edits?: Edits) => void;
    onReject: (item: InboxItem) => void;
    onMerge: (item: InboxItem) => void;
    onBulk: (ids: string[], action: 'approve' | 'reject') => void;
    onAddRule: (rule: { pattern: string; category: string; matchType: string }) => void;
}

export function InboxView({ items, rules, status, loading, money, onStatus, onApprove, onReject, onMerge, onBulk, onAddRule }: InboxViewProps) {
    const [sort, setSort] = useState<'date' | 'amount' | 'confidence'>('date');
    const [selected, setSelected] = useState<string[]>([]);
    const [editing, setEditing] = useState<Record<string, { description: string; amount: string; category: string }>>({});
    const [focus, setFocus] = useState(0);
    const [rule, setRule] = useState({ pattern: '', category: 'Shopping', matchType: 'contains' });

    const sorted = useMemo(() => [...items].sort((a, b) =>
        sort === 'amount' ? b.amount - a.amount : sort === 'confidence' ? a.confidence - b.confidence : b.date.localeCompare(a.date)), [items, sort]);
    const confident = items.filter((i) => i.confidence >= CONFIDENT);
    const pending = status === 'pending';

    useEffect(() => { setSelected([]); setFocus(0); }, [status]);

    const submit = (item: InboxItem) => {
        const d = editing[item.id];
        if (!d) return onApprove(item);
        const amount = Number(d.amount);
        if (d.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) return;
        onApprove(item, { description: d.description.trim() || item.description, amount, category: d.category });
        setEditing(({ [item.id]: _, ...rest }) => rest);
    };

    // A approve, R not mine, M merge, J/K move, Shift+A approve every confident item.
    useEffect(() => {
        if (!pending) return;
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(t?.tagName) || !sorted.length) return;
            const cur = sorted[Math.min(focus, sorted.length - 1)];
            const k = e.key.toLowerCase();
            if (e.shiftKey && k === 'a') { e.preventDefault(); if (confident.length) onBulk(confident.map((i) => i.id), 'approve'); }
            else if (k === 'a') { e.preventDefault(); submit(cur); }
            else if (k === 'r') { e.preventDefault(); onReject(cur); }
            else if (k === 'm' && cur.duplicateOf) { e.preventDefault(); onMerge(cur); }
            else if (k === 'j' || e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(f + 1, sorted.length - 1)); }
            else if (k === 'k' || e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const total = items.reduce((s, i) => s + i.amount, 0);

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2" data-tour="inbox-head">
                <div>
                    <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Review inbox</h1>
                </div>
                {pending && confident.length > 0 && (
                    <button type="button" onClick={() => onBulk(confident.map((i) => i.id), 'approve')} data-tour="inbox-confident"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)]">
                        <Check size={17} /> Approve the {confident.length} sure {confident.length === 1 ? 'one' : 'ones'}
                    </button>
                )}
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Show" className="inline-flex rounded-full bg-[var(--color-surface)] p-1">
                    {([['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Not mine']] as const).map(([v, l]) => (
                        <button key={v} type="button" role="tab" aria-selected={status === v} onClick={() => onStatus(v)}
                            className={cn('h-9 rounded-full px-4 text-[14px] font-medium transition-colors', status === v ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>
                            {l}
                        </button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-[14px] text-[var(--color-ink-secondary)]">
                    Sort by
                    <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 rounded-full bg-[var(--color-surface)] px-3 text-[14px] text-[var(--color-ink)]">
                        <option value="date">Newest</option>
                        <option value="amount">Largest</option>
                        <option value="confidence">Least sure first</option>
                    </select>
                </label>
            </div>

            {selected.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[var(--color-ink)] px-4 py-3 text-white">
                    <p className="text-[15px]">{selected.length} selected</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { onBulk(selected, 'reject'); setSelected([]); }} className="h-9 rounded-full px-4 text-[14px] hover:bg-white/10">Not mine</button>
                        <button type="button" onClick={() => { onBulk(selected, 'approve'); setSelected([]); }} className="h-9 rounded-full bg-white px-4 text-[14px] font-semibold text-[var(--color-ink)]">Approve</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section aria-label="Purchases" className="flex min-w-0 flex-col gap-2" data-tour="inbox-list">
                    {loading && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Loading your inbox…</p>}
                    {!loading && sorted.length === 0 && (
                        <div className="rounded-[20px] bg-[var(--color-surface)] p-8">
                            <p className="font-display text-[20px] font-semibold">{pending ? 'All caught up' : 'Nothing here yet'}</p>
                            <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">
                                {pending ? 'When the browser extension catches a checkout, it waits here for you. You can also import a statement from Activity.' : 'Items move here as you work through the inbox.'}
                            </p>
                        </div>
                    )}
                    {!loading && sorted.map((item, idx) => {
                        const tint = categoryTint(item.category);
                        const draft = editing[item.id];
                        const sure = item.confidence >= CONFIDENT;
                        const isSel = selected.includes(item.id);
                        return (
                            <article key={item.id} onClick={() => setFocus(idx)}
                                className={cn('rounded-[20px] bg-[var(--color-surface)] p-4 sm:p-5 transition-[outline-color]', pending && idx === focus ? 'outline outline-2 outline-[var(--color-ink)]' : 'outline outline-2 outline-transparent')}>
                                <div className="flex items-start gap-3">
                                    {pending && (
                                        <input type="checkbox" checked={isSel} aria-label={`Select ${item.merchant}`}
                                            onChange={(e) => setSelected((s) => e.target.checked ? [...s, item.id] : s.filter((x) => x !== item.id))}
                                            className="mt-3 h-4 w-4 accent-[var(--color-ink)]" />
                                    )}
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] font-display text-[16px] font-semibold" style={{ background: tint.soft, color: tint.ink }} aria-hidden>
                                        {item.merchant.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                                            <h2 className="truncate font-display text-[17px] font-semibold">{item.merchant}</h2>
                                            <p className="font-display text-[19px] font-bold tabular-nums">{money(item.amount)}</p>
                                        </div>
                                        <p className="truncate text-[15px] text-[var(--color-ink-secondary)]">{item.description}</p>
                                        <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                                            {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {item.category}
                                            {!sure && <span className="font-medium text-[var(--cat-food)]"> · Check this</span>}
                                        </p>
                                    </div>
                                </div>

                                {item.duplicateOf && pending && (
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[var(--color-wine-soft)] px-4 py-3 text-[14px] text-[var(--color-wine)] sm:ml-14">
                                        <span>This looks like a purchase already in your ledger.</span>
                                        <button type="button" onClick={() => onMerge(item)} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"><Link2 size={14} /> Merge them</button>
                                    </div>
                                )}

                                {draft && (
                                    <div className="mt-4 grid gap-3 rounded-[14px] bg-[var(--color-canvas)] p-4 sm:ml-14 sm:grid-cols-[2fr_1fr_1.4fr]">
                                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">What it was
                                            <input value={draft.description} onChange={(e) => setEditing((d) => ({ ...d, [item.id]: { ...draft, description: e.target.value } }))} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]" />
                                        </label>
                                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">Amount
                                            <input inputMode="decimal" value={draft.amount} onChange={(e) => setEditing((d) => ({ ...d, [item.id]: { ...draft, amount: e.target.value } }))} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] tabular-nums" />
                                        </label>
                                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">Category
                                            <select value={draft.category} onChange={(e) => setEditing((d) => ({ ...d, [item.id]: { ...draft, category: e.target.value } }))} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]">
                                                {[...new Set([draft.category, ...INBOX_CATEGORIES])].map((c) => <option key={c}>{c}</option>)}
                                            </select>
                                        </label>
                                    </div>
                                )}

                                {pending && (
                                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                                        <button type="button" onClick={() => onReject(item)} className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]"><X size={15} /> Not mine</button>
                                        {draft ? (
                                            <button type="button" onClick={() => setEditing(({ [item.id]: _, ...rest }) => rest)} className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-[var(--color-canvas)] px-4 text-[14px] hover:bg-[var(--color-surface-2)]">Cancel edit</button>
                                        ) : (
                                            <button type="button" onClick={() => setEditing((d) => ({ ...d, [item.id]: { description: item.description, amount: String(item.amount), category: item.category } }))}
                                                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-canvas)] px-4 text-[14px] hover:bg-[var(--color-surface-2)]"><Pencil size={14} /> Edit</button>
                                        )}
                                        <button type="button" onClick={() => submit(item)} title="A" className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-ink)] px-5 text-[14px] font-semibold text-white hover:bg-black">
                                            <Check size={15} /> {draft ? 'Save and approve' : 'Approve'}
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>

                <aside className="flex flex-col gap-4" aria-label="Merchant rules" data-tour="inbox-rules">
                    <form className="rounded-[20px] bg-[var(--color-surface)] p-5" onSubmit={(e) => { e.preventDefault(); if (!rule.pattern.trim()) return; onAddRule(rule); setRule({ pattern: '', category: rule.category, matchType: 'contains' }); }}>
                        <h2 className="font-display text-[17px] font-semibold">Trust a merchant</h2>
                        <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-medium">Merchant name contains
                            <input value={rule.pattern} onChange={(e) => setRule({ ...rule, pattern: e.target.value })} placeholder="Foodpanda" className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]" />
                        </label>
                        <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">Put it in
                            <select value={rule.category} onChange={(e) => setRule({ ...rule, category: e.target.value })} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]">
                                {INBOX_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </label>
                        <button type="submit" className="mt-4 h-10 w-full rounded-full bg-[var(--color-canvas)] text-[14px] font-semibold hover:bg-[var(--color-surface-2)]">Save rule</button>
                    </form>
                    <section className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="rules-h">
                        <h2 id="rules-h" className="font-display text-[17px] font-semibold">Your rules</h2>
                        {rules.length === 0 ? <p className="mt-2 text-[14px] text-[var(--color-ink-secondary)]">None yet.</p> : (
                            <ul className="mt-2">
                                {rules.map((r) => (
                                    <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                                        <span className="truncate">“{r.pattern}”</span>
                                        <span className="shrink-0 text-[var(--color-ink-secondary)]">{r.category}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
