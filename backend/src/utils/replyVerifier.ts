// Checks an AI reply against the data it was given: every money figure and ISO date must come from the prompt.
const MONEY = /(?:[$€£₹]|\b(?:Rs\.?|PKR|USD|EUR|GBP|INR|AED|CAD|AUD))\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:USD|EUR|GBP|PKR|INR|AED|CAD|AUD)\b/gi;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;
const MAX_BASE_AMOUNTS = 80;

export function extractMoney(text: string): number[] {
    const values: number[] = [];
    for (const match of text.matchAll(MONEY)) {
        const value = Number((match[1] ?? match[2]).replace(/,/g, ''));
        if (Number.isFinite(value)) values.push(value);
    }
    return values;
}

// Amounts the model may legitimately state: shown figures plus simple sums, differences and yearly multiples of them.
export function allowedAmounts(prompt: string): number[] {
    const base = [...new Set(extractMoney(prompt))].slice(0, MAX_BASE_AMOUNTS);
    const allowed = new Set<number>(base);
    for (const a of base) {
        allowed.add(a * 12);
        for (const b of base) {
            allowed.add(a + b);
            allowed.add(Math.abs(a - b));
        }
    }
    return [...allowed];
}

const matches = (value: number, allowed: number[]) =>
    allowed.some((known) => Math.abs(known - value) <= Math.max(1, known * 0.01));

export function findUnverified(reply: string, prompt: string): string[] {
    const allowed = allowedAmounts(prompt);
    const bad: string[] = [];

    for (const match of reply.matchAll(MONEY)) {
        const value = Number((match[1] ?? match[2]).replace(/,/g, ''));
        if (Number.isFinite(value) && !matches(value, allowed)) bad.push(match[0].trim());
    }

    const knownDates = new Set(prompt.match(ISO_DATE) || []);
    for (const date of reply.match(ISO_DATE) || []) {
        if (!knownDates.has(date)) bad.push(date);
    }
    return [...new Set(bad)];
}

// Last resort when a retry still invents figures: drop the sentences that contain them.
export function stripUnverified(reply: string, bad: string[]): string | null {
    const kept = reply
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !bad.some((token) => sentence.includes(token)));
    const text = kept.join(' ').trim();
    return text.length >= 20 ? text : null;
}
