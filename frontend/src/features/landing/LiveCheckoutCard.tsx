import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;

const BUDGETS: Record<string, { spent: number; limit: number }> = {
    Shopping: { spent: 7490, limit: 15000 },
    Electronics: { spent: 0, limit: 20000 },
    Gifts: { spent: 2000, limit: 10000 },
    Food: { spent: 29580, limit: 40000 },
    Subscriptions: { spent: 4100, limit: 6000 },
};

const QUEUE = [
    { merchant: 'Daraz', host: 'daraz.pk/checkout', item: 'Anker power bank 20,000 mAh', amount: 8499, category: 'Shopping', options: ['Shopping', 'Electronics', 'Gifts'] },
    { merchant: 'Foodpanda', host: 'foodpanda.pk/order', item: 'Dinner from Kolachi, 2 people', amount: 3260, category: 'Food', options: ['Food', 'Gifts'] },
    { merchant: 'Spotify', host: 'spotify.com/pk/purchase', item: 'Premium Duo, billed monthly', amount: 579, category: 'Subscriptions', options: ['Subscriptions', 'Gifts'] },
];

const START_SAFE = 159772;

/** The hero's working fragment: the one interaction that is the product. */
export function LiveCheckoutCard() {
    const [i, setI] = useState(0);
    const [safe, setSafe] = useState(START_SAFE);
    const [spent, setSpent] = useState(() => Object.fromEntries(Object.entries(BUDGETS).map(([k, v]) => [k, v.spent])));
    const [category, setCategory] = useState(QUEUE[0].category);
    const [done, setDone] = useState<null | 'approved' | 'dismissed'>(null);

    const item = QUEUE[i % QUEUE.length];
    const budget = BUDGETS[category];
    const after = spent[category] + item.amount;
    const over = after > budget.limit;

    const next = () => {
        const n = QUEUE[(i + 1) % QUEUE.length];
        setI(i + 1);
        setCategory(n.category);
        setDone(null);
    };
    const approve = () => { setSafe((s) => s - item.amount); setSpent((s) => ({ ...s, [category]: after })); setDone('approved'); };
    const restart = () => { setI(0); setSafe(START_SAFE); setSpent(Object.fromEntries(Object.entries(BUDGETS).map(([k, v]) => [k, v.spent]))); setCategory(QUEUE[0].category); setDone(null); };

    return (
        <div data-ui className="w-full max-w-[440px] rounded-[22px] bg-[var(--color-canvas)] p-5 text-[var(--color-ink)] sm:p-6" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-[13px] text-[var(--color-ink-secondary)]">
                <span className="truncate">Caught at {item.host}</span>
                <span className="shrink-0 rounded-full bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-ink)]">
                    {done === 'approved' ? 'Approved' : done === 'dismissed' ? 'Dismissed' : 'Waiting for you'}
                </span>
            </div>

            <div className="mt-4 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--cat-shopping-soft)] font-display text-[17px] font-semibold text-[var(--cat-shopping)]" aria-hidden>{item.merchant[0]}</span>
                <div className="min-w-0 flex-1">
                    <p className="font-display text-[18px] font-semibold">{item.merchant}</p>
                    <p className="truncate text-[14px] text-[var(--color-ink-secondary)]">{item.item}</p>
                </div>
                <p className="font-display text-[20px] font-bold tabular-nums">{rs(item.amount)}</p>
            </div>

            <label className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-[var(--color-surface)] px-3.5 py-2.5 text-[14px]">
                <span className="text-[var(--color-ink-secondary)]">Category</span>
                <select value={category} disabled={done !== null} onChange={(e) => setCategory(e.target.value)}
                    className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[14px] font-medium">
                    {item.options.map((o) => <option key={o}>{o}</option>)}
                </select>
            </label>

            <dl className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[12px] bg-[var(--color-surface)] p-3.5">
                    <dt className="text-[13px] text-[var(--color-ink-secondary)]">Safe to spend</dt>
                    <dd className="mt-1 font-display text-[18px] font-semibold tabular-nums">{rs(done === 'approved' ? safe : safe - item.amount)}</dd>
                    <dd className="text-[13px] text-[var(--color-muted)]">{done === 'approved' ? 'now' : `after approving, from ${rs(safe)}`}</dd>
                </div>
                <div className="rounded-[12px] bg-[var(--color-surface)] p-3.5">
                    <dt className="text-[13px] text-[var(--color-ink-secondary)]">{category} budget</dt>
                    <dd className={cn('mt-1 font-display text-[18px] font-semibold tabular-nums', over && 'text-[var(--color-danger)]')}>{rs(done === 'approved' ? spent[category] : after)}</dd>
                    <dd className="text-[13px] text-[var(--color-muted)]">of {rs(budget.limit)}{over ? ', over' : ''}</dd>
                </div>
            </dl>

            <div className="mt-4 flex gap-2">
                {done === null ? (
                    <>
                        <button type="button" onClick={() => setDone('dismissed')}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--color-surface)] text-[15px] font-medium hover:bg-[var(--color-surface-2)]">
                            <X size={16} /> Not mine
                        </button>
                        <button type="button" onClick={approve}
                            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] text-[15px] font-semibold text-white hover:bg-black">
                            <Check size={16} /> Approve
                        </button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={restart} aria-label="Start over"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]">
                            <RotateCcw size={16} />
                        </button>
                        <button type="button" onClick={next}
                            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[var(--color-ink)] text-[15px] font-semibold text-white hover:bg-black">
                            Next purchase
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
