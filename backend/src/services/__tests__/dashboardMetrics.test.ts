import { describe, it, expect } from 'vitest';
import { computeFinancialHealthMetrics } from '../dashboardService.js';
import { Money } from '../../utils/money.js';

describe('computeFinancialHealthMetrics — Authoritative Safe-to-Spend (INV-07)', () => {
    it('CASE A: Liquid = $5,000, Committed = $1,500, Planned Savings = $1,000 -> Safe-to-Spend = $2,500', () => {
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(5000),
            monthlyExpenseMoney: Money.fromDecimal(800),
            monthlyIncomeMoney: Money.fromDecimal(6000),
            committedMonthlySpendMoney: Money.fromDecimal(1500),
            plannedSavingsAllocMoney: Money.fromDecimal(1000),
            dayOfMonth: 10,
            transactionCount: 15,
            budgetTotalMoney: Money.fromDecimal(2000),
        });

        // 5000 - 1500 - 1000 = 2500
        expect(result.safeToSpend).toBe(2500);
        expect(result.plannedSavingsReserve).toBe(1000);
    });

    it('CASE B: Liquid = $1,000, Committed = $800, Planned Savings = $500 -> Safe-to-Spend = $0 (clamped)', () => {
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(1000),
            monthlyExpenseMoney: Money.fromDecimal(600),
            monthlyIncomeMoney: Money.fromDecimal(2000),
            committedMonthlySpendMoney: Money.fromDecimal(800),
            plannedSavingsAllocMoney: Money.fromDecimal(500),
            dayOfMonth: 12,
            transactionCount: 8,
            budgetTotalMoney: Money.fromDecimal(1500),
        });

        // 1000 - 800 - 500 = -300 -> clamped at 0
        expect(result.safeToSpend).toBe(0);
        expect(result.plannedSavingsReserve).toBe(500);
    });

    it('CASE C: No active savings goals -> Safe-to-Spend = max(0, Liquid - Committed)', () => {
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(5000),
            monthlyExpenseMoney: Money.fromDecimal(800),
            monthlyIncomeMoney: Money.fromDecimal(6000),
            committedMonthlySpendMoney: Money.fromDecimal(1500),
            plannedSavingsAllocMoney: Money.zero(),
            dayOfMonth: 10,
            transactionCount: 15,
            budgetTotalMoney: Money.fromDecimal(2000),
        });

        // 5000 - 1500 - 0 = 3500
        expect(result.safeToSpend).toBe(3500);
        expect(result.plannedSavingsReserve).toBe(0);
    });

    it('CASE D: Inactive/completed/cancelled savings goal reserves $0', () => {
        // When goal is marked completed, plannedSavingsAllocMoney evaluates to zero
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(4000),
            monthlyExpenseMoney: Money.fromDecimal(500),
            monthlyIncomeMoney: Money.fromDecimal(4500),
            committedMonthlySpendMoney: Money.fromDecimal(1000),
            plannedSavingsAllocMoney: Money.zero(), // completed goal contributes 0
            dayOfMonth: 15,
            transactionCount: 10,
            budgetTotalMoney: Money.fromDecimal(2000),
        });

        // 4000 - 1000 - 0 = 3000
        expect(result.safeToSpend).toBe(3000);
    });

    it('CASE E: Multiple active goals sum without reserve duplication', () => {
        // Goal 1: $300, Goal 2: $450 -> Total reserve = $750
        const totalGoalsReserve = Money.fromDecimal(300).add(Money.fromDecimal(450));
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(6000),
            monthlyExpenseMoney: Money.fromDecimal(1000),
            monthlyIncomeMoney: Money.fromDecimal(7000),
            committedMonthlySpendMoney: Money.fromDecimal(2000),
            plannedSavingsAllocMoney: totalGoalsReserve,
            dayOfMonth: 20,
            transactionCount: 25,
            budgetTotalMoney: Money.fromDecimal(3000),
        });

        // 6000 - 2000 - 750 = 3250
        expect(result.safeToSpend).toBe(3250);
        expect(result.plannedSavingsReserve).toBe(750);
    });

    it('calculates Daily Burn Velocity and Cashflow Runway days accurately', () => {
        // Spent $600 in 15 days -> Burn Velocity = 600 / 15 = $40.00/day
        // Liquid balance = $2,400 -> Runway = 2400 / 40 = 60 days
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(2400),
            monthlyExpenseMoney: Money.fromDecimal(600),
            monthlyIncomeMoney: Money.fromDecimal(3000),
            committedMonthlySpendMoney: Money.fromDecimal(200),
            dayOfMonth: 15,
            transactionCount: 20,
            budgetTotalMoney: Money.fromDecimal(1200),
        });

        expect(result.burnVelocity).toBe(40);
        expect(result.runwayDays).toBe(60);
    });

    it('returns 999 runway days when burn velocity is zero', () => {
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(5000),
            monthlyExpenseMoney: Money.zero(),
            monthlyIncomeMoney: Money.fromDecimal(5000),
            committedMonthlySpendMoney: Money.zero(),
            dayOfMonth: 5,
            transactionCount: 0,
            budgetTotalMoney: Money.fromDecimal(1000),
        });

        expect(result.burnVelocity).toBe(0);
        expect(result.runwayDays).toBe(999);
    });

    it('returns 0 runway days when balance is negative or zero with active burn', () => {
        const result = computeFinancialHealthMetrics({
            totalBalanceMoney: Money.fromDecimal(-150),
            monthlyExpenseMoney: Money.fromDecimal(300),
            monthlyIncomeMoney: Money.zero(),
            committedMonthlySpendMoney: Money.fromDecimal(50),
            dayOfMonth: 10,
            transactionCount: 5,
            budgetTotalMoney: Money.fromDecimal(500),
        });

        expect(result.burnVelocity).toBe(30);
        expect(result.runwayDays).toBe(0);
    });
});
