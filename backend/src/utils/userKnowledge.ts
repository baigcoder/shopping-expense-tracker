// Deterministic facts about a user's subscriptions and trials. The model only phrases these; it never derives them.
export type SubscriptionState = 'trial_active' | 'trial_ending_soon' | 'trial_converted' | 'trial_ended_unpaid' | 'cancelled' | 'paid';

export interface SubscriptionFact {
    name: string;
    state: SubscriptionState;
    price: number;
    cycle: string;
    trialEndDate: string | null;
    daysLeft: number | null;
    nextChargeDate: string | null;
}

export interface Commitment {
    date: string;
    title: string;
    amount: number;
    kind: 'trial_converts' | 'subscription' | 'bill';
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const ENDING_SOON_DAYS = 3;

export const toDay = (value: unknown): string | null => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const dayDiff = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

const merchantKey = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function hasChargeSince(name: string, since: string, transactions: Array<Record<string, any>>) {
    const key = merchantKey(name);
    if (key.length < 3) return false;
    return transactions.some((tx) => {
        const day = toDay(tx.date);
        if (!day || day < since || tx.type === 'income') return false;
        const haystack = merchantKey(`${tx.store_name || ''} ${tx.description || ''}`);
        return haystack.includes(key) && Number(tx.amount) > 0;
    });
}

export function deriveSubscriptionFacts(
    subscriptions: Array<Record<string, any>>,
    transactions: Array<Record<string, any>>,
    now: Date = new Date()
): SubscriptionFact[] {
    const today = now.toISOString().slice(0, 10);

    return subscriptions.map((sub): SubscriptionFact => {
        const trialEndDate = toDay(sub.trial_end_date);
        const isTrial = !!sub.is_trial || sub.status === 'trial' || (sub.status === 'expired' && !!trialEndDate);
        const base = {
            name: String(sub.name || 'Unknown'),
            price: Number(sub.price) || 0,
            cycle: String(sub.cycle || 'monthly'),
            trialEndDate,
            nextChargeDate: toDay(sub.next_payment_date) || toDay(sub.renew_date),
        };

        if (sub.status === 'cancelled' || sub.is_active === false) {
            return { ...base, state: 'cancelled', daysLeft: null };
        }
        if (!isTrial) return { ...base, state: 'paid', daysLeft: null };

        if (!trialEndDate) return { ...base, state: 'trial_active', daysLeft: null };

        const daysLeft = dayDiff(today, trialEndDate);
        if (daysLeft >= 0) {
            return { ...base, state: daysLeft <= ENDING_SOON_DAYS ? 'trial_ending_soon' : 'trial_active', daysLeft };
        }
        const converted = hasChargeSince(base.name, trialEndDate, transactions);
        return { ...base, state: converted ? 'trial_converted' : 'trial_ended_unpaid', daysLeft };
    });
}

// Money that is known to leave in the next `windowDays`, soonest first.
export function buildCommitments(
    facts: SubscriptionFact[],
    bills: Array<Record<string, any>>,
    now: Date = new Date(),
    windowDays = 30
): Commitment[] {
    const today = now.toISOString().slice(0, 10);
    const inWindow = (day: string | null): day is string => !!day && day >= today && dayDiff(today, day) <= windowDays;
    const items: Commitment[] = [];

    for (const fact of facts) {
        if ((fact.state === 'trial_active' || fact.state === 'trial_ending_soon') && fact.price > 0 && inWindow(fact.trialEndDate)) {
            items.push({ date: fact.trialEndDate!, title: `${fact.name} trial ends and starts billing`, amount: fact.price, kind: 'trial_converts' });
        } else if (fact.state === 'paid' && inWindow(fact.nextChargeDate)) {
            items.push({ date: fact.nextChargeDate!, title: `${fact.name} renewal`, amount: fact.price, kind: 'subscription' });
        }
    }
    for (const bill of bills) {
        const day = toDay(bill.due_date);
        if (bill.is_paid || !inWindow(day)) continue;
        items.push({ date: day, title: String(bill.title || bill.name || 'Bill'), amount: Number(bill.amount) || 0, kind: 'bill' });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
}

// Cost of subscriptions that are actually being billed (trials are not billed yet).
export function monthlyPaidCost(facts: SubscriptionFact[]): number {
    return facts
        .filter((fact) => fact.state === 'paid' || fact.state === 'trial_converted')
        .reduce((sum, fact) => sum + (fact.cycle === 'yearly' ? fact.price / 12 : fact.cycle === 'weekly' ? fact.price * 4 : fact.price), 0);
}

export function describeFact(fact: SubscriptionFact, money: (value: number) => string): string {
    const price = fact.price > 0 ? `${money(fact.price)}/${fact.cycle}` : 'price unknown';
    switch (fact.state) {
        case 'trial_active':
            return `- ${fact.name}: TRIAL ACTIVE${fact.trialEndDate ? `, ends ${fact.trialEndDate} (in ${fact.daysLeft} days)` : ', end date unknown'}; bills ${price} afterwards unless cancelled`;
        case 'trial_ending_soon':
            return `- ${fact.name}: TRIAL ENDING SOON, ends ${fact.trialEndDate} (${fact.daysLeft === 0 ? 'today' : `in ${fact.daysLeft} day${fact.daysLeft === 1 ? '' : 's'}`}); bills ${price} afterwards unless cancelled`;
        case 'trial_converted':
            return `- ${fact.name}: TRIAL ENDED ${fact.trialEndDate}, a charge was found (now paying ${price})`;
        case 'trial_ended_unpaid':
            return `- ${fact.name}: TRIAL ENDED ${fact.trialEndDate}, no charge found in the ledger yet (check the card)`;
        case 'cancelled':
            return `- ${fact.name}: CANCELLED`;
        default:
            return `- ${fact.name}: ${price}${fact.nextChargeDate ? `, next charge ${fact.nextChargeDate}` : ''}`;
    }
}

export interface TrialAlert {
    kind: 'ending_soon' | 'ended_unpaid';
    title: string;
    message: string;
}

// Alerts that need no model: a trial about to bill, or one that ended with no charge on record.
export function trialAlerts(facts: SubscriptionFact[], money: (value: number) => string): TrialAlert[] {
    const alerts: TrialAlert[] = [];
    for (const fact of facts) {
        const cost = fact.price > 0 ? `${money(fact.price)}/${fact.cycle}` : 'the full price';
        if (fact.state === 'trial_ending_soon') {
            const when = fact.daysLeft === 0 ? 'today' : fact.daysLeft === 1 ? 'tomorrow' : `in ${fact.daysLeft} days`;
            alerts.push({
                kind: 'ending_soon',
                title: `${fact.name} trial ends ${when}`,
                message: `Cancel before ${fact.trialEndDate} if you do not want to be billed ${cost}.`,
            });
        } else if (fact.state === 'trial_ended_unpaid') {
            alerts.push({
                kind: 'ended_unpaid',
                title: `${fact.name} trial has ended`,
                message: `No charge from ${fact.name} is in your ledger yet. Check your card, or cancel if you no longer want it.`,
            });
        }
    }
    return alerts;
}

export function trialInsights(
    alerts: TrialAlert[] | undefined,
    type: 'warning' | 'risk',
    generatedAt = new Date().toISOString()
) {
    return (alerts || []).map((alert) => ({ type, title: alert.title, message: alert.message, confidence: 1, generatedAt }));
}
