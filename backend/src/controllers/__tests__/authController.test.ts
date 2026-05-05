// Tests for Auth Controller
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'

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

// Mock Prisma
const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
}))

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

import {
    getProfile,
    updateProfile,
} from '../../controllers/authController'

describe('Auth Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getProfile', () => {
        it('should return current user profile', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({
                ...mockUser,
                _count: { transactions: 10, categories: 5 },
            })

            const req = createMockRequest({})
            const res = createMockResponse()

            await getProfile(req as Request, res as Response)

            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                select: expect.objectContaining({
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                    currency: true,
                    createdAt: true,
                }),
            })
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
            })
        })

        it('should throw 404 if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null)

            const req = createMockRequest({})
            const res = createMockResponse()

            await getProfile(req as Request, res as Response)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'User not found',
            })
        })
    })

    describe('updateProfile', () => {
        it('should update user profile', async () => {
            const updatedUser = { ...mockUser, name: 'Updated Name' }
            mockPrisma.user.update.mockResolvedValueOnce(updatedUser)

            const req = createMockRequest({
                body: { name: 'Updated Name' },
            })
            const res = createMockResponse()

            await updateProfile(req as Request, res as Response)

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { name: 'Updated Name' },
                select: expect.objectContaining({ id: true, email: true, name: true }),
            })
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedUser,
            })
        })

        it('should update currency', async () => {
            const updatedUser = { ...mockUser, currency: 'EUR' }
            mockPrisma.user.update.mockResolvedValueOnce(updatedUser)

            const req = createMockRequest({
                body: { currency: 'EUR' },
            })
            const res = createMockResponse()

            await updateProfile(req as Request, res as Response)

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { currency: 'EUR' },
                select: expect.objectContaining({ id: true, email: true, currency: true }),
            })
        })

        it('should update avatar URL', async () => {
            const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' }
            mockPrisma.user.update.mockResolvedValueOnce(updatedUser)

            const req = createMockRequest({
                body: { avatarUrl: 'https://example.com/avatar.jpg' },
            })
            const res = createMockResponse()

            await updateProfile(req as Request, res as Response)

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { avatarUrl: 'https://example.com/avatar.jpg' },
                select: expect.objectContaining({ id: true, email: true, avatarUrl: true }),
            })
        })
    })
})
