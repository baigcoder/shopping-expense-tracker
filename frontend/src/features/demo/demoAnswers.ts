// Demo answers built from the demo's own live numbers, so they change when the visitor approves or cancels things.
import type { HomeModel } from '../home/homeModel';
import type { BudgetModel } from '../budgets/budgetModel';
import type { CommitmentsModel } from '../commitments/commitmentsModel';

const amountIn = (q: string) => {
    const m = q.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k)?/i);
    return m ? Number(m[1]) * (m[2] ? 1000 : 1) : null;
};

export function demoAnswer(q: string, home: HomeModel, budgets: BudgetModel, bills: CommitmentsModel, money: (n: number) => string): string {
    const pendingNote = home.pending.length ? ` ${home.pending.length} purchases (${money(home.pending.reduce((s, p) => s + p.amount, 0))}) are still waiting in your inbox and are not counted yet.` : '';

    if (/afford|buy|spend on/i.test(q)) {
        const price = amountIn(q);
        if (!price) return `You have ${money(home.safeToSpend)} safe to spend.${pendingNote}`;
        const left = home.safeToSpend - price;
        const daily = home.runwayDays && home.runwayDays > 0 ? home.safeToSpend / home.runwayDays : 0;
        return left >= 0
            ? `Yes. You have ${money(home.safeToSpend)} safe to spend after bills and goals. Buying it leaves ${money(left)}${daily ? `, about ${Math.floor(left / daily)} days at your pace` : ''}.${pendingNote}`
            : `Not this month. It is ${money(-left)} more than your ${money(home.safeToSpend)} safe to spend.${pendingNote}`;
    }

    if (/subscri|cancel|trial|bill/i.test(q)) {
        const trial = bills.trials[0];
        const priciest = [...bills.lines].filter((l) => l.kind === 'subscription' && l.active && !l.isTrial).sort((a, b) => b.monthly - a.monthly)[0];
        return [
            trial ? `${trial.name} is a free trial that starts charging ${money(trial.amount)} in ${trial.daysUntil} days. Cancel it now if you do not use it.` : '',
            priciest ? `Your largest subscription is ${priciest.name} at ${money(priciest.monthly)} a month.` : '',
            `Together your bills and subscriptions come to ${money(bills.monthly)} a month.`,
        ].filter(Boolean).join(' ');
    }

    if (/budget|food|over|limit/i.test(q)) {
        const watch = budgets.lines.filter((l) => l.pace !== 'ok');
        if (!watch.length) return `Every budget is on track. You have spent ${money(budgets.spent)} of ${money(budgets.total)}.`;
        return watch.map((l) => l.pace === 'over' ? `${l.category} is over by ${money(l.spent - l.amount)}.` : `${l.category} is heading for ${money(l.projected)} against ${money(l.amount)}.`).join(' ');
    }

    const top = [...home.categories].sort((a, b) => b.spent - a.spent).slice(0, 3);
    return `This month you have spent ${money(home.monthOut)}${home.lastMonthOut ? `, against ${money(home.lastMonthOut)} last month` : ''}. Most went on ${top.map((c) => `${c.category} (${money(c.spent)})`).join(', ')}.${pendingNote}`;
}
