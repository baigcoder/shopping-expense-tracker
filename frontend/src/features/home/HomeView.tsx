import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import type { HomeModel, PendingLine } from './homeModel';
import { categoryTint } from '@/components/app/categoryTint';
import { cn } from '@/lib/utils';

interface HomeViewProps {
    model: HomeModel;
    firstName: string;
    money: (n: number) => string;
    basePath?: string;
    busyId?: string | null;
    onApprove: (item: PendingLine) => void;
    onDismiss: (item: PendingLine) => void;
    onAdd: () => void;
}

const greeting = (d = new Date()) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening');

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

const relDays = (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`);

function Panel({ title, action, children, className, tour }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; tour?: string }) {
    return (
        <section className={cn('rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6', className)} data-tour={tour} aria-labelledby={`h-${title}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id={`h-${title}`} className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function MerchantMark({ name, category }: { name: string; category: string }) {
    const tint = categoryTint(category);
    return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-semibold"
            style={{ background: tint.soft, color: tint.ink }} aria-hidden>
            {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}

function SpendChart({ daily, money }: { daily: HomeModel['daily']; money: (n: number) => string }) {
    const [hover, setHover] = useState<number | null>(null);
    const w = 640, h = 180, padL = 4, padB = 22;
    const max = Math.max(1, ...daily.map((d) => d.spent));
    const step = (w - padL) / Math.max(1, daily.length - 1);
    const pts = daily.map((d, i) => [padL + i * step, (h - padB) - (d.spent / max) * (h - padB - 12)] as const);
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const active = hover ?? daily.length - 1;
    return (
        <figure className="relative">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full" role="img"
                aria-label={`Spending over the last 14 days, highest ${money(max)} in a day`}
                onMouseLeave={() => setHover(null)}>
                {[0.33, 0.66, 1].map((f) => (
                    <line key={f} x1={0} x2={w} y1={(h - padB) * f} y2={(h - padB) * f} stroke="var(--color-surface-2)" strokeWidth={1} />
                ))}
                <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map(([x], i) => (
                    <rect key={i} x={x - step / 2} y={0} width={step} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />
                ))}
                <circle cx={pts[active][0]} cy={pts[active][1]} r={5} fill="var(--color-brand)" stroke="var(--color-surface)" strokeWidth={2} />
                {daily.map((d, i) => (i % 3 === 1 || i === daily.length - 1) && (
                    <text key={d.date} x={pts[i][0]} y={h - 4} textAnchor="middle" fontSize={12} fill="var(--color-muted)">
                        {i === daily.length - 1 ? 'Today' : dayLabel(d.date)}
                    </text>
                ))}
            </svg>
            <figcaption className="pointer-events-none absolute right-0 top-0 rounded-[10px] bg-[var(--color-canvas)] px-3 py-1.5 text-[13px] tabular-nums">
                {daily[active] && `${dayLabel(daily[active].date)}: ${money(daily[active].spent)}`}
            </figcaption>
        </figure>
    );
}

// First run: the four things that make the numbers on Home mean something.
function Setup({ basePath, hasBudgets, hasBills }: { basePath: string; hasBudgets: boolean; hasBills: boolean }) {
    const steps = [
        { label: 'Install the browser extension', to: '/extension-health', done: false },
        { label: 'Add your bank accounts', to: '/cards', done: false },
        { label: 'Add rent, bills and subscriptions', to: '/subscriptions', done: hasBills },
        { label: 'Set a monthly budget', to: '/budgets', done: hasBudgets },
    ];
    return (
        <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="h-setup" data-tour="safe">
            <h2 id="h-setup" className="font-display text-[22px] font-bold tracking-tight">Set up Cashly</h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {steps.map((st, i) => (
                    <li key={st.to}>
                        <Link to={`${basePath}${st.to}`} className="flex h-full items-center gap-3 rounded-[14px] bg-[var(--color-canvas)] p-4 text-[15px] font-medium hover:bg-[var(--color-surface-2)]">
                            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums', st.done ? 'bg-[var(--color-success)] text-[var(--color-on-ink)]' : 'bg-[var(--color-surface)]')}>
                                {st.done ? <Check size={14} aria-label="Done" /> : i + 1}
                            </span>
                            <span className={cn('flex-1', st.done && 'text-[var(--color-muted)] line-through')}>{st.label}</span>
                            <ArrowRight size={16} aria-hidden />
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}

export function HomeView({ model, firstName, money, basePath = '', busyId, onApprove, onDismiss, onAdd }: HomeViewProps) {
    const budgetLines = useMemo(() => model.categories.filter((c) => c.budget !== null).slice(0, 5), [model.categories]);
    const figures: { label: string; value: string; note?: string; positive?: boolean }[] = [
        { label: 'Spent this month', value: money(model.monthOut), },
        { label: 'Money in', value: `+${money(model.monthIn)}`, positive: true },
        { label: 'Spent last month', value: money(model.lastMonthOut) },
    ];

    return (
        <div className="flex flex-col gap-4">
            <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <div>
                    <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">{greeting()}, {firstName}</h1>
                </div>
                <button type="button" onClick={onAdd} data-tour="add"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]">
                    <Plus size={18} /> Add a purchase
                </button>
            </header>

            {model.isNew ? <Setup basePath={basePath} hasBudgets={model.budgetTotal > 0} hasBills={model.upcoming.length > 0} /> : (
            /* The question this screen answers first */
            <section className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" data-tour="safe" aria-labelledby="h-safe">
                <div className="flex flex-col justify-between gap-6">
                    <div>
                        <h2 id="h-safe" className="text-[15px] text-[var(--color-ink-secondary)]">Safe to spend</h2>
                        <p className="mt-1 font-display text-[clamp(40px,5vw,60px)] font-bold leading-none tracking-tight tabular-nums">{money(model.safeToSpend)}</p>
                        <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-ink-secondary)] tabular-nums">
                            {money(model.balance)} {model.balanceFrom === 'accounts' ? 'in your accounts' : 'balance'}
                            {model.committed30 > 0 && <> − {money(model.committed30)} due in 30 days</>}
                            {model.plannedSavings > 0 && <> − {money(model.plannedSavings)} for goals</>}
                        </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 rounded-[14px] bg-[var(--color-canvas)] p-4">
                        <div>
                            <dt className="text-[13px] text-[var(--color-muted)]">Lasts at your pace</dt>
                            <dd className="mt-0.5 font-display text-[22px] font-semibold tabular-nums">{model.runwayDays === null ? '—' : `${model.runwayDays} days`}</dd>
                        </div>
                        <div>
                            <dt className="text-[13px] text-[var(--color-muted)]">Waiting for you</dt>
                            <dd className="mt-0.5 font-display text-[22px] font-semibold tabular-nums">{model.pending.length} {model.pending.length === 1 ? 'purchase' : 'purchases'}</dd>
                        </div>
                    </dl>
                </div>
                <div className="min-w-0">
                    <dl className="grid gap-2 sm:grid-cols-3">
                        {figures.map((t) => (
                            <div key={t.label} className="flex items-baseline justify-between gap-3 rounded-[12px] bg-[var(--color-canvas)] px-3 py-2.5 sm:block">
                                <dt className="text-[13px] text-[var(--color-muted)]">{t.label}</dt>
                                <dd className={cn('font-display text-[19px] font-semibold tabular-nums', t.positive && 'text-[var(--color-success)]')}>{t.value}</dd>
                                {t.note && <dd className="hidden text-[13px] text-[var(--color-muted)] sm:block">{t.note}</dd>}
                            </div>
                        ))}
                    </dl>
                    <div className="mt-4">
                        <SpendChart daily={model.daily} money={money} />
                    </div>
                </div>
            </section>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <div className="flex flex-col gap-4">
                <Panel title="Waiting for your approval" tour="inbox"
                    action={<Link to={`${basePath}/transaction-inbox`} className="inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-ink)] hover:underline">Open inbox <ArrowRight size={14} /></Link>}>
                    {model.pending.length === 0 ? (
                        <p className="rounded-[14px] bg-[var(--color-canvas)] p-5 text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">
                            Nothing is waiting. When the browser extension catches a checkout, it lands here first and only counts once you approve it.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {model.pending.slice(0, 4).map((item) => (
                                <li key={item.id} className="rounded-[14px] bg-[var(--color-canvas)] p-4">
                                    <div className="flex items-start gap-3">
                                        <MerchantMark name={item.merchant} category={item.category} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-semibold">{item.merchant}</p>
                                            <p className="truncate text-[14px] text-[var(--color-ink-secondary)]">{item.description}</p>
                                        </div>
                                        <p className={cn('shrink-0 font-display text-[17px] font-semibold tabular-nums', item.type === 'income' && 'text-[var(--color-success)]')}>{item.type === 'income' ? '+' : ''}{money(item.amount)}</p>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 sm:pl-[52px]">
                                        <p className="text-[13px] text-[var(--color-muted)]">
                                            Safe after <span className="font-semibold text-[var(--color-ink)] tabular-nums">{money(item.safeAfter)}</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => onDismiss(item)} disabled={busyId === item.id}
                                                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14px] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] disabled:opacity-50">
                                                <X size={15} /> Not mine
                                            </button>
                                            <button type="button" onClick={() => onApprove(item)} disabled={busyId === item.id}
                                                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-ink)] px-4 text-[14px] font-semibold text-[var(--color-on-ink)] hover:opacity-90 disabled:opacity-50">
                                                <Check size={15} /> {busyId === item.id ? 'Saving' : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Recent activity" tour="recent"
                    action={<Link to={`${basePath}/transactions`} className="inline-flex items-center gap-1 text-[14px] font-medium hover:underline">All activity <ArrowRight size={14} /></Link>}>
                    {model.recent.length === 0 ? (
                        <p className="text-[15px] text-[var(--color-ink-secondary)]">Approved purchases and income show up here.</p>
                    ) : (
                        <table className="w-full text-[14px]">
                            <caption className="sr-only">Latest approved transactions</caption>
                            <tbody>
                                {model.recent.map((t) => (
                                    <tr key={t.id}>
                                        <td className="py-2.5 pr-3">
                                            <div className="flex items-center gap-3">
                                                <MerchantMark name={t.description} category={t.category} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{t.description}</p>
                                                    <p className="text-[13px] text-[var(--color-muted)]">{t.category} · {new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={cn('py-2.5 text-right font-display text-[16px] font-semibold tabular-nums', t.type === 'income' && 'text-[var(--color-success)]')}>
                                            {t.type === 'income' ? '+' : ''}{money(Math.abs(t.amount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Panel>
                </div>
                <div className="flex flex-col gap-4">
                <Panel title="Budgets" tour="budgets"
                    action={<Link to={`${basePath}/budgets`} className="inline-flex items-center gap-1 text-[14px] font-medium hover:underline">All budgets <ArrowRight size={14} /></Link>}>
                    {budgetLines.length === 0 ? (
                        <p className="rounded-[14px] bg-[var(--color-canvas)] p-5 text-[15px] text-[var(--color-ink-secondary)]">No budgets yet. Set one and Cashly warns you before you go over.</p>
                    ) : (
                        <ul className="flex flex-col gap-4">
                            {budgetLines.map((c) => {
                                const pct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
                                const over = c.budget !== null && c.spent > c.budget;
                                const tint = categoryTint(c.category);
                                return (
                                    <li key={c.category}>
                                        <div className="flex items-baseline justify-between gap-3 text-[14px]">
                                            <span className="font-medium">{c.category}</span>
                                            <span className="tabular-nums text-[var(--color-ink-secondary)]">
                                                <span className={cn('font-semibold', over ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]')}>{money(c.spent)}</span> of {money(c.budget || 0)}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: tint.soft }}>
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? 'var(--color-danger)' : tint.ink }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>
                <Panel title="Coming up" tour="upcoming"
                    action={<Link to={`${basePath}/subscriptions`} className="inline-flex items-center gap-1 text-[14px] font-medium hover:underline">Bills <ArrowRight size={14} /></Link>}>
                    {model.upcoming.length === 0 ? (
                        <p className="text-[15px] text-[var(--color-ink-secondary)]">No bills or renewals in the next 30 days.</p>
                    ) : (
                        <ul className="flex flex-col">
                            {model.upcoming.slice(0, 5).map((u) => (
                                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-[15px] font-medium">{u.name}</p>
                                        <p className={cn('text-[13px]', u.isTrial ? 'text-[var(--color-wine)] font-medium' : 'text-[var(--color-muted)]')}>
                                            {u.isTrial ? `Free trial ends ${relDays(u.daysUntil).toLowerCase()}` : relDays(u.daysUntil)}
                                        </p>
                                    </div>
                                    <p className="font-display text-[16px] font-semibold tabular-nums">{money(u.amount)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                </div>
            </div>
        </div>
    );
}
