// Tests for Transaction Controller
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'

// Test data
const mockUser = {
    id: 'test-user-id',
    supabaseId: 'supabase-123',
    email: 'test@example.com',
    name: 'Test User',
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
}

const mockTransaction = {
    id: 'test-transaction-id',
    userId: 'test-user-id',
    amount: 99.99,
    currency: 'USD',
    storeName: 'Amazon',
    storeUrl: 'https://amazon.com',
    productName: 'Test Product',
    categoryId: 'test-category-id',
    purchaseDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: 'Test notes',
    category: {
        id: 'test-category-id',
        name: 'Shopping',
        icon: '🛍️',
        color: '#6366f1',
    },
}

// Mock Prisma
const mockPrisma = {
    transaction: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
}

vi.mock('../../config/prisma.js', () => ({
    default: mockPrisma,
}))

// Mock error handler
vi.mock('../../middleware/errorHandler.js', () => ({
    asyncHandler: (fn: Function) => fn,
    createError: (message: string, status: number) => {
        const error = new Error(message) as Error & { status: number }
        error.status = status
        return error
    },
}))

// Mock Decimal from Prisma
vi.mock('@prisma/client/runtime/library', () => ({
    Decimal: class {
        constructor(public value: number) { }
    },
}))

// Helper functions
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
    res.send = vi.fn().mockReturnValue(res)
    return res
}

const createMockNext = (): NextFunction => vi.fn()


import {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions,
} from '../../controllers/transactionController'

describe('Transaction Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getTransactions', () => {
        it('should return paginated transactions', async () => {
            const mockTransactions = [mockTransaction]
            mockPrisma.transaction.findMany.mockResolvedValueOnce(mockTransactions)
            mockPrisma.transaction.count.mockResolvedValueOnce(1)

            const req = createMockRequest({ query: { page: '1', limit: '20' } })
            const res = createMockResponse()

            await getTransactions(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findMany).toHaveBeenCalled()
            expect(mockPrisma.transaction.count).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransactions,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            })
        })

        it('should apply search filter', async () => {
            mockPrisma.transaction.findMany.mockResolvedValueOnce([])
            mockPrisma.transaction.count.mockResolvedValueOnce(0)

            const req = createMockRequest({ query: { search: 'laptop' } })
            const res = createMockResponse()

            await getTransactions(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ storeName: expect.anything() }),
                            expect.objectContaining({ productName: expect.anything() }),
                        ]),
                    }),
                })
            )
        })

        it('should apply category filter', async () => {
            mockPrisma.transaction.findMany.mockResolvedValueOnce([])
            mockPrisma.transaction.count.mockResolvedValueOnce(0)

            const req = createMockRequest({ query: { categoryId: 'cat-123' } })
            const res = createMockResponse()

            await getTransactions(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        categoryId: 'cat-123',
                    }),
                })
            )
        })
    })

    describe('getTransaction', () => {
        it('should return a single transaction', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValueOnce(mockTransaction)

            const req = createMockRequest({ params: { id: 'txn-123' } })
            const res = createMockResponse()

            await getTransaction(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
                where: { id: 'txn-123', userId: mockUser.id },
                include: expect.anything(),
            })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransaction,
            })
        })

        it('should throw 404 if transaction not found', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValueOnce(null)

            const req = createMockRequest({ params: { id: 'nonexistent' } })
            const res = createMockResponse()

            await expect(
                getTransaction(req as Request, res as Response, createMockNext())
            ).rejects.toThrow('Transaction not found')
        })
    })

    describe('createTransaction', () => {
        it('should create a new transaction', async () => {
            const newTransaction = { ...mockTransaction, id: 'new-txn' }
            mockPrisma.transaction.create.mockResolvedValueOnce(newTransaction)

            const req = createMockRequest({
                body: {
                    amount: 99.99,
                    storeName: 'Amazon',
                    currency: 'USD',
                },
            })
            const res = createMockResponse()

            await createTransaction(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.create).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction created successfully',
                data: newTransaction,
            })
        })
    })

    describe('updateTransaction', () => {
        it('should update an existing transaction', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValueOnce(mockTransaction)
            const updatedTransaction = { ...mockTransaction, amount: 150 }
            mockPrisma.transaction.update.mockResolvedValueOnce(updatedTransaction)

            const req = createMockRequest({
                params: { id: 'txn-123' },
                body: { amount: 150 },
            })
            const res = createMockResponse()

            await updateTransaction(req as Request, res as Response, createMockNext())

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction updated successfully',
                data: updatedTransaction,
            })
        })

        it('should throw 404 if transaction not found', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValueOnce(null)

            const req = createMockRequest({
                params: { id: 'nonexistent' },
                body: { amount: 150 },
            })
            const res = createMockResponse()

            await expect(
                updateTransaction(req as Request, res as Response, createMockNext())
            ).rejects.toThrow('Transaction not found')
        })
    })

    describe('deleteTransaction', () => {
        it('should delete an existing transaction', async () => {
            mockPrisma.transaction.findFirst.mockResolvedValueOnce(mockTransaction)
            mockPrisma.transaction.delete.mockResolvedValueOnce(mockTransaction)

            const req = createMockRequest({ params: { id: 'txn-123' } })
            const res = createMockResponse()

            await deleteTransaction(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
                where: { id: 'txn-123' },
            })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Transaction deleted successfully',
            })
        })
    })

    describe('getRecentTransactions', () => {
        it('should return recent transactions with default limit', async () => {
            const recentTransactions = [mockTransaction]
            mockPrisma.transaction.findMany.mockResolvedValueOnce(recentTransactions)

            const req = createMockRequest({})
            const res = createMockResponse()

            await getRecentTransactions(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5,
                    orderBy: { purchaseDate: 'desc' },
                })
            )
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: recentTransactions,
            })
        })

        it('should use custom limit when provided', async () => {
            mockPrisma.transaction.findMany.mockResolvedValueOnce([])

            const req = createMockRequest({ query: { limit: '10' } })
            const res = createMockResponse()

            await getRecentTransactions(req as Request, res as Response, createMockNext())

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 10 })
            )
        })
    })
})
