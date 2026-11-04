import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildSpending, type SpendPeriod, type SpendTx, type SpendingModel } from './spendingModel';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';

interface SpendingViewProps { transactions: SpendTx[]; money: (n: number) => string; now?: Date; loading?: boolean; basePath?: string }

const PERIODS: [SpendPeriod, string, string][] = [['week', 'Week', 'the 7 days before'], ['month', 'Month', 'the same days last month'], ['year', 'Year', 'the same time last year']];

function Bars({ bars, money }: { bars: SpendingModel['bars']; money: (n: number) => string }) {
    const [hover, setHover] = useState<number | null>(null);
    const max = Math.max(1, ...bars.map((b) => b.value));
    const lastPast = bars.reduce((i, b, j) => (b.future ? i : j), 0);
    const active = hover ?? lastPast;
    const every = bars.length > 12 ? 5 : 1;
    return (
        <figure className="relative pt-9">
            <figcaption className="pointer-events-none absolute right-0 top-0 rounded-[10px] bg-[var(--color-canvas)] px-3 py-1.5 text-[13px] tabular-nums">
                {bars[active] && `${bars[active].label}: ${money(bars[active].value)}`}
            </figcaption>
            <div className="flex h-[180px] items-end gap-[3px]" role="img" aria-label={`Highest ${money(max)}`} onMouseLeave={() => setHover(null)}>
                {bars.map((b, i) => (
                    <div key={b.key} className="flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setHover(i)}>
                        <div className={cn('w-full rounded-t-[4px]', i === lastPast ? 'bg-[var(--color-brand)]' : b.future ? 'bg-[var(--color-surface-2)]' : i === hover ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-ink)]/80')}
                            style={{ height: b.future ? 4 : `${Math.max(2, (b.value / max) * 100)}%` }} />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex gap-[3px]" aria-hidden>
                {bars.map((b, i) => <span key={b.key} className="min-w-0 flex-1 text-center text-[13px] text-[var(--color-muted)]">{i % every === 0 ? b.label : ''}</span>)}
            </div>
        </figure>
    );
}

export function SpendingView({ transactions, money, now = new Date(), loading, basePath = '' }: SpendingViewProps) {
    // Each category and shop opens Activity filtered to it, over the same period.
    const activity = (filter: Record<string, string>) => `${basePath}/transactions?${new URLSearchParams({ ...filter, period }).toString()}`;
    const [period, setPeriod] = useState<SpendPeriod>('month');
    const m = useMemo(() => buildSpending(transactions, period, now), [transactions, period, now]);
    const diff = m.total - m.previous;
    const against = PERIODS.find((p) => p[0] === period)![2];

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Spending</h1>
                <div role="tablist" aria-label="Period" className="inline-flex rounded-full bg-[var(--color-surface)] p-1">
                    {PERIODS.map(([v, l]) => (
                        <button key={v} type="button" role="tab" aria-selected={period === v} onClick={() => setPeriod(v)}
                            className={cn('h-9 rounded-full px-4 text-[14px] font-medium', period === v ? 'bg-[var(--color-ink)] text-[var(--color-on-ink)]' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]')}>{l}</button>
                    ))}
                </div>
            </header>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" data-tour="spending-total" aria-label="Total">
                {loading ? <p className="text-[15px] text-[var(--color-ink-secondary)]">Loading…</p> : (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-end">
                        <div>
                            <p className="font-display text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-[48px]">{money(m.total)}</p>
                            <p className="mt-3 text-[15px] text-[var(--color-ink-secondary)]">
                                {m.previous === 0 ? `${m.count} purchases` : (
                                    <><b className={diff > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>{money(Math.abs(diff))} {diff > 0 ? 'more' : 'less'}</b> than {against}</>
                                )}
                            </p>
                        </div>
                        <Bars bars={m.bars} money={money} />
                    </div>
                )}
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
                <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" data-tour="spending-categories" aria-labelledby="cat-h">
                    <h2 id="cat-h" className="mb-4 font-display text-[17px] font-semibold">By category</h2>
                    {m.categories.length === 0 ? <p className="text-[15px] text-[var(--color-ink-secondary)]">No spending in this period.</p> : (
                        <ul className="flex flex-col gap-4">
                            {m.categories.map((c) => {
                                const tint = categoryTint(c.name);
                                return (
                                    <li key={c.name}>
                                        <Link to={activity({ category: c.name })} className="-mx-2 block rounded-[12px] px-2 py-1 hover:bg-[var(--color-canvas)]">
                                        <div className="flex items-baseline justify-between gap-3 text-[15px]">
                                            <span className="font-medium">{c.name}</span>
                                            <span className="tabular-nums"><span className="mr-2 text-[var(--color-muted)]">{Math.round(c.share * 100)}%</span>{money(c.amount)}</span>
                                        </div>
                                        <div className="mt-2 h-2 rounded-full" style={{ background: tint.soft }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.max(2, c.share * 100)}%`, background: tint.ink }} />
                                        </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="shop-h">
                    <h2 id="shop-h" className="mb-2 font-display text-[17px] font-semibold">Where you spent most</h2>
                    {m.merchants.length === 0 ? <p className="text-[15px] text-[var(--color-ink-secondary)]">No spending in this period.</p> : (
                        <ol>
                            {m.merchants.map((s, i) => (
                                <li key={s.name}>
                                    <Link to={activity({ q: s.name })} className="-mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2.5 hover:bg-[var(--color-canvas)]">
                                    <span className="w-5 text-[14px] text-[var(--color-muted)] tabular-nums">{i + 1}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[15px] font-medium">{s.name}</span>
                                        <span className="block text-[13px] text-[var(--color-muted)]">{s.count === 1 ? 'Once' : `${s.count} times`}</span>
                                    </span>
                                    <span className="font-display text-[16px] font-semibold tabular-nums">{money(s.amount)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </div>
    );
}
