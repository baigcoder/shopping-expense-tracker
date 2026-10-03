import { describe, it, expect } from 'vitest';
import { Money, CurrencyMismatchError } from '../utils/money.js';
import {
    TransactionStateMachine,
    IllegalStateTransitionError,
} from '../domain/transactionStateMachine.js';
import { idempotencyCoordinator } from '../utils/idempotencyGuard.js';

describe('CASHLY BACKEND V11 — ADVERSARIAL AUDIT TEST SUITE', () => {
    describe('1. Money Engine Mathematical Precision', () => {
        it('eliminates IEEE 754 floating point tripwire: 0.10 + 0.20 === 0.30', () => {
            const m1 = Money.fromDecimal(0.10);
            const m2 = Money.fromDecimal(0.20);
            const sum = m1.add(m2);

            expect(sum.cents).toBe(30);
            expect(sum.toDecimal()).toBe(0.30);
            expect(sum.toDecimal()).not.toBe(0.30000000000000004);
        });

        it('accurately adds 999.99 + 0.01 to exact 1000.00', () => {
            const m1 = Money.fromDecimal(999.99);
            const m2 = Money.fromDecimal(0.01);
            const sum = m1.add(m2);

            expect(sum.cents).toBe(100000);
            expect(sum.toDecimal()).toBe(1000.00);
        });

        it('handles negative values (refunds, fees, adjustments)', () => {
            const originalSpend = Money.fromDecimal(150.00);
            const refund = Money.fromDecimal(-50.00);
            const netSpend = originalSpend.add(refund);

            expect(netSpend.toDecimal()).toBe(100.00);
            expect(refund.isNegative()).toBe(true);
            expect(netSpend.isPositive()).toBe(true);
        });

        it('allocates split transactions with guaranteed zero-penny loss', () => {
            // Split $100.00 into 3 equal shares (1:1:1)
            const bill = Money.fromDecimal(100.00);
            const shares = bill.allocate([1, 1, 1]);

            expect(shares).toHaveLength(3);
            expect(shares[0].toDecimal()).toBe(33.34);
            expect(shares[1].toDecimal()).toBe(33.33);
            expect(shares[2].toDecimal()).toBe(33.33);

            // Invariant: Sum of shares must equal original cents exactly!
            const totalAllocatedCents = shares.reduce((acc, s) => acc + s.cents, 0);
            expect(totalAllocatedCents).toBe(bill.cents);
        });

        it('handles large corporate financial numbers without precision degradation', () => {
            const large = Money.fromDecimal(100000000.55); // $100 Million .55
            const addition = Money.fromDecimal(200000000.45); // $200 Million .45
            const total = large.add(addition);

            expect(total.toDecimal()).toBe(300000001.00);
        });
    });

    describe('2. Currency Purity & Isolation', () => {
        it('strictly prohibits cross-currency addition (USD + PKR) without conversion', () => {
            const usd = Money.fromDecimal(100, 'USD');
            const pkr = Money.fromDecimal(28000, 'PKR');

            expect(() => usd.add(pkr)).toThrow(CurrencyMismatchError);
            expect(() => pkr.add(usd)).toThrow(CurrencyMismatchError);
        });

        it('strictly prohibits cross-currency subtraction (USD - EUR) without conversion', () => {
            const usd = Money.fromDecimal(100, 'USD');
            const eur = Money.fromDecimal(90, 'EUR');

            expect(() => usd.subtract(eur)).toThrow(CurrencyMismatchError);
        });

        it('allows identical currency arithmetic for any valid ISO code', () => {
            const eur1 = Money.fromDecimal(45.50, 'EUR');
            const eur2 = Money.fromDecimal(54.50, 'EUR');
            expect(eur1.add(eur2).toDecimal()).toBe(100.00);
            expect(eur1.add(eur2).currency).toBe('EUR');

            const pkr1 = Money.fromDecimal(1500, 'PKR');
            const pkr2 = Money.fromDecimal(3500, 'PKR');
            expect(pkr1.add(pkr2).toDecimal()).toBe(5000.00);
            expect(pkr1.add(pkr2).currency).toBe('PKR');
        });
    });

    describe('3. Transaction State Machine Lifecycle Invariants', () => {
        it('permits legal state transitions: CAPTURED -> PENDING_REVIEW -> APPROVED', () => {
            expect(TransactionStateMachine.canTransition('CAPTURED', 'PENDING_REVIEW')).toBe(true);
            expect(TransactionStateMachine.canTransition('PENDING_REVIEW', 'APPROVED')).toBe(true);

            expect(() =>
                TransactionStateMachine.validateTransition('CAPTURED', 'PENDING_REVIEW')
            ).not.toThrow();

            expect(() =>
                TransactionStateMachine.validateTransition('PENDING_REVIEW', 'APPROVED')
            ).not.toThrow();
        });

        it('permits alternative review branches: PENDING_REVIEW -> REJECTED, MERGED, SPLIT', () => {
            expect(TransactionStateMachine.canTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
            expect(TransactionStateMachine.canTransition('PENDING_REVIEW', 'MERGED')).toBe(true);
            expect(TransactionStateMachine.canTransition('PENDING_REVIEW', 'SPLIT')).toBe(true);
        });

        it('strictly rejects illegal transitions: APPROVED -> PENDING_REVIEW', () => {
            expect(TransactionStateMachine.canTransition('APPROVED', 'PENDING_REVIEW')).toBe(false);
            expect(() =>
                TransactionStateMachine.validateTransition('APPROVED', 'PENDING_REVIEW')
            ).toThrow(IllegalStateTransitionError);
        });

        it('strictly rejects illegal transitions: REJECTED -> APPROVED', () => {
            expect(TransactionStateMachine.canTransition('REJECTED', 'APPROVED')).toBe(false);
            expect(() =>
                TransactionStateMachine.validateTransition('REJECTED', 'APPROVED')
            ).toThrow(IllegalStateTransitionError);
        });
    });

    describe('4. In-Flight Idempotency & Mutex Execution', () => {
        it('executes exactly one operation when 5 concurrent promises request identical key', async () => {
            idempotencyCoordinator.clear();
            const lockKey = 'idem:adv_test:concurrent_approval';
            let executionCount = 0;

            const makeCall = () =>
                idempotencyCoordinator.execute(lockKey, async () => {
                    await new Promise((resolve) => setTimeout(resolve, 30));
                    executionCount++;
                    return { status: 'posted', ledgerId: 'led_999' };
                });

            const results = await Promise.all([
                makeCall(),
                makeCall(),
                makeCall(),
                makeCall(),
                makeCall(),
            ]);

            expect(executionCount).toBe(1);
            expect(results.filter((r) => r.fromCache === false)).toHaveLength(1);
            expect(results.filter((r) => r.fromCache === true)).toHaveLength(4);

            for (const r of results) {
                expect(r.result).toEqual({ status: 'posted', ledgerId: 'led_999' });
            }
        });
    });

    describe('5. Safe-to-Spend Formula Parity with Product Specification', () => {
        // Frontend formula: Math.max(0, currentBalance - committedBills30Days - plannedSavingsAlloc)
        const frontendCalculateSafeHeadroom = (
            currentBalance: number,
            committedBills30Days: number,
            plannedSavingsAlloc: number
        ) => Math.max(0, currentBalance - committedBills30Days - plannedSavingsAlloc);

        it('proves backend Money engine and frontend formula yield identical cents for Case A', () => {
            const liquid = 5000;
            const committed = 1500;
            const savings = 1000;

            const frontendResult = frontendCalculateSafeHeadroom(liquid, committed, savings);

            // Backend integer-cents Money calculation
            const backendLiquid = Money.fromDecimal(liquid);
            const backendCommitted = Money.fromDecimal(committed);
            const backendSavings = Money.fromDecimal(savings);
            const backendResult = Money.fromCents(
                Math.max(0, backendLiquid.cents - backendCommitted.cents - backendSavings.cents)
            ).toDecimal();

            expect(backendResult).toBe(2500);
            expect(backendResult).toBe(frontendResult);
        });

        it('proves backend Money engine and frontend formula yield identical zero for Case B (over-encumbered)', () => {
            const liquid = 1000;
            const committed = 800;
            const savings = 500;

            const frontendResult = frontendCalculateSafeHeadroom(liquid, committed, savings);

            const backendLiquid = Money.fromDecimal(liquid);
            const backendCommitted = Money.fromDecimal(committed);
            const backendSavings = Money.fromDecimal(savings);
            const backendResult = Money.fromCents(
                Math.max(0, backendLiquid.cents - backendCommitted.cents - backendSavings.cents)
            ).toDecimal();

            expect(backendResult).toBe(0);
            expect(backendResult).toBe(frontendResult);
        });
    });
});
