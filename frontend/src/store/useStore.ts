// Global State Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';

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
            sidebarOpen: false, // Start closed for better UX
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
                // Don't persist sidebarOpen - always start closed for better UX
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

// Card interface
export interface Card {
    id: string;
    user_id: string; // Required - associate with user
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    pin: string;
    type: CardBrand;
    theme: string;
}

// All cards storage (stores all users' cards)
interface AllCardsStorage {
    [userId: string]: Card[];
}

interface CardState {
    cards: Card[];
    isLoading: boolean;
    currentUserId: string | null;
    initializeCards: (userId: string) => Promise<void>;
    setCards: (cards: Card[]) => void;
    addCard: (card: Omit<Card, 'id'>) => void;
    removeCard: (id: string) => void;
    updateCard: (id: string, updates: Partial<Card>) => void;
    clearCards: () => void;
}

// Helper to get all cards from storage
const getAllCardsFromStorage = (): AllCardsStorage => {
    try {
        const stored = localStorage.getItem('all-cards-storage');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading cards from storage:', e);
    }
    return {};
};

// Helper to save all cards to storage
const saveAllCardsToStorage = (allCards: AllCardsStorage) => {
    try {
        localStorage.setItem('all-cards-storage', JSON.stringify(allCards));
    } catch (e) {
        console.error('Error saving cards to storage:', e);
    }
};

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

export const useCardStore = create<CardState>()((set, get) => ({
    cards: [],
    isLoading: false,
    currentUserId: null,

    // Initialize cards for a specific user - FETCH FROM SUPABASE FIRST
    initializeCards: async (userId: string) => {
        set({ isLoading: true });

        try {
            // FIRST: Try to fetch from Supabase
            const { supabase } = await import('../config/supabase');
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                // Map Supabase data to Card format
                const cards: Card[] = data.map(card => ({
                    id: card.id,
                    user_id: card.user_id,
                    number: card.number,
                    holder: card.holder,
                    expiry: card.expiry,
                    cvv: card.cvv,
                    pin: card.pin,
                    type: card.card_type || card.type || 'unknown',
                    theme: card.theme
                }));

                console.log('✅ Loaded', cards.length, 'cards from Supabase');
                set({ cards, currentUserId: userId, isLoading: false });

                // Also cache to localStorage
                const allCards = getAllCardsFromStorage();
                allCards[userId] = cards;
                saveAllCardsToStorage(allCards);
                return;
            }
        } catch (e) {
            console.error('Error fetching cards from Supabase:', e);
        }

        // FALLBACK: Load from localStorage
        const allCards = getAllCardsFromStorage();
        const userCards = allCards[userId] || [];
        console.log('📦 Loaded', userCards.length, 'cards from localStorage');
        set({ cards: userCards, currentUserId: userId, isLoading: false });
    },

    setCards: (cards) => {
        const { currentUserId } = get();
        set({ cards });

        // Persist to storage
        if (currentUserId) {
            const allCards = getAllCardsFromStorage();
            allCards[currentUserId] = cards;
            saveAllCardsToStorage(allCards);
        }
    },

    addCard: (card) => {
        const { currentUserId, cards } = get();
        if (!currentUserId) {
            console.error('No user logged in, cannot add card');
            return;
        }

        const newCard: Card = {
            ...card,
            id: (card as any).id || crypto.randomUUID(), // Use provided id (from Supabase) or generate new
            user_id: card.user_id || currentUserId,
        };

        const updatedCards = [newCard, ...cards];
        set({ cards: updatedCards });

        // Persist to storage
        const allCards = getAllCardsFromStorage();
        allCards[currentUserId] = updatedCards;
        saveAllCardsToStorage(allCards);
    },

    removeCard: (id) => {
        const { currentUserId, cards } = get();
        const updatedCards = cards.filter((c) => c.id !== id);
        set({ cards: updatedCards });

        // Persist to storage
        if (currentUserId) {
            const allCards = getAllCardsFromStorage();
            allCards[currentUserId] = updatedCards;
            saveAllCardsToStorage(allCards);
        }
    },

    updateCard: (id, updates) => {
        const { currentUserId, cards } = get();
        const updatedCards = cards.map((c) => c.id === id ? { ...c, ...updates } : c);
        set({ cards: updatedCards });

        // Persist to storage
        if (currentUserId) {
            const allCards = getAllCardsFromStorage();
            allCards[currentUserId] = updatedCards;
            saveAllCardsToStorage(allCards);
        }
    },

    clearCards: () => {
        const { currentUserId } = get();
        set({ cards: [] });

        // Persist to storage
        if (currentUserId) {
            const allCards = getAllCardsFromStorage();
            allCards[currentUserId] = [];
            saveAllCardsToStorage(allCards);
        }
    },
}));
