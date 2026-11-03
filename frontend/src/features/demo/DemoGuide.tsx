import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { useDemo } from './DemoContext';
import { cn } from '@/lib/utils';

interface Step { route: string; target?: string; title: string; body: string; tryIt?: string }

export const DEMO_STEPS: Step[] = [
    { route: '/demo/dashboard', target: 'safe', title: 'Start with one number', body: 'Safe to spend is your money after the bills due in the next 30 days and what you set aside for goals. It is the answer to "can I afford this?"' },
    { route: '/demo/dashboard', target: 'inbox', title: 'Purchases wait for you', body: 'The browser extension catches every online checkout and holds it here. Nothing counts until you say so.', tryIt: 'Press Approve on Daraz and watch Safe to spend drop. Press Not mine on anything that is not yours.' },
    { route: '/demo/dashboard', target: 'budgets', title: 'Budgets fill as you approve', body: 'Each approved purchase lands in its category. The bar turns red only when you actually go over.' },
    { route: '/demo/dashboard', target: 'upcoming', title: 'Trials before they charge', body: 'Free trials and bills appear days ahead. Adobe Express ends in two days here, so there is still time to cancel.' },
    { route: '/demo/dashboard', target: 'recent', title: 'A ledger you trust', body: 'Only approved purchases and income live here, so every chart and every AI answer is built on numbers you checked.' },
    { route: '/demo/dashboard', target: 'add', title: 'Cash and offline spending', body: 'Paid cash or bought in a shop? Add it by hand and it follows the same path as everything else.' },
    { route: '/demo/transaction-inbox', target: 'inbox-list', title: 'The full review inbox', body: 'Each purchase says where it came from and how sure Cashly is. PayPro 4471 is unclear, so it says check the details.', tryIt: 'Press Edit on PayPro 4471, give it a name and a category, then Save and approve.' },
    { route: '/demo/transaction-inbox', target: 'inbox-list', title: 'Duplicates are caught', body: 'The Imtiaz receipt from a statement import has the same total as a purchase you already approved. Merge keeps one, so it is never counted twice.' },
    { route: '/demo/transaction-inbox', target: 'inbox-confident', title: 'Clear the easy ones at once', body: 'Purchases Cashly is sure about can be approved together. On a keyboard: A approves, R says not mine, J and K move.' },
    { route: '/demo/transaction-inbox', target: 'inbox-rules', title: 'Trust a merchant', body: 'Save a rule and future purchases from that shop skip the inbox and land in the right category.', tryIt: 'Type Foodpanda, pick Food, and save the rule.' },
    { route: '/demo/budgets', target: 'budgets-total', title: 'Budgets, with a forecast', body: 'Cashly projects each budget to the end of the month at your current pace, so you see an overrun while there is still time.' },
    { route: '/demo/budgets', target: 'budgets-list', title: 'The line is where you should be', body: 'The dark line on each bar is how far through the month you are. A bar past its line is spending faster than planned.', tryIt: 'Approve the Daraz purchase in the inbox, then come back: Shopping goes over.' },
    { route: '/demo/dashboard', target: 'nav-twin', title: 'Money Twin', body: 'A forecast of the rest of your month. Move a slider ("spend Rs 5,000 less on food") and see how many days your money lasts.' },
    { route: '/demo/dashboard', target: 'nav-assist', title: 'Ask Cashly', body: 'Ask in plain words: "Can I afford a Rs 30,000 phone this month?" Answers use your real numbers and say when something is still pending.' },
    { route: '/demo/dashboard', target: 'nav-extension', title: 'The browser extension', body: 'Install it once. It works on any checkout page, never asks for a bank password, and shows you what it caught.' },
    { route: '/demo/dashboard', title: 'That is Cashly', body: 'Everything you did here stayed in this browser. Create a free account to use it with your own money.' },
];

export function DemoGuide() {
    const { reset, lastAction } = useDemo();
    const navigate = useNavigate();
    const location = useLocation();
    const [index, setIndex] = useState(() => Math.max(0, DEMO_STEPS.findIndex((st) => window.location.pathname.startsWith(st.route))));
    const [open, setOpen] = useState(true);
    const step = DEMO_STEPS[index];
    const last = index === DEMO_STEPS.length - 1;

    // Move to the step's screen only when the step changes; visitors can still wander off between steps.
    const shownIndex = useRef(index);
    useEffect(() => {
        if (shownIndex.current === index) return; // a visitor who arrived on a screen stays on it
        shownIndex.current = index;
        if (open && !window.location.pathname.startsWith(step.route)) navigate(step.route);
    }, [index, open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        document.querySelectorAll('[data-tour-active]').forEach((el) => el.removeAttribute('data-tour-active'));
        if (!open || !step.target) return;
        const id = window.setTimeout(() => {
            const el = document.querySelector(`[data-tour="${step.target}"]`);
            if (!el) return;
            el.setAttribute('data-tour-active', '');
            el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        }, 80);
        return () => window.clearTimeout(id);
    }, [open, step.target, location.pathname]);

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 text-[15px] font-semibold text-white">
                Resume the tour
            </button>
        );
    }

    return (
        <aside aria-label="Demo guide" aria-live="polite"
            className="fixed inset-x-2 bottom-2 z-40 max-h-[46svh] overflow-y-auto rounded-[18px] bg-[var(--color-ink)] p-4 text-white sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-h-none sm:w-[380px] sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-white/70">Demo tour · {index + 1} of {DEMO_STEPS.length}</p>
                <button type="button" onClick={() => setOpen(false)} aria-label="Hide the tour" className="-mr-2 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
                    <X size={16} />
                </button>
            </div>
            <h2 className="mt-1 font-display text-[18px] font-semibold tracking-tight sm:mt-2 sm:text-[20px]">{step.title}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/85 sm:mt-2 sm:text-[15px]">{step.body}</p>
            {step.tryIt && <p className="mt-3 rounded-[12px] bg-white/10 p-3 text-[14px] leading-relaxed">Try it: {step.tryIt}</p>}
            {lastAction && <p className="mt-3 text-[14px] text-[#BBC7B1]">{lastAction}</p>}

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
                <div className="h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-300" style={{ width: `${((index + 1) / DEMO_STEPS.length) * 100}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] text-white/80 hover:bg-white/10 hover:text-white">
                    <RotateCcw size={14} /> Reset
                </button>
                <div className="flex gap-2">
                    <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)} aria-label="Previous step"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40">
                        <ArrowLeft size={16} />
                    </button>
                    {last ? (
                        <Link to="/signup" className={cn('inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 text-[14px] font-semibold hover:bg-[var(--color-brand-hover)]')}>
                            Create a free account <ArrowRight size={15} />
                        </Link>
                    ) : (
                        <button type="button" onClick={() => setIndex((i) => i + 1)}
                            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-[var(--color-ink)] hover:bg-white/90">
                            Next <ArrowRight size={15} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
