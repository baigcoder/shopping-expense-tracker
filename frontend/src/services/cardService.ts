// Card Service - Supabase Integration
import { supabase } from '../config/supabase';
import { CardBrand } from '../store/useStore';

export interface CardData {
    id: string;
    user_id: string;
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    pin: string;
    card_type: CardBrand;
    theme: string;
    created_at: string;
}

export const cardService = {
    // Get all cards for user
    getAll: async (userId: string): Promise<CardData[]> => {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cards:', error);
            return [];
        }

        return data || [];
    },

    // Create a new card
    create: async (card: Omit<CardData, 'id' | 'created_at'>): Promise<CardData | null> => {
        const { data, error } = await supabase
            .from('cards')
            .insert(card)
            .select()
            .single();

        if (error) {
            console.error('Error creating card:', error);
            return null;
        }

        return data;
    },

    // Delete a card
    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting card:', error);
            return false;
        }

        return true;
    },

    // Update a card
    update: async (id: string, updates: Partial<CardData>): Promise<CardData | null> => {
        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating card:', error);
            return null;
        }

        return data;
    }
};

// 5 Gen Z Card Design Themes with Quotes
export const CARD_THEMES = [
    {
        id: 'money-moves',
        name: 'Money Moves 💸',
        gradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
        pattern: 'cash',
        accent: '#064E3B',
        mascot: '💸',
        quote: 'MONEY MOVES'
    },
    {
        id: 'rich-flex',
        name: 'Rich Flex 💅',
        gradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 50%, #F472B6 100%)',
        pattern: 'sparkles',
        accent: '#831843',
        mascot: '💅',
        quote: 'RICH FLEX'
    },
    {
        id: 'no-cap',
        name: 'No Cap 🧢',
        gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
        pattern: 'waves',
        accent: '#1E3A8A',
        mascot: '🧢',
        quote: 'NO CAP'
    },
    {
        id: 'main-character',
        name: 'Main Character 🌟',
        gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
        pattern: 'stars',
        accent: '#78350F',
        mascot: '🌟',
        quote: 'MAIN CHARACTER'
    },
    {
        id: 'midnight-vibe',
        name: 'Midnight Vibe 🌑',
        gradient: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
        pattern: 'dots',
        accent: '#F3F4F6',
        mascot: '🌑',
        quote: 'MIDNIGHT VIBE'
    }
];

export const getThemeById = (id: string) => {
    return CARD_THEMES.find(t => t.id === id) || CARD_THEMES[0]; // Default to money-moves
};

export default cardService;
