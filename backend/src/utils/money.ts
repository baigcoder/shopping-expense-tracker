/**
 * CASHLY V11 — AUTHORITATIVE FINANCIAL MONEY VALUE OBJECT
 * Eliminates IEEE 754 floating-point precision drift.
 * All arithmetic executes in exact integer cents.
 * Currency mixing without explicit exchange rate throws a CurrencyMismatchError.
 */

export class CurrencyMismatchError extends Error {
    constructor(sourceCurrency: string, targetCurrency: string) {
        super(`Cannot operate on mixed currencies without explicit FX rate: ${sourceCurrency} vs ${targetCurrency}`);
        this.name = 'CurrencyMismatchError';
    }
}

export type RoundingMode = 'half-up' | 'half-even' | 'floor' | 'ceil';

export class Money {
    readonly cents: number;
    readonly currency: string;

    private constructor(cents: number, currency = 'USD') {
        this.cents = Math.round(cents);
        this.currency = (currency || 'USD').toUpperCase().trim();
    }

    /**
     * Create Money from decimal representation (e.g. 1420.50 -> 142050 cents).
     */
    static fromDecimal(amount: number | string, currency = 'USD'): Money {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!Number.isFinite(num)) {
            return new Money(0, currency);
        }
        return new Money(Math.round(num * 100), currency);
    }

    /**
     * Create Money directly from integer cents.
     */
    static fromCents(cents: number, currency = 'USD'): Money {
        if (!Number.isFinite(cents)) {
            return new Money(0, currency);
        }
        return new Money(Math.round(cents), currency);
    }

    /**
     * Create zero-value Money for a given currency.
     */
    static zero(currency = 'USD'): Money {
        return new Money(0, currency);
    }

    /**
     * Sum an array of Money instances of identical currency.
     */
    static sum(items: Money[], defaultCurrency = 'USD'): Money {
        if (!items.length) return Money.zero(defaultCurrency);
        const currency = items[0].currency;
        const totalCents = items.reduce((acc, item) => {
            if (item.currency !== currency) {
                throw new CurrencyMismatchError(item.currency, currency);
            }
            return acc + item.cents;
        }, 0);
        return Money.fromCents(totalCents, currency);
    }

    add(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.cents + other.cents, this.currency);
    }

    subtract(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.cents - other.cents, this.currency);
    }

    multiply(factor: number, mode: RoundingMode = 'half-up'): Money {
        if (!Number.isFinite(factor)) return Money.zero(this.currency);
        return new Money(this.applyRounding(this.cents * factor, mode), this.currency);
    }

    divide(divisor: number, mode: RoundingMode = 'half-up'): Money {
        if (!Number.isFinite(divisor) || divisor === 0) {
            throw new Error('Division by zero or invalid divisor in financial calculation');
        }
        return new Money(this.applyRounding(this.cents / divisor, mode), this.currency);
    }

    /**
     * Allocate total cents across an array of ratios/weights without losing a single penny.
     * Guaranteed invariant: sum(allocated.cents) === this.cents.
     */
    allocate(ratios: number[]): Money[] {
        if (!ratios.length) return [];
        const totalWeight = ratios.reduce((acc, r) => acc + r, 0);
        if (totalWeight <= 0) {
            throw new Error('Allocation ratios must sum to a positive number');
        }

        let remainder = this.cents;
        const results: Money[] = [];

        for (let i = 0; i < ratios.length; i++) {
            const share = Math.floor((this.cents * ratios[i]) / totalWeight);
            results.push(new Money(share, this.currency));
            remainder -= share;
        }

        // Distribute remainder pennies one-by-one to early shares
        for (let i = 0; i < remainder; i++) {
            results[i] = new Money(results[i].cents + 1, this.currency);
        }

        return results;
    }

    abs(): Money {
        return new Money(Math.abs(this.cents), this.currency);
    }

    negate(): Money {
        return new Money(-this.cents, this.currency);
    }

    isZero(): boolean {
        return this.cents === 0;
    }

    isPositive(): boolean {
        return this.cents > 0;
    }

    isNegative(): boolean {
        return this.cents < 0;
    }

    equals(other: Money): boolean {
        return this.currency === other.currency && this.cents === other.cents;
    }

    greaterThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents > other.cents;
    }

    lessThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents < other.cents;
    }

    greaterThanOrEqual(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents >= other.cents;
    }

    lessThanOrEqual(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents <= other.cents;
    }

    /**
     * Convert to target currency with an explicit exchange rate.
     */
    convert(rate: number, targetCurrency: string): Money {
        if (!Number.isFinite(rate) || rate <= 0) {
            throw new Error(`Invalid exchange rate: ${rate}`);
        }
        const convertedCents = Math.round(this.cents * rate);
        return new Money(convertedCents, targetCurrency);
    }

    /**
     * Format as standard 2-decimal number for API payloads (e.g. 1420.50).
     */
    toDecimal(): number {
        return this.cents / 100;
    }

    /**
     * Formatted string with currency symbol.
     */
    format(locale = 'en-US'): string {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: this.currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(this.toDecimal());
        } catch {
            return `${this.currency} ${this.toDecimal().toFixed(2)}`;
        }
    }

    toJSON() {
        return {
            amount: this.toDecimal(),
            cents: this.cents,
            currency: this.currency,
            formatted: this.format(),
        };
    }

    private assertSameCurrency(other: Money) {
        if (this.currency !== other.currency) {
            throw new CurrencyMismatchError(this.currency, other.currency);
        }
    }

    private applyRounding(value: number, mode: RoundingMode): number {
        switch (mode) {
            case 'floor':
                return Math.floor(value);
            case 'ceil':
                return Math.ceil(value);
            case 'half-even': {
                const floor = Math.floor(value);
                const diff = value - floor;
                if (diff === 0.5) {
                    return floor % 2 === 0 ? floor : floor + 1;
                }
                return Math.round(value);
            }
            case 'half-up':
            default:
                return Math.round(value);
        }
    }
}
