import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getSpendingSummary,
    getMonthlySpendingHistory,
    getCategorySpendingBreakdown,
    getStoreSpendingBreakdown,
} from '../analyticsDomainService.js';
import { supabase } from '../../config/supabase.js';

vi.mock('../../config/supabase.js', () => {
    return {
        supabase: {
            from: vi.fn(),
        },
    };
});

describe('analyticsDomainService - Financial Calculations & Precision', () => {
    const mockUserId = 'usr_financial_test_123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calculates spending summary with zero floating-point drift', async () => {
        const now = new Date();
        const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();
        const olderDate = new Date(now.getFullYear(), now.getMonth() - 3, 10).toISOString();

        // Deliberate floating point tripwires: 0.10 + 0.20 = 0.30000000000000004 in IEEE 754
        const mockTransactions = [
            { id: '1', user_id: mockUserId, type: 'expense', amount: 0.10, date: thisMonthDate },
            { id: '2', user_id: mockUserId, type: 'expense', amount: 0.20, date: thisMonthDate },
            { id: '3', user_id: mockUserId, type: 'expense', amount: 19.99, date: thisMonthDate },
            { id: '4', user_id: mockUserId, type: 'expense', amount: 50.00, date: lastMonthDate },
            { id: '5', user_id: mockUserId, type: 'income', amount: 5000.00, date: thisMonthDate }, // should be ignored in expense summary
            { id: '6', user_id: mockUserId, type: 'expense', amount: 100.00, date: olderDate },
        ];

        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const summary = await getSpendingSummary(mockUserId);

        // This month: 0.10 + 0.20 + 19.99 = 20.29 (exact decimal, no float drift)
        expect(summary.thisMonthSpent).toBe(20.29);
        expect(summary.thisMonthCount).toBe(3);
        // Last month: 50.00
        expect(summary.lastMonthSpent).toBe(50.00);
        // All time expenses: 20.29 + 50.00 + 100.00 = 170.29
        expect(summary.totalSpent).toBe(170.29);
        expect(summary.transactionCount).toBe(5);
        // Percentage change: ((20.29 - 50.00) / 50.00) * 100 = -59.42%
        expect(summary.percentageChange).toBe(-59.42);
    });

    it('groups monthly spending history in chronological order', async () => {
        const now = new Date();
        const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const mockTransactions = [
            { id: '1', user_id: mockUserId, type: 'expense', amount: 45.50, date: now.toISOString() },
            { id: '2', user_id: mockUserId, type: 'expense', amount: 54.50, date: now.toISOString() },
        ];

        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const history = await getMonthlySpendingHistory(mockUserId, 3);
        expect(history.length).toBe(3);

        const currentEntry = history.find((h) => h.month === curMonthStr);
        expect(currentEntry).toBeDefined();
        // 45.50 + 54.50 = 100.00
        expect(currentEntry!.total).toBe(100.00);
        expect(currentEntry!.transactionCount).toBe(2);
    });

    it('aggregates category spending breakdown with exact percentages', async () => {
        const mockTransactions = [
            { id: '1', user_id: mockUserId, type: 'expense', amount: 75.00, category: 'Shopping' },
            { id: '2', user_id: mockUserId, type: 'expense', amount: 25.00, category: 'Groceries' },
        ];

        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const breakdown = await getCategorySpendingBreakdown(mockUserId);
        expect(breakdown).toHaveLength(2);
        // Shopping is 75%, Groceries is 25%
        expect(breakdown[0].categoryName).toBe('Shopping');
        expect(breakdown[0].total).toBe(75.00);
        expect(breakdown[0].percentage).toBe(75.00);

        expect(breakdown[1].categoryName).toBe('Groceries');
        expect(breakdown[1].total).toBe(25.00);
        expect(breakdown[1].percentage).toBe(25.00);
    });

    it('aggregates store spending sorted by total descending', async () => {
        const mockTransactions = [
            { id: '1', user_id: mockUserId, type: 'expense', amount: 120.00, store_name: 'Apple' },
            { id: '2', user_id: mockUserId, type: 'expense', amount: 80.00, store_name: 'Amazon' },
            { id: '3', user_id: mockUserId, type: 'expense', amount: 300.00, store_name: 'Amazon' },
        ];

        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const stores = await getStoreSpendingBreakdown(mockUserId, 5);
        expect(stores).toHaveLength(2);
        // Amazon total = 380, Apple total = 120
        expect(stores[0].storeName).toBe('Amazon');
        expect(stores[0].total).toBe(380.00);
        expect(stores[0].transactionCount).toBe(2);

        expect(stores[1].storeName).toBe('Apple');
        expect(stores[1].total).toBe(120.00);
    });
});
