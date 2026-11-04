import { useState, type FormEvent } from 'react';
import { Check, Plus } from 'lucide-react';
import type { CommitmentKind, CommitmentLine, CommitmentsModel, Cycle } from './commitmentsModel';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';
import { isoDay } from './billSchedule';

export type CommitmentTab = 'all' | 'subscriptions' | 'bills' | 'trials';

export interface NewCommitment { kind: CommitmentKind; name: string; amount: number; cycle: Cycle; date: string; category: string; isTrial: boolean; trialDays: number }

interface CommitmentsViewProps {
    model: CommitmentsModel;
    tab: CommitmentTab;
    money: (n: number) => string;
    loading?: boolean;
    saving?: boolean;
    onTab: (t: CommitmentTab) => void;
    onToggle: (line: CommitmentLine) => void; // cancel or resume a subscription
    onPaid: (line: CommitmentLine) => void; // mark a bill paid
    onRemove: (line: CommitmentLine) => void;
    onAdd: (c: NewCommitment) => void;
}

const when = (d: number | null) => d === null ? 'No date set' : d < 0 ? `${-d} ${d === -1 ? 'day' : 'days'} overdue` : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
const cycleText: Record<Cycle, string> = { weekly: 'every week', monthly: 'every month', quarterly: 'every 3 months', yearly: 'every year', 'one-time': 'once' };

