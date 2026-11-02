import { describe, expect, it } from 'vitest';
import { findUnverified, stripUnverified } from '../replyVerifier.js';

const prompt = `TODAY is 2026-11-03
- This month: $1,250.00
- Netflix: TRIAL ENDING SOON, ends 2026-11-05 (in 2 days); bills $9.99/monthly afterwards
- Rent: $500.00 due 2026-11-04
- Groceries: PKR 15,000`;

describe('findUnverified', () => {
    it('accepts figures that are in the data, rounded, summed or yearly', () => {
        const reply = 'You spent $1,250 this month. Netflix will bill $9.99, about $10, or $119.88 a year. Rent plus Netflix is $509.99.';
        expect(findUnverified(reply, prompt)).toEqual([]);
        expect(findUnverified('Groceries were PKR 15,000.', prompt)).toEqual([]);
    });

    it('flags invented amounts and dates', () => {
        expect(findUnverified('You spent $3,400 on food and Netflix ends 2026-12-01.', prompt)).toEqual(['$3,400', '2026-12-01']);
    });

    it('ignores plain numbers that are not money', () => {
        expect(findUnverified('Your trial ends in 2 days and your score is 70/100.', prompt)).toEqual([]);
    });
});

describe('stripUnverified', () => {
    it('removes only the sentences with invented figures', () => {
        const reply = 'Netflix ends 2026-11-05 so decide soon. You also spent $3,400 on food last year. Rent is due 2026-11-04.';
        expect(stripUnverified(reply, ['$3,400'])).toBe('Netflix ends 2026-11-05 so decide soon. Rent is due 2026-11-04.');
    });

    it('returns null when nothing usable is left', () => {
        expect(stripUnverified('You spent $3,400.', ['$3,400'])).toBeNull();
    });
});
