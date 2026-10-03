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
    createClient: vi.fn((_url: string, _key: string, options?: any) => {
        const headers = new Map<string, string>();
        if (options?.global?.headers) {
            Object.entries(options.global.headers).forEach(([k, v]) => {
                headers.set(k, String(v));
            });
        }
        return {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') }),
                signIn: vi.fn(),
                signOut: vi.fn(),
            },
            rest: {
                headers: {
                    get: (headerName: string) => headers.get(headerName) || headers.get(headerName.toLowerCase()) || undefined,
                },
            },
            from: vi.fn(() => ({
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                range: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
        };
    }),
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
