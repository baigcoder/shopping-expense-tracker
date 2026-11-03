import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildCalendar, type CalCharge, type CalDay, type CalTx } from './calendarModel';
import { cn } from '@/lib/utils';

interface CalendarViewProps { transactions: CalTx[]; charges: CalCharge[]; money: (n: number) => string; now?: Date; loading?: boolean }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView({ transactions, charges, money, now = new Date(), loading }: CalendarViewProps) {
    const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
    const [picked, setPicked] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    const cal = useMemo(() => buildCalendar(transactions, charges, month, now), [transactions, charges, month, now]);
    const day: CalDay | undefined = cal.weeks.flat().find((d) => d.date === picked);
    const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
    const short = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n)));

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Calendar</h1>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"><ChevronLeft size={18} /></button>
                    <p className="min-w-[150px] text-center font-display text-[18px] font-semibold">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                    <button type="button" onClick={() => shift(1)} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"><ChevronRight size={18} /></button>
                </div>
            </header>

            <p className="px-1 text-[15px] tabular-nums text-[var(--color-ink-secondary)]">
                Spent <b className="text-[var(--color-ink)]">{money(cal.out)}</b> · received <b className="text-[var(--color-success)]">+{money(cal.in)}</b> · still due <b className="text-[var(--color-ink)]">{money(cal.due)}</b>
            </p>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="rounded-[20px] bg-[var(--color-surface)] p-3 sm:p-5" aria-label="Month" data-tour="calendar-grid">
                    {loading ? <p className="p-4 text-[15px] text-[var(--color-ink-secondary)]">Loading…</p> : (
                        <div role="grid" aria-label={month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}>
                            <div role="row" className="grid grid-cols-7 pb-2">
                                {DAYS.map((d) => <div key={d} role="columnheader" className="text-center text-[13px] text-[var(--color-muted)]">{d}</div>)}
                            </div>
                            {cal.weeks.map((w, wi) => (
                                <div key={wi} role="row" className="grid grid-cols-7 gap-1">
                                    {w.map((d) => {
                                        const due = d.entries.filter((e) => e.kind === 'due' || e.kind === 'trial');
                                        const trial = due.some((e) => e.kind === 'trial');
                                        return (
                                            <button key={d.date} type="button" role="gridcell" aria-selected={picked === d.date} onClick={() => setPicked(d.date)}
                                                aria-label={`${new Date(`${d.date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}${d.out ? `, spent ${money(d.out)}` : ''}${d.in ? `, received ${money(d.in)}` : ''}${due.length ? `, ${due.length} due` : ''}`}
                                                className={cn('flex min-h-[52px] flex-col items-center gap-1 rounded-[12px] p-1.5 sm:items-start text-left sm:min-h-[84px] sm:p-2', d.inMonth ? 'hover:bg-[var(--color-canvas)]' : 'opacity-40',
                                                    picked === d.date && 'bg-[var(--color-canvas)] outline outline-2 outline-[var(--color-ink)]')}>
                                                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[13px] tabular-nums', d.isToday && 'bg-[var(--color-brand)] font-semibold text-[var(--color-ink)]')}>{Number(d.date.slice(8))}</span>
                                                <span className="hidden flex-col items-start gap-1 sm:flex">
                                                    {d.in > 0 && <span className="text-[13px] font-semibold leading-none text-[var(--color-success)] tabular-nums">+{short(d.in)}</span>}
                                                    {d.out > 0 && <span className="text-[13px] leading-none text-[var(--color-ink-secondary)] tabular-nums">−{short(d.out)}</span>}
                                                    {due.length > 0 && <span className={cn('rounded-full px-1.5 text-[13px] font-medium leading-[18px] text-white tabular-nums', trial ? 'bg-[var(--color-wine)]' : 'bg-[var(--color-ink)]')}>{short(due.reduce((s, e) => s + e.amount, 0))}</span>}
                                                </span>
                                                {/* Phones: a dot per kind; the day list below carries the amounts. */}
                                                <span className="flex gap-1 sm:hidden" aria-hidden>
                                                    {d.in > 0 && <i className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />}
                                                    {d.out > 0 && <i className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />}
                                                    {due.length > 0 && <i className={cn('h-1.5 w-1.5 rounded-full', trial ? 'bg-[var(--color-wine)]' : 'bg-[var(--color-ink)]')} />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-[20px] bg-[var(--color-surface)] p-5 lg:sticky lg:top-6" aria-live="polite" aria-labelledby="day-h">
                    <h2 id="day-h" className="font-display text-[17px] font-semibold">{day ? new Date(`${day.date}T00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Pick a day'}</h2>
                    {day && day.entries.length === 0 && <p className="mt-2 text-[15px] text-[var(--color-ink-secondary)]">Nothing on this day.</p>}
                    {day && day.entries.length > 0 && (
                        <ul className="mt-2">
                            {day.entries.map((e) => (
                                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <span className="min-w-0">
                                        <span className="block truncate text-[15px] font-medium">{e.label}</span>
                                        <span className={cn('block text-[13px]', e.kind === 'trial' ? 'text-[var(--color-wine)]' : 'text-[var(--color-muted)]')}>{({ spent: 'Spent', income: 'Received', due: 'Due', trial: 'Trial starts charging' } as const)[e.kind]}</span>
                                    </span>
                                    <span className={cn('font-display text-[16px] font-semibold tabular-nums', e.kind === 'income' && 'text-[var(--color-success)]')}>{e.kind === 'income' ? '+' : ''}{money(e.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
