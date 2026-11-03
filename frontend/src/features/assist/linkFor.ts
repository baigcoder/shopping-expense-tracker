// The one screen an answer points to, picked from what the answer talks about.
const RULES: [RegExp, { label: string; path: string }][] = [
    [/inbox|waiting|pending|review/i, { label: 'Open the inbox', path: '/transaction-inbox' }],
    [/budget|limit/i, { label: 'Open budgets', path: '/budgets' }],
    [/subscription|trial|recurring|bill/i, { label: 'Open bills and subscriptions', path: '/subscriptions' }],
    [/goal|saving/i, { label: 'Open goals', path: '/goals' }],
    [/spent|transaction|purchase/i, { label: 'Open activity', path: '/transactions' }],
];

export const linkFor = (answer: string) => RULES.find(([re]) => re.test(answer))?.[1];
