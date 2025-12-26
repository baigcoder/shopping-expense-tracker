// Test Setup for Backend
import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Mock Prisma Client
vi.mock('../config/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        transaction: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        category: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        budget: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        $connect: vi.fn(),
        $disconnect: vi.fn(),
    },
}))

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(),
            signIn: vi.fn(),
            signOut: vi.fn(),
        },
    })),
}))

// Suppress console logs during tests
beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'info').mockImplementation(() => { })
})

afterAll(() => {
    vi.restoreAllMocks()
})

afterEach(() => {
    vi.clearAllMocks()
})

// Test utilities
export const mockUser = {
    id: 'test-user-id',
    supabaseId: 'supabase-123',
    email: 'test@example.com',
    name: 'Test User',
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
}

export const mockTransaction = {
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

export const mockCategory = {
    id: 'test-category-id',
    userId: 'test-user-id',
    name: 'Shopping',
    icon: '🛍️',
    color: '#6366f1',
}

// Request mock helper
export const createMockRequest = (overrides = {}) => ({
    user: mockUser,
    params: {},
    query: {},
    body: {},
    ...overrides,
})

// Response mock helper
export const createMockResponse = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    res.send = vi.fn().mockReturnValue(res)
    return res
}
