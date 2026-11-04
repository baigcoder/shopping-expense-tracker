import { useMemo, useState } from 'react';
import { buildTwin, type TwinCharge, type TwinTx, type WhatIf } from './twinModel';
import { cn } from '@/lib/utils';

export interface TwinAlert { id: string; title: string; message: string; urgent: boolean }

interface TwinViewProps {
    transactions: TwinTx[];
    charges: TwinCharge[];
    alerts?: TwinAlert[];
    money: (n: number) => string;
    now?: Date;
    loading?: boolean;
}

const W = 720, H = 220, PAD = 24;

function Forecast({ base, plan, money }: { base: ReturnType<typeof buildTwin>; plan: ReturnType<typeof buildTwin> | null; money: (n: number) => string }) {
    const all = [...base.days, ...(plan?.days || [])].map((d) => d.balance);
    const max = Math.max(1, ...all), min = Math.min(0, ...all);
    const x = (d: number) => (d / 60) * W;
    const y = (b: number) => PAD + (1 - (b - min) / (max - min)) * (H - PAD * 2);
    const path = (days: { day: number; balance: number }[]) => days.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ');
    const end = (plan || base).days[60];
    return (
        <figure>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Balance over the next 60 days, ending at ${money(end.balance)}`}>
                <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="4 4" />
                <path d={path(base.days)} fill="none" stroke={plan ? 'var(--color-border-strong)' : 'var(--color-ink)'} strokeWidth={plan ? 2 : 2.5} />
                {plan && <path d={path(plan.days)} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />}
                <circle cx={x(0)} cy={y((plan || base).days[0].balance)} r={5} fill="var(--color-brand)" />
            </svg>
            {/* Axis labels in HTML so they keep their size when the chart scales down. */}
            <div className="mt-1 flex justify-between text-[13px] text-[var(--color-muted)]" aria-hidden><span>Today</span><span>30 days</span><span>60 days</span></div>
        </figure>
    );
}

export function TwinView({ transactions, charges, alerts = [], money, now, loading }: TwinViewProps) {
    const [whatIf, setWhatIf] = useState<WhatIf>({ cutCategory: null, cutAmount: 0, cancelled: [], purchase: 0 });
    const base = useMemo(() => buildTwin(transactions, charges, { cutCategory: null, cutAmount: 0, cancelled: [], purchase: 0 }, now), [transactions, charges, now]);
    const changed = whatIf.cutAmount > 0 || whatIf.cancelled.length > 0 || whatIf.purchase > 0;
    const plan = useMemo(() => (changed ? buildTwin(transactions, charges, whatIf, now) : null), [changed, transactions, charges, whatIf, now]);
    const shown = plan || base;
    const cat = whatIf.cutCategory || base.categories[0]?.category || null;
    const catMax = base.categories.find((c) => c.category === cat)?.monthly || 0;
    const subs = charges.filter((c) => c.kind === 'subscription' && c.active);

    const runway = (m: typeof base) => (m.runwayDays === null ? 'past 60 days' : `${m.runwayDays} days`);

    if (loading) return <p className="rounded-[20px] bg-[var(--color-surface)] p-6 text-[15px] text-[var(--color-ink-secondary)]">Working out your forecast…</p>;

    return (
        <div className="flex flex-col gap-4">
            <h1 className="pb-2 font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Money Twin</h1>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="twin-h" data-tour="twin-forecast">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 id="twin-h" className="text-[15px] text-[var(--color-ink-secondary)]">Your money lasts</h2>
                        <p className={cn('mt-1 font-display text-[clamp(36px,4.5vw,56px)] font-bold leading-none tabular-nums', shown.runwayDays !== null && shown.runwayDays < 14 && 'text-[var(--color-danger)]')}>{runway(shown)}</p>
                        {plan && <p className="mt-2 text-[15px] text-[var(--color-ink-secondary)]">from {runway(base)}{plan.monthlySaved > 0 && <>, saving <b className="text-[var(--color-success)] tabular-nums">{money(plan.monthlySaved)}</b> a month</>}</p>}
                    </div>
                    <dl className="flex gap-8 text-right">
                        <div><dt className="text-[14px] text-[var(--color-ink-secondary)]">Lowest point</dt><dd className="font-display text-[20px] font-semibold tabular-nums">{money(shown.lowest.balance)}</dd></div>
                        <div><dt className="text-[14px] text-[var(--color-ink-secondary)]">In 60 days</dt><dd className="font-display text-[20px] font-semibold tabular-nums">{money(shown.days[60].balance)}</dd></div>
                    </dl>
                </div>
                <div className="mt-6"><Forecast base={base} plan={plan} money={money} /></div>
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="grid gap-4 rounded-[20px] bg-[var(--color-surface)] p-5 sm:grid-cols-3 sm:p-6" aria-labelledby="whatif-h" data-tour="twin-whatif">
                    <h2 id="whatif-h" className="font-display text-[17px] font-semibold sm:col-span-3">What if</h2>
                    <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium" htmlFor="cut-cat">I spend less on</label>
                        <select id="cut-cat" value={cat || ''} onChange={(e) => setWhatIf({ ...whatIf, cutCategory: e.target.value, cutAmount: 0 })} className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[15px]">
                            {base.categories.map((c) => <option key={c.category}>{c.category}</option>)}
                        </select>
                        <input type="range" min={0} max={Math.max(0, Math.round(catMax))} step={500} value={whatIf.cutAmount} aria-label={`Monthly cut on ${cat}`}
                            onChange={(e) => setWhatIf({ ...whatIf, cutCategory: cat, cutAmount: Number(e.target.value) })} className="accent-[var(--color-ink)]" />
                        <p className="text-[15px] font-semibold tabular-nums">{money(whatIf.cutAmount)} a month</p>
                    </div>
                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-2 text-[14px] font-medium">I cancel</legend>
                        {subs.length === 0 && <p className="text-[14px] text-[var(--color-muted)]">No subscriptions</p>}
                        {subs.map((s) => (
                            <label key={s.id} className="flex items-center gap-2 text-[15px]">
                                <input type="checkbox" checked={whatIf.cancelled.includes(s.id)} className="h-4 w-4 accent-[var(--color-ink)]"
                                    onChange={(e) => setWhatIf({ ...whatIf, cancelled: e.target.checked ? [...whatIf.cancelled, s.id] : whatIf.cancelled.filter((x) => x !== s.id) })} />
                                <span className="truncate">{s.name}</span>
                            </label>
                        ))}
                    </fieldset>
                    <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium" htmlFor="buy">I buy something today for</label>
                        <input id="buy" inputMode="decimal" value={whatIf.purchase || ''} placeholder="30000" onChange={(e) => setWhatIf({ ...whatIf, purchase: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                            className="h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px] tabular-nums" />
                        {changed && <button type="button" onClick={() => setWhatIf({ cutCategory: null, cutAmount: 0, cancelled: [], purchase: 0 })} className="mt-1 w-fit text-[14px] font-medium underline underline-offset-4">Back to today</button>}
                    </div>
                </section>

                <section className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="watch-h">
                    <h2 id="watch-h" className="font-display text-[17px] font-semibold">Watch out</h2>
                    {alerts.length === 0 ? <p className="mt-2 text-[15px] text-[var(--color-ink-secondary)]">Nothing unusual.</p> : (
                        <ul className="mt-3 flex flex-col gap-4">
                            {alerts.slice(0, 4).map((a) => (
                                <li key={a.id}>
                                    <p className={cn('text-[15px] font-semibold', a.urgent && 'text-[var(--color-danger)]')}>{a.title}</p>
                                    <p className="mt-0.5 text-[14px] leading-relaxed text-[var(--color-ink-secondary)]">{a.message}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
