// The figures Home shows, as plain text for Ask Cashly, so "can I afford this?" gets the same answer as Home.
// The server snapshot has no safe-to-spend, no account balances and only bills due within 7 days.
import type { HomeModel } from '../home/homeModel';

export function homeFacts(m: HomeModel, money: (n: number) => string): string {
    const lines = [
        'HOME SCREEN FIGURES (computed by the app; use these for safe-to-spend and affordability questions):',
        `- Safe to spend: ${money(m.safeToSpend)} = ${m.balanceFrom === 'accounts' ? 'account balances' : 'recorded balance'} ${money(m.balance)} - ${money(m.committed30)} bills and subscriptions due in 30 days - ${money(m.plannedSavings)} for goals this month`,
        `- Lasts about ${m.runwayDays === null ? 'indefinitely at current spending' : `${m.runwayDays} days at current spending`}`,
        `- This month: spent ${money(m.monthOut)}, received ${money(m.monthIn)}; last month spent ${money(m.lastMonthOut)}`,
    ];
    if (m.upcoming.length) lines.push(`- Due in the next 30 days: ${m.upcoming.slice(0, 8).map((u) => `${u.name} ${money(u.amount)} in ${u.daysUntil} days${u.isTrial ? ' (free trial ends)' : ''}`).join('; ')}`);
    if (m.pending.length) lines.push(`- Waiting for approval, not yet counted: ${m.pending.map((p) => `${p.merchant} ${p.type === 'income' ? '+' : ''}${money(p.amount)}`).join('; ')}`);
    const budgets = m.categories.filter((c) => c.budget !== null);
    if (budgets.length) lines.push(`- Budgets this month: ${budgets.map((c) => `${c.category} ${money(c.spent)} of ${money(c.budget!)}`).join('; ')}`);
    return lines.join('\n');
}
