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

// 5 Gen Z Card Design Themes with Cartoon Mascots
export const CARD_THEMES = [
    {
        id: 'neon-wave',
        name: 'Neon Wave 🌊',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f953c6 100%)',
        pattern: 'waves',
        accent: '#f953c6',
        mascot: '👾' // Space Invader
    },
    {
        id: 'cyber-gold',
        name: 'Cyber Gold 💫',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        pattern: 'dots',
        accent: '#FBBF24',
        mascot: '🚀' // Rocket
    },
    {
        id: 'sunset-vibes',
        name: 'Sunset Vibes 🌅',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%)',
        pattern: 'circles',
        accent: '#ff6b6b',
        mascot: '😻' // Heart Eyes Cat
    },
    {
        id: 'dark-mode',
        name: 'Dark Mode 🖤',
        gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
        pattern: 'lines',
        accent: '#10B981',
        mascot: '👻' // Ghost
    },
    {
        id: 'ocean-breeze',
        name: 'Ocean Breeze 🐚',
        gradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 50%, #00d4ff 100%)',
        pattern: 'waves',
        accent: '#00d4ff',
        mascot: '🐬' // Dolphin
    }
];

export const getThemeById = (id: string) => {
    return CARD_THEMES.find(t => t.id === id) || CARD_THEMES[1]; // Default to cyber-gold
};

export default cardService;
