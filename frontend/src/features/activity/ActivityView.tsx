import { useMemo, useState } from 'react';
import { Download, FileText, Search, Upload } from 'lucide-react';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';

export interface ActivityTx { id: string; date: string; description: string; amount: number; type: 'income' | 'expense'; category: string }

type Kind = 'all' | 'expense' | 'income';
export type Period = 'all' | 'year' | 'month' | 'week' | 'today';

interface ActivityViewProps<T extends ActivityTx> {
    transactions: T[];
    money: (n: number) => string;
    loading?: boolean;
    now?: Date;
    onOpen: (tx: T) => void;
    onImportFile?: () => void;
    onImportStatement?: () => void;
    onExport?: (shown: T[]) => void;
    /** Starting filters, e.g. from a Spending link: /transactions?category=Food&period=month */
    initial?: { q?: string; category?: string; period?: Period };
}

const DAY = 86400000;
const PAGE = 60;
// Local calendar day: "2026-11-20" parsed as UTC would be the 19th for anyone west of Greenwich.
const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };

export function filterActivity<T extends ActivityTx>(list: T[], q: string, kind: Kind, category: string, period: Period, now: Date) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const from = period === 'today' ? start : period === 'week' ? start - 6 * DAY : period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1).getTime() : period === 'year' ? new Date(now.getFullYear(), 0, 1).getTime() : -Infinity;
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/[^\d.]/g, ''); // "Rs 8,499" and "8499" both find 8499
    return list
        .filter((t) => (kind === 'all' || t.type === kind)
            && (category === 'all' || (t.category || '').toLowerCase() === category.toLowerCase())
            && localDay(t.date).getTime() >= from
            && (!needle || t.description.toLowerCase().includes(needle) || t.category.toLowerCase().includes(needle)
                || (digits.length >= 2 && digits === needle.replace(/[\s,rs]/g, '') && String(Math.abs(t.amount)).startsWith(digits))))
        .sort((a, b) => b.date.localeCompare(a.date));
}

const dayHeading = (iso: string, now: Date) => {
    const d = localDay(iso);
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - d.getTime()) / DAY);
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

