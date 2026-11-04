// Global State Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { cardService } from '../services/cardService';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => {
                localStorage.removeItem('auth-storage');
                // Don't remove card-storage on logout - cards are now stored per-user
                set({ user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// UI State Store
interface UIState {
    sidebarOpen: boolean;
    sidebarHovered: boolean; // New transient state
    theme: 'dark' | 'light';
    currency: string;
    isChatOpen: boolean;
    soundEnabled: boolean;
    reducedMotion: boolean;
    toggleSound: () => void;
    toggleReducedMotion: () => void;
    toggleSidebar: (force?: boolean) => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarHovered: (hovered: boolean) => void; // New setter
    setTheme: (theme: 'dark' | 'light') => void;
    setCurrency: (currency: string) => void;
    toggleChat: () => void;
    setChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: true, // Keep desktop sidebar open by default
            sidebarHovered: false,
            theme: 'dark',
            currency: 'USD',
            isChatOpen: false,
            // Enhanced toggle to accept force value or toggle
            toggleSidebar: (force) => set((state) => ({
                sidebarOpen: typeof force === 'boolean' ? force : !state.sidebarOpen
            })),
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            setSidebarHovered: (sidebarHovered) => set({ sidebarHovered }),
            setTheme: (theme) => set({ theme }),
            setCurrency: (currency) => set({ currency }),
            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
            setChatOpen: (isChatOpen) => set({ isChatOpen }),
            soundEnabled: true,
            reducedMotion: false,
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
            toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({
                // Don't persist sidebarOpen - always start open by default
                theme: state.theme,
                currency: state.currency,
                soundEnabled: state.soundEnabled,
                reducedMotion: state.reducedMotion
                // Don't persist chat open state or sidebarHovered
            }),
        }
    )
);

// Transaction Modal State
interface ModalState {
    isAddTransactionOpen: boolean;
    isAddCardOpen: boolean;
    isQuickAddOpen: boolean;
    editingTransaction: string | null;
    openAddTransaction: () => void;
    openEditTransaction: (id: string) => void;
    closeTransactionModal: () => void;
    openAddCard: () => void;
    closeAddCard: () => void;
    openQuickAdd: () => void;
    closeQuickAdd: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isAddTransactionOpen: false,
    isAddCardOpen: false,
    isQuickAddOpen: false,
    editingTransaction: null,
    openAddTransaction: () => set({ isAddTransactionOpen: true, editingTransaction: null }),
    openEditTransaction: (id) => set({ isAddTransactionOpen: true, editingTransaction: id }),
    closeTransactionModal: () => set({ isAddTransactionOpen: false, editingTransaction: null }),
    openAddCard: () => set({ isAddCardOpen: true }),
    closeAddCard: () => set({ isAddCardOpen: false }),
    openQuickAdd: () => set({ isQuickAddOpen: true }),
    closeQuickAdd: () => set({ isQuickAddOpen: false }),
}));

// Card Types
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'paypal' | 'unionpay' | 'jcb' | 'diners' | 'unknown';

// Card interface - SECURITY: CVV stored encrypted, protected by user password
export interface Card {
    id: string;
    user_id: string;
    last4: string;   // Only last 4 digits stored (PCI-DSS compliant)
    holder: string;
    expiry: string;
    type: CardBrand;
    theme: string;
    // Real-world features
    nickname?: string;        // Custom name like "Groceries Card"
    spending_limit?: number;  // Monthly spending limit
    is_frozen?: boolean;      // Temporarily disable card
    is_default?: boolean;     // Primary card for payments
    color?: string;           // Custom card color
    last_used_at?: string;    // Last transaction date
    total_spent?: number;     // Monthly spending total (computed)
    // Deprecated fields - kept for backwards compatibility
    number?: string; // @deprecated - use last4 instead
}

interface CardState {
    cards: Card[];
    isLoading: boolean;
    currentUserId: string | null;
    /** Resolves false when the cards could not be loaded, so the screen can say so instead of showing none. */
    initializeCards: (userId: string) => Promise<boolean>;
    setCards: (cards: Card[]) => void;
    addCard: (card: Omit<Card, 'id'> & { id?: string }) => void;
    /** Throw when the save fails; the screen goes back to how it was. */
    removeCard: (id: string) => Promise<void>;
    updateCard: (id: string, updates: Pick<Card, 'nickname' | 'spending_limit' | 'is_frozen' | 'is_default'>) => Promise<void>;
    clearCards: () => void;
}

// Detect card brand from number
export const detectCardBrand = (number: string): CardBrand => {
    const cleanNumber = number.replace(/\s/g, '');

    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2(2[2-9][1-9]|[3-6]|7[0-1]|720)/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6011|^64[4-9]|^65/.test(cleanNumber)) return 'discover';
    if (/^35/.test(cleanNumber)) return 'jcb';
    if (/^3(0[0-5]|[68])/.test(cleanNumber)) return 'diners';
    if (/^62/.test(cleanNumber)) return 'unionpay';

    return 'unknown';
};

// Cards live only in Supabase. They used to be cached in localStorage under one key for every user who
// signed in on the browser, which outlived sign-out and brought deleted cards back; that copy is cleared here.
try { localStorage.removeItem('all-cards-storage'); } catch { /* storage may be blocked */ }

export const useCardStore = create<CardState>()((set, get) => ({
    cards: [],
    isLoading: false,
    currentUserId: null,

    initializeCards: async (userId: string) => {
        set({ isLoading: true, currentUserId: userId });
        try {
            const rows = await cardService.getAll(userId);
            set({
                cards: rows.map((c) => ({
                    id: c.id, user_id: c.user_id, last4: c.last4, holder: c.holder, expiry: c.expiry,
                    type: (c.card_type || 'unknown') as CardBrand, theme: c.theme,
                    nickname: c.nickname ?? undefined, spending_limit: c.spending_limit ?? undefined,
                    is_frozen: Boolean(c.is_frozen), is_default: Boolean(c.is_default),
                })),
                isLoading: false,
            });
            return true;
        } catch (e) {
            console.error('Error fetching cards:', e);
            set({ isLoading: false });
            return false;
        }
    },

    setCards: (cards) => set({ cards }),

    addCard: (card) => {
        const { currentUserId, cards } = get();
        if (!currentUserId) return;
        set({ cards: [{ ...card, id: card.id || crypto.randomUUID(), user_id: card.user_id || currentUserId }, ...cards] });
    },

    removeCard: async (id) => {
        const before = get().cards;
        set({ cards: before.filter((c) => c.id !== id) });
        if (!(await cardService.delete(id))) {
            set({ cards: before });
            throw new Error('Could not remove the card');
        }
    },

    updateCard: async (id, updates) => {
        const before = get().cards;
        set({ cards: before.map((c) => (c.id === id ? { ...c, ...updates } : c)) });
        if (!(await cardService.update(id, updates))) {
            set({ cards: before });
            throw new Error('Could not save the card');
        }
    },

    clearCards: () => set({ cards: [] }),
}));
