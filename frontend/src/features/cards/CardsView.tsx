import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
export interface AccountRow { id: string; name: string; bank: string; type: AccountType; balance: number }
export type AccountDraft = Omit<AccountRow, 'id'>;
export interface CardRow { id: string; name: string; brand: string; last4: string; expiry: string; limit?: number; frozen?: boolean; primary?: boolean }

interface CardsViewProps {
    accounts: AccountRow[]; cards: CardRow[]; money: (n: number) => string; loading?: boolean;
    onSaveAccount: (draft: AccountDraft, id?: string) => Promise<void> | void;
    onRemoveAccount: (id: string) => void;
    onAddCard: () => void;
    onFreeze: (id: string, frozen: boolean) => void;
    onPrimary: (id: string) => void;
    onLimit: (id: string, limit: number) => void;
    onRemoveCard: (id: string) => void;
}

const TYPES: [AccountType, string][] = [['checking', 'Current'], ['savings', 'Savings'], ['credit', 'Credit card'], ['investment', 'Investment'], ['cash', 'Cash']];
const typeLabel = (t: AccountType) => TYPES.find((x) => x[0] === t)?.[1] || t;
const field = 'h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]';
const quiet = 'h-9 rounded-full px-3 text-[14px] font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]';

function AccountForm({ initial, saving, onSave, onCancel }: { initial?: AccountRow; saving: boolean; onSave: (d: AccountDraft) => void; onCancel: () => void }) {
    const [d, setD] = useState({ name: initial?.name || '', bank: initial?.bank || '', type: initial?.type || 'checking' as AccountType, balance: initial ? String(initial.balance) : '' });
    return (
        <form className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-[14px] bg-[var(--color-canvas)] p-4 sm:grid-cols-2"
            onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) onSave({ name: d.name.trim(), bank: d.bank.trim(), type: d.type, balance: Number(d.balance) || 0 }); }}>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">Name<input required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Salary account" className={field} /></label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">Bank<input value={d.bank} onChange={(e) => setD({ ...d, bank: e.target.value })} placeholder="Meezan Bank" className={field} /></label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">Type
                <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as AccountType })} className={cn(field, 'px-2')}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">{d.type === 'credit' ? 'Amount owed' : 'Balance'}
                <input inputMode="decimal" value={d.balance} onChange={(e) => setD({ ...d, balance: e.target.value })} placeholder="0" className={cn(field, 'tabular-nums')} />
            </label>
            <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={saving} className="inline-flex h-10 items-center rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50">{saving ? 'Saving' : 'Save'}</button>
                <button type="button" onClick={onCancel} className={quiet}>Cancel</button>
            </div>
        </form>
    );
}

