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

    // Get single card by ID
    getById: async (id: string, userId: string): Promise<CardData | null> => {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching card:', error);
            return null;
        }

        return data;
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

// 8 Gen Z Card Design Themes with Quotes
// 5 Best Looking Card Templates (Premium SaaS)
export const CARD_THEMES = [
    {
        id: 'slate-executive',
        name: 'Slate Executive',
        gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Dark Slate
        buttonColor: '#1e293b',
        textColor: '#ffffff'
    },
    {
        id: 'deep-navy',
        name: 'Deep Navy',
        gradient: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)', // Midnight Blue
        buttonColor: '#172554',
        textColor: '#ffffff'
    },
    {
        id: 'pure-obsidian',
        name: 'Pure Obsidian',
        gradient: 'linear-gradient(135deg, #000000 0%, #1c1917 100%)', // Solid Black
        buttonColor: '#000000',
        textColor: '#ffffff'
    },
    {
        id: 'sunset-horizon',
        name: 'Sunset Horizon',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)', // Vibrant
        buttonColor: '#7c3aed',
        textColor: '#ffffff'
    },
    {
        id: 'oceanic-depth',
        name: 'Oceanic Depth',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // Cyan-Blue
        buttonColor: '#0284c7',
        textColor: '#ffffff'
    }
];

export const getThemeById = (id: string) => {
    return CARD_THEMES.find(t => t.id === id) || CARD_THEMES[0];
};

// Shared Brand Gradients (Premium SaaS Theme)
export const getBrandGradient = (brand: string): string => {
    const normalizedBrand = brand?.toLowerCase() || 'generic';
    switch (normalizedBrand) {
        case 'visa':
            return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'; // Slate 800 -> 900
        case 'mastercard':
            return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'; // Slate 700 -> 800
        case 'amex':
            return 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'; // Sky 600 -> 700
        case 'discover':
            return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'; // Orange 500 -> 600
        case 'paypal':
            return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; // Blue 600 -> 700
        case 'jcb':
            return 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'; // Teal 600 -> 700
        case 'unionpay':
            return 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)'; // Cyan 600 -> 700
        default:
            return 'linear-gradient(135deg, #475569 0%, #334155 100%)'; // Slate 600 -> 700
    }
};

export default cardService;

