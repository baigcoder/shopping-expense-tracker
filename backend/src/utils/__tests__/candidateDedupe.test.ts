import { describe, expect, it } from 'vitest';
import {
    buildCandidateHash,
    isLikelySameLedgerPurchase,
    merchantsOverlap,
    normalizeCandidateHash,
} from '../candidateDedupe.js';

describe('candidateDedupe', () => {
    it('normalizes incoming extension hashes', () => {
        expect(normalizeCandidateHash(' txn_ab12! ')).toBe('txn_ab12');
        expect(normalizeCandidateHash('')).toBeNull();
    });

    it('builds a stable fallback hash', () => {
        const first = buildCandidateHash('user-1', {
            amount: 20,
            date: '2026-09-10',
            description: 'Amazon - charger',
            merchant_name: 'Amazon',
            source: 'extension',
        });
        const second = buildCandidateHash('user-1', {
            amount: 20,
            date: '2026-09-10',
            description: 'Amazon - charger',
            merchant_name: 'Amazon',
            source: 'extension',
        });
        expect(first).toBe(second);
        expect(first).toHaveLength(32);
    });

    it('matches the same merchant purchase inside one day', () => {
        expect(merchantsOverlap('Amazon', 'amazon.com checkout')).toBe(true);
        expect(isLikelySameLedgerPurchase(
            { amount: 20, date: '2026-09-10', description: 'Amazon - charger', merchant_name: 'Amazon' },
            { amount: 20, date: '2026-09-10', description: 'Amazon - charger', store_name: 'Amazon' }
        )).toBe(true);
    });

    it('does not collapse two similar buys a week apart', () => {
        expect(isLikelySameLedgerPurchase(
            { amount: 20, date: '2026-09-10', description: 'Amazon - charger', merchant_name: 'Amazon' },
            { amount: 20, date: '2026-09-03', description: 'Amazon - cable', store_name: 'Amazon' }
        )).toBe(false);
    });
});
