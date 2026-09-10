import { createHash } from 'crypto';

export function normalizeCandidateHash(value?: string | null): string | null {
    const key = value?.trim();
    if (!key) return null;
    return key.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128) || null;
}

export function buildCandidateHash(userId: string, candidate: {
    amount: number;
    date: string;
    description: string;
    merchant_name?: string | null;
    source: string;
}): string {
    return createHash('sha256')
        .update(JSON.stringify({
            userId,
            amount: candidate.amount,
            date: candidate.date,
            merchant: (candidate.merchant_name || '').toLowerCase(),
            description: candidate.description.toLowerCase(),
            source: candidate.source,
        }))
        .digest('hex')
        .slice(0, 32);
}

export function merchantKey(value?: string | null): string {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function merchantsOverlap(left?: string | null, right?: string | null): boolean {
    const a = merchantKey(left);
    const b = merchantKey(right);
    if (!a || !b) return false;
    if (a.length >= 4 && b.includes(a)) return true;
    if (b.length >= 4 && a.includes(b)) return true;
    return a.split(' ').filter((part) => part.length >= 4).some((part) => b.includes(part));
}

export function isLikelySameLedgerPurchase(candidate: {
    amount: number;
    date: string;
    description: string;
    merchant_name?: string | null;
}, transaction: {
    amount?: number | string | null;
    date?: string | null;
    description?: string | null;
    store_name?: string | null;
}, dayWindow = 1): boolean {
    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || Math.abs(amount - candidate.amount) > 0.009) return false;

    const candidateDay = new Date(candidate.date).getTime();
    const txDay = new Date(transaction.date || candidate.date).getTime();
    if (!Number.isFinite(candidateDay) || !Number.isFinite(txDay)) return false;
    const dayDiff = Math.abs(candidateDay - txDay) / 86_400_000;
    if (dayDiff > dayWindow) return false;

    const txText = `${transaction.store_name || ''} ${transaction.description || ''}`;
    const merchant = candidate.merchant_name || candidate.description;
    return merchantsOverlap(merchant, txText);
}
