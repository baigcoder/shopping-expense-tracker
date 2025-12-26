// Tests for transactionService
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the api module
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}))

import { transactionService } from '../transactionService'
import api from '../api'

describe('transactionService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAll', () => {
        it('should fetch all transactions with default params', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [
                        { id: '1', storeName: 'Amazon', amount: 99.99 },
                        { id: '2', storeName: 'eBay', amount: 49.99 },
                    ],
                    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
                },
            }

            vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.getAll()

            expect(api.get).toHaveBeenCalledWith('/transactions?')
            expect(result).toEqual(mockResponse.data)
        })

        it('should apply filters to the request', async () => {
            const mockResponse = { data: { success: true, data: [] } }
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

            await transactionService.getAll({
                page: 2,
                limit: 10,
                categoryId: 'cat-123',
                search: 'laptop',
            })

            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('page=2')
            )
            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('limit=10')
            )
            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('categoryId=cat-123')
            )
            expect(api.get).toHaveBeenCalledWith(
                expect.stringContaining('search=laptop')
            )
        })
    })

    describe('getRecent', () => {
        it('should fetch recent transactions with default limit', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: [{ id: '1', storeName: 'Amazon', amount: 99.99 }],
                },
            }

            vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.getRecent()

            expect(api.get).toHaveBeenCalledWith('/transactions/recent?limit=5')
            expect(result).toEqual(mockResponse.data)
        })

        it('should use custom limit when provided', async () => {
            const mockResponse = { data: { success: true, data: [] } }
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

            await transactionService.getRecent(10)

            expect(api.get).toHaveBeenCalledWith('/transactions/recent?limit=10')
        })
    })

    describe('getById', () => {
        it('should fetch a single transaction by ID', async () => {
            const mockTransaction = {
                id: 'txn-123',
                storeName: 'Amazon',
                amount: 149.99,
            }
            const mockResponse = {
                data: { success: true, data: mockTransaction },
            }

            vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.getById('txn-123')

            expect(api.get).toHaveBeenCalledWith('/transactions/txn-123')
            expect(result).toEqual(mockResponse.data)
        })
    })

    describe('create', () => {
        it('should create a new transaction with proper payload', async () => {
            const inputData = {
                amount: '99.99',
                storeName: 'Amazon',
                storeUrl: 'https://amazon.com',
                productName: 'Test Product',
                categoryId: 'cat-123',
                purchaseDate: '2024-01-15',
                notes: 'Test notes',
            }

            const mockResponse = {
                data: {
                    success: true,
                    data: { id: 'new-txn', ...inputData, amount: 99.99 },
                },
            }

            vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.create(inputData)

            expect(api.post).toHaveBeenCalledWith('/transactions', {
                amount: 99.99,
                storeName: 'Amazon',
                storeUrl: 'https://amazon.com',
                productName: 'Test Product',
                categoryId: 'cat-123',
                purchaseDate: '2024-01-15',
                notes: 'Test notes',
            })
            expect(result).toEqual(mockResponse.data)
        })

        it('should handle optional fields correctly', async () => {
            const inputData = {
                amount: '50.00',
                storeName: 'Store',
                purchaseDate: '2024-01-15',
            }

            const mockResponse = { data: { success: true, data: { id: 'new-txn' } } }
            vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

            await transactionService.create(inputData as any)

            expect(api.post).toHaveBeenCalledWith('/transactions', {
                amount: 50,
                storeName: 'Store',
                storeUrl: null,
                productName: null,
                categoryId: null,
                purchaseDate: '2024-01-15',
                notes: null,
            })
        })
    })

    describe('update', () => {
        it('should update transaction with partial data', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    data: { id: 'txn-123', amount: 150 },
                },
            }

            vi.mocked(api.patch).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.update('txn-123', {
                amount: '150',
                storeName: 'Updated Store',
            })

            expect(api.patch).toHaveBeenCalledWith('/transactions/txn-123', {
                amount: 150,
                storeName: 'Updated Store',
            })
            expect(result).toEqual(mockResponse.data)
        })
    })

    describe('delete', () => {
        it('should delete a transaction by ID', async () => {
            const mockResponse = { data: { success: true } }
            vi.mocked(api.delete).mockResolvedValueOnce(mockResponse)

            const result = await transactionService.delete('txn-123')

            expect(api.delete).toHaveBeenCalledWith('/transactions/txn-123')
            expect(result).toEqual(mockResponse.data)
        })
    })

    describe('Error Handling', () => {
        it('should propagate API errors', async () => {
            const error = new Error('Network error')
            vi.mocked(api.get).mockRejectedValueOnce(error)

            await expect(transactionService.getAll()).rejects.toThrow('Network error')
        })
    })
})
