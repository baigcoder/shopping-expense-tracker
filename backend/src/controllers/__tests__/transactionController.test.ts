// Tests for Supabase-backed transaction controller
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

const mockUser = {
    id: 'test-user-id',
    supabaseId: 'supabase-123',
    email: 'test@example.com',
}

const mockTransaction = {
    id: 'test-transaction-id',
    user_id: mockUser.supabaseId,
    amount: 99.99,
    description: 'Amazon - Test Product',
    category: 'Shopping',
    type: 'expense',
    date: '2026-04-29T00:00:00.000Z',
    store_name: 'Amazon',
    product_name: 'Test Product',
    created_at: '2026-04-29T00:00:00.000Z',
}

const mockListUserTransactions = vi.hoisted(() => vi.fn())
const mockListUserTransactionsPage = vi.hoisted(() => vi.fn())
const mockGetMoneyTransaction = vi.hoisted(() => vi.fn())
const mockCreateMoneyTransaction = vi.hoisted(() => vi.fn())
const mockCreateDetectedTransaction = vi.hoisted(() => vi.fn())
const mockUpdateMoneyTransaction = vi.hoisted(() => vi.fn())
const mockDeleteMoneyTransaction = vi.hoisted(() => vi.fn())

vi.mock('../../services/transactionDomainService.js', () => ({
    listUserTransactions: mockListUserTransactions,
    listUserTransactionsPage: mockListUserTransactionsPage,
    getMoneyTransaction: mockGetMoneyTransaction,
    createMoneyTransaction: mockCreateMoneyTransaction,
    createDetectedTransaction: mockCreateDetectedTransaction,
    updateMoneyTransaction: mockUpdateMoneyTransaction,
    deleteMoneyTransaction: mockDeleteMoneyTransaction,
}))

vi.mock('../../middleware/errorHandler.js', () => ({
    asyncHandler: (fn: Function) => fn,
    createError: (message: string, status: number) => {
        const error = new Error(message) as Error & { status: number }
        error.status = status
        return error
    },
}))

const createMockRequest = (overrides = {}): Partial<Request> => ({
    user: mockUser as any,
    params: {},
    query: {},
    body: {},
    ...overrides,
})

const createMockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}

const createMockNext = (): NextFunction => vi.fn()

import {
    getTransactions,
    getTransaction,
    createTransaction,
    createDetectedTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions,
} from '../../controllers/transactionController'