export function CardsView({ accounts, cards, money, loading, onSaveAccount, onRemoveAccount, onAddCard, onFreeze, onPrimary, onLimit, onRemoveCard }: CardsViewProps) {
    const [editing, setEditing] = useState<string | 'new' | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [limitFor, setLimitFor] = useState<{ id: string; value: string } | null>(null);
    const own = accounts.filter((a) => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
    const owe = accounts.filter((a) => a.type === 'credit').reduce((s, a) => s + Math.abs(a.balance), 0);

    const save = async (d: AccountDraft, id?: string) => { setSaving(true); try { await onSaveAccount(d, id); setEditing(null); } catch { /* the container already said why; the form stays open */ } finally { setSaving(false); } };
    const remove = (id: string, run: () => void) => { if (confirm === id) { run(); setConfirm(null); } else setConfirm(id); };

    return (
        <div className="flex flex-col gap-4">
            <header className="pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Cards and accounts</h1>
            </header>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="acc-h" data-tour="cards-accounts">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 id="acc-h" className="text-[15px] text-[var(--color-ink-secondary)]">Net worth</h2>
                        <p className="mt-1 font-display text-[40px] font-bold leading-none tracking-tight tabular-nums">{loading ? '…' : money(own - owe)}</p>
                        <p className="mt-2 text-[15px] text-[var(--color-ink-secondary)] tabular-nums">You have {money(own)} · you owe {money(owe)}</p>
                    </div>
                    {editing !== 'new' && (
                        <button type="button" onClick={() => setEditing('new')} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 text-[14px] font-semibold text-white">
                            <Plus size={16} /> Add account
                        </button>
                    )}
                </div>
                {editing === 'new' && <div className="mt-4"><AccountForm saving={saving} onSave={(d) => save(d)} onCancel={() => setEditing(null)} /></div>}
                {!loading && accounts.length === 0 && editing !== 'new' && <p className="mt-4 text-[15px] text-[var(--color-ink-secondary)]">Add an account to see your net worth.</p>}
                <ul className="mt-4">
                    {accounts.map((a) => editing === a.id ? (
                        <li key={a.id} className="py-2"><AccountForm initial={a} saving={saving} onSave={(d) => save(d, a.id)} onCancel={() => setEditing(null)} /></li>
                    ) : (
                        <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-surface-2)] py-3">
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-medium">{a.name}</span>
                                <span className="block text-[13px] text-[var(--color-muted)]">{[a.bank, typeLabel(a.type)].filter(Boolean).join(' · ')}</span>
                            </span>
                            <span className={cn('font-display text-[16px] font-semibold tabular-nums', a.type === 'credit' && 'text-[var(--color-danger)]')}>{a.type === 'credit' ? '−' : ''}{money(Math.abs(a.balance))}</span>
                            <span className="-ml-3 flex w-full sm:ml-0 sm:w-auto">
                                <button type="button" onClick={() => setEditing(a.id)} className={quiet}>Edit</button>
                                <button type="button" onClick={() => remove(a.id, () => onRemoveAccount(a.id))} onBlur={() => setConfirm(null)}
                                    className={cn(quiet, confirm === a.id && 'text-[var(--color-danger)]')}>{confirm === a.id ? 'Remove it?' : 'Remove'}</button>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="cards-h" data-tour="cards-list">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 id="cards-h" className="font-display text-[17px] font-semibold">Cards</h2>
                    <button type="button" onClick={onAddCard} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-canvas)] px-4 text-[14px] font-semibold hover:bg-[var(--color-surface-2)]">
                        <Plus size={16} /> Add card
                    </button>
                </div>
                {!loading && cards.length === 0 && <p className="text-[15px] text-[var(--color-ink-secondary)]">No cards yet. Cashly keeps only the last four digits.</p>}
                <ul>
                    {cards.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-surface-2)] py-3 first:border-t-0">
                            <span className={cn('flex h-10 w-16 shrink-0 items-end rounded-[8px] p-1.5 text-[13px] font-semibold tabular-nums text-white', c.frozen ? 'bg-[var(--color-muted)]' : 'bg-[var(--color-ink)]')} aria-hidden>{c.last4}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-medium">{c.name}{c.primary && <span className="ml-2 text-[13px] font-normal text-[var(--color-muted)]">Primary</span>}{c.frozen && <span className="ml-2 text-[13px] font-normal text-[var(--color-danger)]">Frozen</span>}</span>
                                <span className="block text-[13px] capitalize text-[var(--color-muted)]">{c.brand} •••• {c.last4} · {c.expiry}</span>
                            </span>
                            <span className="flex w-full flex-wrap items-center gap-x-2 pl-20 sm:w-auto sm:pl-0">
                            {limitFor?.id === c.id ? (
                                <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(limitFor.value); if (n >= 0) { onLimit(c.id, n); setLimitFor(null); } }}>
                                    <input autoFocus inputMode="decimal" aria-label="Monthly limit" value={limitFor.value} onChange={(e) => setLimitFor({ id: c.id, value: e.target.value })} className={cn(field, 'w-28 tabular-nums')} />
                                    <button type="submit" className={quiet}>Save</button>
                                </form>
                            ) : (
                                <button type="button" onClick={() => setLimitFor({ id: c.id, value: String(c.limit || '') })} className="text-left text-[14px] tabular-nums text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]">
                                    {c.limit ? `Limit ${money(c.limit)}` : 'Set a limit'}
                                </button>
                            )}
                            <span className="flex">
                                <button type="button" onClick={() => onFreeze(c.id, !c.frozen)} className={quiet}>{c.frozen ? 'Unfreeze' : 'Freeze'}</button>
                                {!c.primary && <button type="button" onClick={() => onPrimary(c.id)} className={quiet}>Make primary</button>}
                                <button type="button" onClick={() => remove(c.id, () => onRemoveCard(c.id))} onBlur={() => setConfirm(null)}
                                    className={cn(quiet, confirm === c.id && 'text-[var(--color-danger)]')}>{confirm === c.id ? 'Remove it?' : 'Remove'}</button>
                            </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
