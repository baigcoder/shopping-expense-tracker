import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GoalLine, buildGoals } from './goalsModel';
import { cn } from '@/lib/utils';

export interface GoalDraft { name: string; target: number; deadline: string | null }

interface GoalsViewProps {
    model: ReturnType<typeof buildGoals>;
    money: (n: number) => string;
    loading?: boolean;
    saving?: boolean;
    onAdd: (g: GoalDraft) => void;
    onDeposit: (g: GoalLine, amount: number) => void;
    onRemove: (g: GoalLine) => void;
}

const by = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

function Deposit({ goal, money, onDeposit }: { goal: GoalLine; money: (n: number) => string; onDeposit: GoalsViewProps['onDeposit'] }) {
    const [amount, setAmount] = useState(goal.perMonth ? String(goal.perMonth) : '');
    return (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(amount); if (n > 0) { onDeposit(goal, n); setAmount(''); } }}>
            <label className="sr-only" htmlFor={`dep-${goal.id}`}>Amount to add to {goal.name}</label>
            <input id={`dep-${goal.id}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={money(5000)}
                className="h-10 w-32 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[15px] tabular-nums" />
            <button type="submit" className="h-10 whitespace-nowrap rounded-full bg-[var(--color-ink)] px-4 text-[14px] font-semibold text-white hover:bg-black">Add money</button>
        </form>
    );
}

export function GoalsView({ model, money, loading, saving, onAdd, onDeposit, onRemove }: GoalsViewProps) {
    const [form, setForm] = useState({ name: '', target: '', deadline: '' });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const target = Number(form.target);
        if (!form.name.trim() || !(target > 0)) return;
        onAdd({ name: form.name.trim(), target, deadline: form.deadline || null });
        setForm({ name: '', target: '', deadline: '' });
    };

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Goals</h1>
                {model.perMonth > 0 && (
                    <p className="text-[15px] text-[var(--color-ink-secondary)]"><b className="font-display text-[20px] text-[var(--color-ink)] tabular-nums">{money(model.perMonth)}</b> a month keeps every goal on time</p>
                )}
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="flex min-w-0 flex-col gap-3" aria-label="Your goals" data-tour="goals-list">
                    {loading && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Loading…</p>}
                    {!loading && model.lines.length === 0 && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">No goals yet.</p>}
                    {!loading && model.lines.map((g) => (
                        <article key={g.id} className={cn('rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6', g.done && 'bg-[var(--color-sage-soft)]')}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                <h2 className="font-display text-[20px] font-semibold tracking-tight">{g.name}</h2>
                                <p className="text-[15px] tabular-nums text-[var(--color-ink-secondary)]"><b className="font-display text-[20px] text-[var(--color-ink)]">{money(g.saved)}</b> of {money(g.target)}</p>
                            </div>
                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                                <div className={cn('h-full rounded-full', g.done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-ink)]')} style={{ width: `${g.pct}%` }} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <p className={cn('text-[15px]', g.late ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-secondary)]')}>
                                    {g.done ? 'Reached' : g.late ? `${money(g.left)} short, the date has passed`
                                        : g.perMonth ? <><b className="text-[var(--color-ink)] tabular-nums">{money(g.perMonth)}</b> a month to reach it by {by(g.deadline!)}</>
                                            : `${money(g.left)} to go`}
                                </p>
                                <div className="flex items-center gap-1">
                                    {!g.done && <Deposit goal={g} money={money} onDeposit={onDeposit} />}
                                    <button type="button" onClick={() => onRemove(g)} aria-label={`Remove ${g.name}`} className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <form onSubmit={submit} className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="goal-h" data-tour="goals-add">
                    <h2 id="goal-h" className="font-display text-[17px] font-semibold">New goal</h2>
                    <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">Name
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New laptop" className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]" />
                    </label>
                    <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">Amount
                        <input inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="300000" className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] tabular-nums" />
                    </label>
                    <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">By
                        <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]" />
                    </label>
                    <button type="submit" disabled={saving} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                        <Plus size={16} /> {saving ? 'Saving' : 'Add goal'}
                    </button>
                </form>
            </div>
        </div>
    );
}