describe('Transaction Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getTransactions', () => {
        it('returns paginated canonical transactions', async () => {
            mockListUserTransactionsPage.mockResolvedValueOnce({
                transactions: [mockTransaction],
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            })

            const req = createMockRequest({ query: { page: '1', limit: '20' } })
            const res = createMockResponse()

            await getTransactions(req as Request, res as Response, createMockNext())

            expect(mockListUserTransactionsPage).toHaveBeenCalledWith(mockUser.supabaseId, {
                page: 1,
                limit: 20,
                category: undefined,
                search: undefined,
                sortBy: 'date',
                sortOrder: 'desc',
            })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [mockTransaction],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            })
        })

        it('passes search and category filters to the domain service', async () => {
            mockListUserTransactionsPage.mockResolvedValueOnce({
                transactions: [],
                page: 2,
                limit: 10,
                total: 0,
                totalPages: 0,
            })

            const req = createMockRequest({
                query: {
                    page: '2',
                    limit: '10',
                    search: 'laptop',
                    category: 'Shopping',
                    sortBy: 'amount',
                    sortOrder: 'asc',
                },
            })
            const res = createMockResponse()

            await getTransactions(req as Request, res as Response, createMockNext())

            expect(mockListUserTransactionsPage).toHaveBeenCalledWith(mockUser.supabaseId, {
                page: 2,
                limit: 10,
                category: 'Shopping',
                search: 'laptop',
                sortBy: 'amount',
                sortOrder: 'asc',
            })
        })
    })

    describe('getTransaction', () => {
        it('returns a single transaction', async () => {
            mockGetMoneyTransaction.mockResolvedValueOnce(mockTransaction)

            const req = createMockRequest({ params: { id: 'txn-123' } })
            const res = createMockResponse()

            await getTransaction(req as Request, res as Response, createMockNext())

            expect(mockGetMoneyTransaction).toHaveBeenCalledWith(mockUser.supabaseId, 'txn-123')
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransaction,
            })
        })

        it('throws 404 if transaction not found', async () => {
            mockGetMoneyTransaction.mockResolvedValueOnce(null)

            const req = createMockRequest({ params: { id: 'missing' } })
            const res = createMockResponse()

            await expect(
                getTransaction(req as Request, res as Response, createMockNext())
            ).rejects.toThrow('Transaction not found')
        })
    })

    describe('createTransaction', () => {
        it('creates a manual transaction in the canonical ledger', async () => {
            mockCreateMoneyTransaction.mockResolvedValueOnce(mockTransaction)

            const req = createMockRequest({
                body: {
                    amount: 99.99,
                    storeName: 'Amazon',
                    productName: 'Test Product',
                    category: 'Shopping',
                    currency: 'USD',
                },
            })
            const res = createMockResponse()

            await createTransaction(req as Request, res as Response, createMockNext())

            expect(mockCreateMoneyTransaction).toHaveBeenCalledWith(expect.objectContaining({
                user_id: mockUser.supabaseId,
                amount: 99.99,
                description: 'Amazon - Test Product',
                category: 'Shopping',
                source: 'manual-api',
                store_name: 'Amazon',
                product_name: 'Test Product',
            }))
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction created successfully',
                data: mockTransaction,
            })
        })
    })

    describe('createDetectedTransaction', () => {
        it('saves detected transactions through the transaction domain service', async () => {
            const payload = {
                amount: 2500,
                serviceName: 'Netflix',
                type: 'subscription',
                isSubscription: true,
            }
            mockCreateDetectedTransaction.mockResolvedValueOnce({
                transaction: mockTransaction,
                duplicate: false,
                transactionHash: 'test-hash',
            })

            const req = createMockRequest({ body: payload })
            const res = createMockResponse()

            await createDetectedTransaction(req as Request, res as Response, createMockNext())

            expect(mockCreateDetectedTransaction).toHaveBeenCalledWith(mockUser.supabaseId, payload)
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Detected transaction saved',
                data: mockTransaction,
                transaction: mockTransaction,
                duplicate: false,
                transactionHash: 'test-hash',
            })
        })
    })

    describe('updateTransaction', () => {
        it('updates an existing transaction', async () => {
            const updatedTransaction = { ...mockTransaction, amount: 150 }
            mockUpdateMoneyTransaction.mockResolvedValueOnce(updatedTransaction)

            const req = createMockRequest({
                params: { id: 'txn-123' },
                body: { amount: 150 },
            })
            const res = createMockResponse()

            await updateTransaction(req as Request, res as Response, createMockNext())

            expect(mockUpdateMoneyTransaction).toHaveBeenCalledWith(mockUser.supabaseId, 'txn-123', { amount: 150 })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction updated successfully',
                data: updatedTransaction,
            })
        })

        it('throws 404 if transaction not found', async () => {
            mockUpdateMoneyTransaction.mockResolvedValueOnce(null)

            const req = createMockRequest({
                params: { id: 'missing' },
                body: { amount: 150 },
            })
            const res = createMockResponse()

            await expect(
                updateTransaction(req as Request, res as Response, createMockNext())
            ).rejects.toThrow('Transaction not found')
        })
    })

    describe('deleteTransaction', () => {
        it('deletes an existing transaction', async () => {
            mockGetMoneyTransaction.mockResolvedValueOnce(mockTransaction)
            mockDeleteMoneyTransaction.mockResolvedValueOnce(undefined)

            const req = createMockRequest({ params: { id: 'txn-123' } })
            const res = createMockResponse()

            await deleteTransaction(req as Request, res as Response, createMockNext())

            expect(mockGetMoneyTransaction).toHaveBeenCalledWith(mockUser.supabaseId, 'txn-123')
            expect(mockDeleteMoneyTransaction).toHaveBeenCalledWith(mockUser.supabaseId, 'txn-123')
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction deleted successfully',
            })
        })
    })

    describe('getRecentTransactions', () => {
        it('returns recent transactions with default limit', async () => {
            mockListUserTransactions.mockResolvedValueOnce([mockTransaction])

            const req = createMockRequest({})
            const res = createMockResponse()

            await getRecentTransactions(req as Request, res as Response, createMockNext())

            expect(mockListUserTransactions).toHaveBeenCalledWith(mockUser.supabaseId, { limit: 5 })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [mockTransaction],
            })
        })

        it('uses custom limit when provided', async () => {
            mockListUserTransactions.mockResolvedValueOnce([])

            const req = createMockRequest({ query: { limit: '10' } })
            const res = createMockResponse()

            await getRecentTransactions(req as Request, res as Response, createMockNext())

            expect(mockListUserTransactions).toHaveBeenCalledWith(mockUser.supabaseId, { limit: 10 })
        })
    })
})
