import { describe, expect, it } from 'vitest';
import { CurrencyMismatchError, Money } from '../money.js';

describe('Money Value Object (INV-05 & INV-06)', () => {
    it('creates Money from decimal and converts to exact integer cents', () => {
        const m = Money.fromDecimal(1420.50, 'USD');
        expect(m.cents).toBe(142050);
        expect(m.currency).toBe('USD');
        expect(m.toDecimal()).toBe(1420.50);
    });

    it('prevents IEEE 754 floating-point drift (0.10 + 0.20 === 0.30)', () => {
        const ten = Money.fromDecimal(0.10, 'USD');
        const twenty = Money.fromDecimal(0.20, 'USD');
        const sum = ten.add(twenty);

        expect(sum.cents).toBe(30);
        expect(sum.toDecimal()).toBe(0.30);
        // Compare with raw JS float: (0.10 + 0.20 === 0.30000000000000004)
        expect(0.10 + 0.20).not.toBe(0.30);
    });

    it('adds and subtracts money of same currency', () => {
        const a = Money.fromDecimal(100.25, 'USD');
        const b = Money.fromDecimal(50.75, 'USD');

        const sum = a.add(b);
        expect(sum.cents).toBe(15100);
        expect(sum.toDecimal()).toBe(151.00);

        const diff = a.subtract(b);
        expect(diff.cents).toBe(4950);
        expect(diff.toDecimal()).toBe(49.50);
    });

    it('throws CurrencyMismatchError when operating on mixed currencies without rate', () => {
        const usd = Money.fromDecimal(100, 'USD');
        const pkr = Money.fromDecimal(28000, 'PKR');

        expect(() => usd.add(pkr)).toThrow(CurrencyMismatchError);
        expect(() => usd.subtract(pkr)).toThrow(CurrencyMismatchError);
        expect(() => usd.greaterThan(pkr)).toThrow(CurrencyMismatchError);
    });

    it('sums an array of Money items cleanly', () => {
        const items = [
            Money.fromDecimal(10.50, 'USD'),
            Money.fromDecimal(20.25, 'USD'),
            Money.fromDecimal(5.25, 'USD'),
        ];
        const total = Money.sum(items, 'USD');
        expect(total.cents).toBe(3600);
        expect(total.toDecimal()).toBe(36.00);
    });

    it('handles division by day count without float distortion', () => {
        const monthly = Money.fromDecimal(1000, 'USD');
        const daily = monthly.divide(30);
        expect(daily.cents).toBe(3333); // $33.33/day
        expect(daily.toDecimal()).toBe(33.33);
    });

    it('throws on division by zero', () => {
        const m = Money.fromDecimal(100, 'USD');
        expect(() => m.divide(0)).toThrow('Division by zero');
    });

    it('converts with an explicit exchange rate', () => {
        const usd = Money.fromDecimal(100, 'USD');
        const pkr = usd.convert(278.50, 'PKR');
        expect(pkr.currency).toBe('PKR');
        expect(pkr.cents).toBe(2785000);
        expect(pkr.toDecimal()).toBe(27850.00);
    });

    it('formats properly with locale formatting', () => {
        const m = Money.fromDecimal(1420.50, 'USD');
        expect(m.format('en-US')).toContain('1,420.50');
    });
});