export function ActivityView<T extends ActivityTx>({ transactions, money, loading, now = new Date(), onOpen, onImportFile, onImportStatement, onExport, initial }: ActivityViewProps<T>) {
    const [q, setQ] = useState(initial?.q || '');
    const [kind, setKind] = useState<Kind>('all');
    const [category, setCategory] = useState(initial?.category || 'all');
    const [period, setPeriod] = useState<Period>(initial?.period || 'all');
    const [limit, setLimit] = useState(PAGE);

    const categories = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);
    const shown = useMemo(() => filterActivity(transactions, q, kind, category, period, now), [transactions, q, kind, category, period, now]);
    const groups = useMemo(() => {
        const out: { day: string; items: T[]; net: number }[] = [];
        for (const t of shown.slice(0, limit)) {
            const day = t.date.slice(0, 10);
            const g = out[out.length - 1];
            const signed = t.type === 'income' ? Math.abs(t.amount) : -Math.abs(t.amount);
            if (g && g.day === day) { g.items.push(t); g.net += signed; } else out.push({ day, items: [t], net: signed });
        }
        return out;
    }, [shown, limit]);
    const spent = shown.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const received = shown.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Activity</h1>
                <div className="flex flex-wrap gap-2" data-tour="activity-import">
                    {onImportFile && <button type="button" onClick={onImportFile} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 text-[14px] font-medium hover:bg-[var(--color-surface-2)]"><Upload size={15} /> Import a file</button>}
                    {onImportStatement && <button type="button" onClick={onImportStatement} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 text-[14px] font-medium hover:bg-[var(--color-surface-2)]"><FileText size={15} /> Read a PDF statement</button>}
                    {onExport && <button type="button" onClick={() => onExport(shown)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 text-[14px] font-medium hover:bg-[var(--color-surface-2)]"><Download size={15} /> Export</button>}
                </div>
            </header>

            <div className="flex flex-wrap items-center gap-2" role="search">
                <label className="relative min-w-[220px] flex-1">
                    <span className="sr-only">Search activity</span>
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden />
                    <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search" className="h-11 w-full rounded-full bg-[var(--color-surface)] pl-10 pr-4 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]" />
                </label>
                <div role="tablist" aria-label="Type" className="inline-flex rounded-full bg-[var(--color-surface)] p-1">
                    {([['all', 'All'], ['expense', 'Spent'], ['income', 'Received']] as const).map(([v, l]) => (
                        <button key={v} type="button" role="tab" aria-selected={kind === v} onClick={() => { setKind(v); setLimit(PAGE); }}
                            className={cn('h-9 rounded-full px-4 text-[14px] font-medium', kind === v ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>{l}</button>
                    ))}
                </div>
                <select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setLimit(PAGE); }} className="h-11 rounded-full bg-[var(--color-surface)] px-4 text-[14px]">
                    <option value="all">Every category</option>
                    {[...new Set([...categories, ...(category === 'all' ? [] : [category])])].map((c) => <option key={c}>{c}</option>)}
                </select>
                <select aria-label="Period" value={period} onChange={(e) => { setPeriod(e.target.value as Period); setLimit(PAGE); }} className="h-11 rounded-full bg-[var(--color-surface)] px-4 text-[14px]">
                    <option value="all">All time</option><option value="year">This year</option><option value="month">This month</option><option value="week">Last 7 days</option><option value="today">Today</option>
                </select>
            </div>

            <p className="px-1 text-[15px] text-[var(--color-ink-secondary)] tabular-nums">
                {shown.length} {shown.length === 1 ? 'entry' : 'entries'} · spent <b className="text-[var(--color-ink)]">{money(spent)}</b> · received <b className="text-[var(--color-success)]">+{money(received)}</b>
            </p>

            <section className="rounded-[20px] bg-[var(--color-surface)] px-5 py-2 sm:px-6" aria-label="Ledger" data-tour="activity-list">
                {loading && <p className="py-6 text-[15px] text-[var(--color-ink-secondary)]">Loading…</p>}
                {!loading && groups.length === 0 && <p className="py-6 text-[15px] text-[var(--color-ink-secondary)]">{transactions.length ? 'Nothing matches.' : 'Nothing approved yet.'}</p>}
                {groups.map((g) => (
                    <div key={g.day} className="py-3">
                        <div className="flex items-baseline justify-between gap-3 pb-1">
                            <h2 className="text-[14px] font-semibold text-[var(--color-ink-secondary)]">{dayHeading(g.day, now)}</h2>
                            <p className={cn('text-[14px] tabular-nums', g.net >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-ink-secondary)]')}>{g.net >= 0 ? '+' : '−'}{money(Math.abs(g.net))}</p>
                        </div>
                        <ul>
                            {g.items.map((t) => {
                                const tint = categoryTint(t.category);
                                return (
                                    <li key={t.id}>
                                        <button type="button" onClick={() => onOpen(t)} className="-mx-3 flex w-[calc(100%+24px)] items-center gap-3 rounded-[12px] px-3 py-2.5 text-left hover:bg-[var(--color-canvas)]">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-semibold" style={{ background: tint.soft, color: tint.ink }} aria-hidden>{t.description.charAt(0).toUpperCase() || '?'}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[15px] font-medium">{t.description}</span>
                                                <span className="block text-[13px] text-[var(--color-muted)]">{t.category}</span>
                                            </span>
                                            <span className={cn('font-display text-[16px] font-semibold tabular-nums', t.type === 'income' && 'text-[var(--color-success)]')}>{t.type === 'income' ? '+' : ''}{money(Math.abs(t.amount))}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {shown.length > limit && (
                    <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="my-3 h-10 w-full rounded-full bg-[var(--color-canvas)] text-[14px] font-medium hover:bg-[var(--color-surface-2)]">Show {Math.min(PAGE, shown.length - limit)} more</button>
                )}
            </section>
        </div>
    );
}
