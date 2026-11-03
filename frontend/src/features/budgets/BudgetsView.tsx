import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BudgetLine, BudgetModel } from './budgetModel';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';

export const BUDGET_CATEGORIES = ['Shopping', 'Food & Dining', 'Transport', 'Entertainment', 'Bills & Utilities', 'Health', 'Education', 'Travel', 'Other'];

interface BudgetsViewProps {
    model: BudgetModel;
    money: (n: number) => string;
    loading?: boolean;
    saving?: boolean;
    onAdd: (category: string, amount: number) => void;
    onRemove: (line: BudgetLine) => void;
}

type Filter = 'all' | 'watch' | 'ok';

const paceText = (l: BudgetLine, money: (n: number) => string) =>
    l.pace === 'over' ? `Over by ${money(l.spent - l.amount)}`
        : l.pace === 'fast' ? `At this pace: ${money(l.projected)} by month end${l.projected > l.amount ? `, ${money(l.projected - l.amount)} over` : ''}`
            : `${money(l.remaining)} left`;

export function BudgetsView({ model, money, loading, saving, onAdd, onRemove }: BudgetsViewProps) {
    const [filter, setFilter] = useState<Filter>('all');
    const [category, setCategory] = useState(BUDGET_CATEGORIES[0]);
    const [amount, setAmount] = useState('');
    const watch = model.lines.filter((l) => l.pace !== 'ok');
    const shown = filter === 'all' ? model.lines : filter === 'watch' ? watch : model.lines.filter((l) => l.pace === 'ok');
    const free = BUDGET_CATEGORIES.filter((c) => !model.lines.some((l) => l.category === c));
    const overall = model.projected > model.total && model.total > 0;

    const add = (e: FormEvent) => {
        e.preventDefault();
        const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0) return;
        onAdd(category, n);
        setAmount('');
    };

    return (
        <div className="flex flex-col gap-4">
            <header className="pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Budgets</h1>
            </header>

            <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-[20px] bg-[var(--color-surface)] p-5 sm:grid-cols-3 sm:p-6" aria-label="This month" data-tour="budgets-total">
                <div>
                    <p className="text-[14px] text-[var(--color-ink-secondary)]">Spent of all budgets</p>
                    <p className="mt-1 font-display text-[32px] font-bold leading-none tabular-nums">{money(model.spent)}</p>
                    <p className="mt-1 text-[14px] text-[var(--color-muted)]">of {money(model.total)}</p>
                </div>
                <div>
                    <p className="text-[14px] text-[var(--color-ink-secondary)]">Left this month</p>
                    <p className={cn('mt-1 font-display text-[32px] font-bold leading-none tabular-nums', model.total - model.spent < 0 && 'text-[var(--color-danger)]')}>{money(model.total - model.spent)}</p>
                </div>
                <div>
                    <p className="text-[14px] text-[var(--color-ink-secondary)]">At this pace, by month end</p>
                    <p className={cn('mt-1 font-display text-[32px] font-bold leading-none tabular-nums', overall && 'text-[var(--color-danger)]')}>{money(model.projected)}</p>
                    {overall && <p className="mt-1 text-[14px] text-[var(--color-danger)]">{money(model.projected - model.total)} over</p>}
                </div>
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="flex min-w-0 flex-col gap-3" aria-label="Your budgets" data-tour="budgets-list">
                    <div role="tablist" aria-label="Show" className="inline-flex w-fit rounded-full bg-[var(--color-surface)] p-1">
                        {([['all', `All ${model.lines.length}`], ['watch', `Watch ${watch.length}`], ['ok', 'On track']] as const).map(([v, l]) => (
                            <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)}
                                className={cn('h-9 rounded-full px-4 text-[14px] font-medium', filter === v ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>{l}</button>
                        ))}
                    </div>
                    {loading && <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Loading budgets…</p>}
                    {!loading && shown.length === 0 && (
                        <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">
                            {model.lines.length ? 'Nothing in this view.' : 'No budgets yet. Pick a category on the right and set a monthly limit.'}
                        </p>
                    )}
                    {!loading && shown.map((l, li) => {
                        const tint = categoryTint(l.category);
                        return (
                            <article key={l.id} className="rounded-[20px] bg-[var(--color-surface)] p-5">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] font-display text-[15px] font-semibold" style={{ background: tint.soft, color: tint.ink }} aria-hidden>{l.category[0]}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                                            <h2 className="font-display text-[17px] font-semibold">{l.category}</h2>
                                            <p className="text-[15px] tabular-nums text-[var(--color-ink-secondary)]"><b className={cn('font-display text-[18px] text-[var(--color-ink)]', l.pace === 'over' && 'text-[var(--color-danger)]')}>{money(l.spent)}</b> of {money(l.amount)}</p>
                                        </div>
                                        <div className={cn("relative h-2.5 rounded-full", li === 0 ? "mt-8" : "mt-3")} style={{ background: tint.soft }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.progress)}%`, background: l.pace === 'over' ? 'var(--color-danger)' : tint.ink }} />
                                            <span className="absolute -top-1 h-[18px] w-[2px] rounded-full bg-[var(--color-ink)]" style={{ left: `${model.monthProgress}%` }} title={`Day ${model.day} of ${model.daysInMonth}`} aria-hidden />
                                            {li === 0 && <span className="absolute -top-6 -translate-x-1/2 text-[13px] font-medium" style={{ left: `${model.monthProgress}%` }}>Today</span>}
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            <p className={cn('text-[14px]', l.pace === 'over' ? 'text-[var(--color-danger)]' : l.pace === 'fast' ? 'font-medium text-[var(--cat-food)]' : 'text-[var(--color-ink-secondary)]')}>{paceText(l, money)}</p>
                                            <button type="button" onClick={() => onRemove(l)} aria-label={`Remove the ${l.category} budget`}
                                                className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <form onSubmit={add} className="rounded-[20px] bg-[var(--color-surface)] p-5" data-tour="budgets-add" aria-labelledby="add-h">
                    <h2 id="add-h" className="font-display text-[17px] font-semibold">Add a budget</h2>
                    <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-medium">Category
                        <select value={free.includes(category) ? category : free[0] || ''} onChange={(e) => setCategory(e.target.value)} disabled={!free.length}
                            className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]">
                            {free.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </label>
                    <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium">Monthly limit
                        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000"
                            className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] tabular-nums" />
                    </label>
                    <button type="submit" disabled={saving || !free.length}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                        <Plus size={16} /> {saving ? 'Saving' : 'Add budget'}
                    </button>
                </form>
            </div>
        </div>
    );
}
