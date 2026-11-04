// Money Twin: the next 60 days of balance, from the same inputs Home uses, with three what-ifs.
import type { CommitmentInput } from '../commitments/commitmentsModel';
import { buildCommitments } from '../commitments/commitmentsModel';
import { chargesWithin } from '../home/homeModel';

export interface TwinTx { date: string; amount: number; type: 'income' | 'expense'; category: string; description?: string }
export type TwinCharge = CommitmentInput;

export interface WhatIf { cutCategory: string | null; cutAmount: number; cancelled: string[]; purchase: number }

export interface TwinModel {
    days: { day: number; balance: number }[];
    runwayDays: number | null; // first day the balance goes below zero, or null if it never does in 60 days
    dailyBurn: number;
    monthlyIncome: number;
    payDay: number | null; // day of the month income is expected
    lowest: { day: number; balance: number };
    monthlySaved: number; // how much the what-ifs save per month
    categories: { category: string; monthly: number }[];
}

const DAY = 86400000;
const HORIZON = 60;
const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };

/** `startBalance` is the account total Home uses; without accounts the forecast starts from the ledger. */
export function buildTwin(transactions: TwinTx[], charges: TwinCharge[], whatIf: WhatIf, now = new Date(), startBalance: number | null = null): TwinModel {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ageDays = (t: TwinTx) => Math.round((today.getTime() - localDay(t.date).getTime()) / DAY);
    const income = transactions.filter((t) => t.type === 'income');
    const expenses = transactions.filter((t) => t.type === 'expense');
    const ledger = income.reduce((s, t) => s + Math.abs(t.amount), 0) - expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    // How far back the history really goes, so a new user's ten days are not spread over thirty.
    const history = transactions.length ? Math.max(...transactions.map(ageDays)) + 1 : 0;

    // Day-to-day pace over the last 30 days (or the whole history if shorter), leaving out scheduled charges.
    const paceDays = Math.max(7, Math.min(30, history));
    const scheduled = new Set(charges.map((c) => c.name.toLowerCase()));
    const recent = expenses.filter((t) => ageDays(t) < paceDays && !scheduled.has((t.description || '').toLowerCase()));
    const byCat = new Map<string, number>();
    for (const t of recent) byCat.set(t.category, (byCat.get(t.category) || 0) + Math.abs(t.amount) * (30 / paceDays));
    const categories = [...byCat.entries()].map(([category, monthly]) => ({ category, monthly: Math.round(monthly) })).sort((a, b) => b.monthly - a.monthly);

    const cut = whatIf.cutCategory ? Math.min(whatIf.cutAmount, byCat.get(whatIf.cutCategory) || 0) : 0;
    const dailyBurn = Math.max(0, ([...byCat.values()].reduce((s, v) => s + v, 0) - cut) / 30);

    // A month's income: what came in over up to three months, divided by the months it came in, so a
    // salary paid 31 days ago still counts. It arrives on the day of the month the largest payment came.
    const incomeDays = history >= 45 ? 91 : 30;
    const recentIncome = income.filter((t) => ageDays(t) < incomeDays);
    const received = recentIncome.reduce((s, t) => s + Math.abs(t.amount), 0);
    const months = new Set(recentIncome.map((t) => t.date.slice(0, 7))).size;
    const monthlyIncome = months ? Math.round(received / months) : 0;
    const biggest = [...recentIncome].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
    const payDay = biggest ? localDay(biggest.date).getDate() : null;

    const live = charges.filter((c) => !whatIf.cancelled.includes(c.id));
    const dueOn = new Map<number, number>();
    for (const c of live) for (const d of chargesWithin(c, today, HORIZON)) dueOn.set(d, (dueOn.get(d) || 0) + c.amount);
    const cancelledMonthly = buildCommitments(charges.filter((c) => whatIf.cancelled.includes(c.id)), now).monthly;

    // Day 0 is now: anything due today (or overdue) is already owed.
    let bal = (startBalance ?? ledger) - whatIf.purchase - (dueOn.get(0) || 0);
    const days: { day: number; balance: number }[] = [{ day: 0, balance: Math.round(bal) }];
    for (let d = 1; d <= HORIZON; d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
        const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        bal -= dailyBurn;
        // A pay day of the 31st lands on the last day of shorter months.
        if (payDay !== null && date.getDate() === Math.min(payDay, lastOfMonth)) bal += monthlyIncome;
        bal -= dueOn.get(d) || 0;
        days.push({ day: d, balance: Math.round(bal) });
    }

    const below = days.find((p) => p.balance < 0);
    const lowest = days.reduce((m, p) => (p.balance < m.balance ? p : m), days[0]);
    return { days, runwayDays: below ? below.day : null, dailyBurn, monthlyIncome, payDay, lowest, monthlySaved: Math.round(cut + cancelledMonthly), categories };
}