export function CommitmentsView({ model, tab, money, loading, saving, onTab, onToggle, onPaid, onRemove, onAdd }: CommitmentsViewProps) {
    const [form, setForm] = useState({ kind: 'subscription' as CommitmentKind, name: '', amount: '', cycle: 'monthly' as Cycle, date: isoDay(new Date()), category: 'Entertainment', isTrial: false, trialDays: '7' });
    const shown = model.lines.filter((l) => tab === 'all' || (tab === 'trials' ? l.isTrial : tab === 'bills' ? l.kind === 'bill' : l.kind === 'subscription' && !l.isTrial));
    const [confirm, setConfirm] = useState<string | null>(null);
    const peak = Math.max(1, ...model.month.map((d) => d.items.reduce((s, i) => s + i.amount, 0)));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0) return;
        onAdd({ ...form, name: form.name.trim(), amount, trialDays: Number(form.trialDays) || 7 });
        setForm((f) => ({ ...f, name: '', amount: '' }));
    };

    return (
        <div className="flex flex-col gap-4">
            <header className="pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Bills and subscriptions</h1>
            </header>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="ahead-h" data-tour="bills-strip">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 id="ahead-h" className="text-[15px] text-[var(--color-ink-secondary)]">Committed every month</h2>
                        <p className="mt-1 font-display text-[clamp(32px,4vw,44px)] font-bold leading-none tabular-nums">{money(model.monthly)}</p>
                        <p className="mt-2 text-[14px] text-[var(--color-muted)]">{money(model.yearly)} a year</p>
                    </div>
                    <div className="flex gap-8 text-right">
                        {model.overdue.count > 0 && (
                            <p className="text-[15px] text-[var(--color-danger)]">
                                <b className="font-display text-[20px] tabular-nums">{money(model.overdue.amount)}</b><br />overdue, {model.overdue.count} {model.overdue.count === 1 ? 'bill' : 'bills'}
                            </p>
                        )}
                        <p className="max-w-[30ch] text-[15px] text-[var(--color-ink-secondary)]">
                            <b className="font-display text-[20px] text-[var(--color-ink)] tabular-nums">{money(model.next7.amount)}</b><br />due in the next 7 days, {model.next7.count} {model.next7.count === 1 ? 'charge' : 'charges'}
                        </p>
                    </div>
                </div>
                <div className="mt-6" role="img" aria-label="Charges over the next 30 days">
                    <div className="flex h-24 items-end gap-[3px]">
                        {model.month.map((d) => {
                            const total = d.items.reduce((s, i) => s + i.amount, 0);
                            const trial = d.items.some((i) => i.isTrial);
                            return (
                                <div key={d.day} className="group relative flex h-full flex-1 items-end" title={d.items.map((i) => `${i.name} ${money(i.amount)}`).join(', ')}>
                                    <div className={cn('w-full rounded-t-[4px]', total ? (trial ? 'bg-[var(--color-wine)]' : 'bg-[var(--color-ink)]') : 'bg-[var(--color-surface-2)]')}
                                        style={{ height: total ? `${Math.max(14, Math.sqrt(total / peak) * 100)}%` : '6px' }} />
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex justify-between text-[13px] text-[var(--color-muted)]"><span>Today</span><span>In 2 weeks</span><span>In 30 days</span></div>
                </div>
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="flex min-w-0 flex-col gap-3" aria-label="Your commitments" data-tour="bills-list">
                    <div role="tablist" aria-label="Show" className="inline-flex w-fit max-w-full overflow-x-auto rounded-full bg-[var(--color-surface)] p-1">
                        {([['all', 'All'], ['subscriptions', 'Subscriptions'], ['bills', 'Bills'], ['trials', `Trials ${model.trials.length}`]] as const).map(([v, l]) => (
                            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => onTab(v)}
                                className={cn('h-9 shrink-0 rounded-full px-4 text-[14px] font-medium', tab === v ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>{l}</button>
                        ))}
                    </div>
                    {loading && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Loading…</p>}
                    {!loading && shown.length === 0 && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Nothing here yet.</p>}
                    {!loading && shown.length > 0 && (
                        <ul className="rounded-[20px] bg-[var(--color-surface)] px-5 py-2">
                            {shown.map((l) => {
                                const tint = categoryTint(l.category);
                                const dim = !l.active || (l.kind === 'bill' && l.paid);
                                return (
                                    <li key={l.id} className={cn('flex flex-wrap items-center gap-3 py-3.5', dim && 'opacity-60')}>
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] font-display text-[15px] font-semibold" style={{ background: tint.soft, color: tint.ink }} aria-hidden>{l.name[0]}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[16px] font-semibold">{l.name}</p>
                                            <p className={cn('text-[14px]', l.isTrial ? 'font-medium text-[var(--color-wine)]' : l.daysUntil !== null && l.daysUntil < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-secondary)]')}>
                                                {l.isTrial ? `Free trial, then ${money(l.amount)} ${cycleText[l.cycle]}. Starts charging ${when(l.daysUntil).toLowerCase()}.`
                                                    : !l.active ? 'Cancelled' : l.kind === 'bill' && l.paid ? 'Paid' : `${when(l.daysUntil)} · ${cycleText[l.cycle]}`}
                                            </p>
                                        </div>
                                        <p className="font-display text-[17px] font-semibold tabular-nums">{money(l.amount)}</p>
                                        <div className="flex gap-1">
                                            {l.kind === 'bill' && !l.paid && (
                                                <button type="button" onClick={() => onPaid(l)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-canvas)] px-3 text-[14px] hover:bg-[var(--color-surface-2)]"><Check size={14} /> Paid</button>
                                            )}
                                            {l.kind === 'subscription' && (
                                                <button type="button" onClick={() => onToggle(l)} className="inline-flex h-9 items-center rounded-full bg-[var(--color-canvas)] px-3 text-[14px] hover:bg-[var(--color-surface-2)]">{l.active ? 'Cancel' : 'Resume'}</button>
                                            )}
                                            <button type="button" onClick={() => { if (confirm === l.id) { onRemove(l); setConfirm(null); } else setConfirm(l.id); }} onBlur={() => setConfirm(null)}
                                                aria-label={confirm === l.id ? `Confirm removing ${l.name}` : `Remove ${l.name}`}
                                                className={cn('h-9 rounded-full px-3 text-[14px] hover:bg-[var(--color-surface-2)]', confirm === l.id ? 'font-medium text-[var(--color-danger)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]')}>{confirm === l.id ? 'Remove it?' : 'Remove'}</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <form onSubmit={submit} className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="addc-h" data-tour="bills-add">
                    <h2 id="addc-h" className="font-display text-[17px] font-semibold">Add one</h2>
                    <div role="radiogroup" aria-label="Kind" className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[var(--color-canvas)] p-1">
                        {(['subscription', 'bill'] as const).map((k) => (
                            <button key={k} type="button" role="radio" aria-checked={form.kind === k} onClick={() => setForm({ ...form, kind: k, cycle: 'monthly' })}
                                className={cn('h-9 rounded-full text-[14px] font-medium capitalize', form.kind === k ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-secondary)]')}>{k}</button>
                        ))}
                    </div>
                    {([['name', 'Name', form.kind === 'bill' ? 'K-Electric' : 'Netflix'], ['amount', 'Amount', '1100']] as const).map(([k, l, ph]) => (
                        <label key={k} className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">{l}
                            <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} inputMode={k === 'amount' ? 'decimal' : undefined}
                                className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]" />
                        </label>
                    ))}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">How often
                            <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as Cycle })} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]">
                                {(form.kind === 'bill' ? ['monthly', 'quarterly', 'yearly', 'one-time'] : ['weekly', 'monthly', 'yearly']).map((c) => <option key={c} value={c}>{cycleText[c as Cycle]}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">{form.kind === 'bill' ? 'Next due' : 'Started on'}
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]" />
                        </label>
                    </div>
                    {form.kind === 'subscription' && (
                        <label className="mt-3 flex items-center gap-2 text-[14px]">
                            <input type="checkbox" checked={form.isTrial} onChange={(e) => setForm({ ...form, isTrial: e.target.checked })} className="h-4 w-4 accent-[var(--color-ink)]" />
                            It is a free trial for
                            <input value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} disabled={!form.isTrial} aria-label="Trial length in days" inputMode="numeric"
                                className="h-8 w-14 rounded-[8px] border border-[var(--color-border)] px-2 text-[14px] disabled:opacity-50" /> days
                        </label>
                    )}
                    <button type="submit" disabled={saving} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                        <Plus size={16} /> {saving ? 'Saving' : `Add ${form.kind}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
