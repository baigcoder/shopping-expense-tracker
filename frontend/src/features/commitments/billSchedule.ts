// When a bill is next due, given when it was last paid. Shared by the bill service, so Bills, Home,
// Calendar and Money Twin agree. A due date in the past means the bill is overdue.

export interface BillScheduleInput {
    due_date: string; // a day of the month ("25") or a full date ("2026-11-25")
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
    last_paid_date?: string | null;
    created_at?: string | null;
}

const STEP: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };
const localDay = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function nextBillDue(bill: BillScheduleInput, today: Date): Date {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const created = bill.created_at ? localDay(bill.created_at) : t;
    const isDate = /^\d{4}-\d{2}-\d{2}/.test(bill.due_date);
    const day = isDate ? localDay(bill.due_date).getDate() : Math.min(31, Math.max(1, parseInt(bill.due_date, 10) || 1));
    const anchor = isDate ? localDay(bill.due_date) : new Date(created.getFullYear(), created.getMonth(), 1);
    if (bill.frequency === 'one-time') return isDate ? anchor : new Date(created.getFullYear(), created.getMonth(), day);

    const step = STEP[bill.frequency] || 1;
    // The k-th due date from the anchor, with day 31 falling on the last day of shorter months.
    const occ = (k: number) => {
        const first = new Date(anchor.getFullYear(), anchor.getMonth() + k * step, 1);
        return new Date(first.getFullYear(), first.getMonth(), Math.min(day, new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
    };
    const kAt = (d: Date) => Math.floor(((d.getFullYear() - anchor.getFullYear()) * 12 + d.getMonth() - anchor.getMonth()) / step);

    let next: number;
    if (bill.last_paid_date) {
        // A payment covers the due date nearest to it, so paying on the 20th settles the 25th.
        const paid = localDay(bill.last_paid_date);
        const k = kAt(paid);
        const covered = Math.abs(occ(k + 1).getTime() - paid.getTime()) < Math.abs(paid.getTime() - occ(k).getTime()) ? k + 1 : k;
        next = covered + 1;
    } else {
        next = kAt(created);
        while (occ(next) < created) next++;
    }
    // Only the latest missed due date is reported overdue, not every month since.
    while (occ(next + 1) <= t) next++;
    return occ(next);
}
