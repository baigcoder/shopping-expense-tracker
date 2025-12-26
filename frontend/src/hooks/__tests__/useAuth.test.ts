// Tests for useAuth hook - State Management Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

// Mock supabase before importing the hook
vi.mock('../../config/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({
                data: { subscription: { id: 'test-id', callback: vi.fn(), unsubscribe: vi.fn() } },
            }),
        },
    },
}))

// Mock useAuthStore before importing the hook
const mockSetUser = vi.fn()
const mockSetLoading = vi.fn()
let mockUser: any = null
let mockIsAuthenticated = false
let mockIsLoading = false

vi.mock('../../store/useStore', () => ({
    useAuthStore: () => ({
        user: mockUser,
        isAuthenticated: mockIsAuthenticated,
        isLoading: mockIsLoading,
        setUser: mockSetUser,
        setLoading: mockSetLoading,
    }),
}))

// Import after mocks are set up
import { useAuth } from '../useAuth'
import { supabase } from '../../config/supabase'

// Wrapper component for router context
const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(BrowserRouter, null, children)

describe('useAuth Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUser = null
        mockIsAuthenticated = false
        mockIsLoading = false
    })

    describe('Initial State', () => {
        it('should return initial state with no user', () => {
            const { result } = renderHook(() => useAuth(), { wrapper })

            expect(result.current.user).toBeNull()
            expect(result.current.isAuthenticated).toBe(false)
            expect(result.current.isLoading).toBe(false)
        })

        it('should return user when authenticated', () => {
            mockUser = { id: 'test-id', email: 'test@example.com', name: 'Test User' }
            mockIsAuthenticated = true

            const { result } = renderHook(() => useAuth(), { wrapper })

            expect(result.current.user).toEqual(mockUser)
            expect(result.current.isAuthenticated).toBe(true)
        })
    })

    describe('Session Check', () => {
        it('should call getSession on mount', async () => {
            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValueOnce({
                data: { session: null },
                error: null,
            } as any)

            renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(mockGetSession).toHaveBeenCalled()
            })
        })

        it('should set user when session exists', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    user_metadata: { name: 'Test User' },
                    created_at: '2024-01-01',
                },
                access_token: 'token-123',
            }

            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValueOnce({
                data: { session: mockSession },
                error: null,
            } as any)

            renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(mockSetUser).toHaveBeenCalled()
            })
        })

        it('should handle session error gracefully', async () => {
            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValueOnce({
                data: { session: null },
                error: { message: 'Session error' },
            } as any)

            renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(mockSetUser).toHaveBeenCalledWith(null)
                expect(mockSetLoading).toHaveBeenCalledWith(false)
            })
        })
    })

    describe('Auth State Change Listener', () => {
        it('should set up auth state change listener on mount', () => {
            const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)

            renderHook(() => useAuth(), { wrapper })

            expect(mockOnAuthStateChange).toHaveBeenCalled()
        })

        it('should unsubscribe on unmount', () => {
            const mockUnsubscribe = vi.fn()
            const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)
            mockOnAuthStateChange.mockReturnValue({
                data: { subscription: { id: 'test-id', callback: vi.fn(), unsubscribe: mockUnsubscribe } },
            })

            const { unmount } = renderHook(() => useAuth(), { wrapper })

            unmount()

            expect(mockUnsubscribe).toHaveBeenCalled()
        })
    })

    describe('Loading State', () => {
        it('should reflect loading state from store', () => {
            mockIsLoading = true

            const { result } = renderHook(() => useAuth(), { wrapper })

            expect(result.current.isLoading).toBe(true)
        })

        it('should call setLoading(false) after session check', async () => {
            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValueOnce({
                data: { session: null },
                error: null,
            } as any)

            renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(false)
            })
        })
    })
})
