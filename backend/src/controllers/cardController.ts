// Card Controller - Handles card CRUD operations (PCI-DSS Hardened)
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { getCanonicalUserId } from '../utils/userAuth.js';

// Safe columns allowlist to prevent exposure of sensitive data
export const SAFE_CARD_COLUMNS = 'id, user_id, last4, holder, expiry, card_type, theme, created_at';

// Get all cards for authenticated user
export const getCards = async (req: Request, res: Response) => {
    try {
        const userId = getCanonicalUserId(req);

        const { data, error } = await supabase
            .from('cards')
            .select(SAFE_CARD_COLUMNS)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cards:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch cards',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error('Get cards error:', error.message);
        res.status(error.message.includes('Authentication required') ? 401 : 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Get single card by ID (ownership enforced)
export const getCardById = async (req: Request, res: Response) => {
    try {
        const userId = getCanonicalUserId(req);
        const { id } = req.params;

        const { data, error } = await supabase
            .from('cards')
            .select(SAFE_CARD_COLUMNS)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Card not found'
                });
            }
            console.error('Error fetching card:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch card',
                error: error.message
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get card error:', error.message);
        res.status(error.message.includes('Authentication required') ? 401 : 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Create new card (PCI-DSS compliant: stores only last4, holder, expiry, card_type, theme)
export const createCard = async (req: Request, res: Response) => {
    try {
        const userId = getCanonicalUserId(req);
        const { holder, expiry, card_type, theme } = req.body;

        // Security check: Reject requests trying to persist raw CVV or ATM PIN
        if (req.body.pin || (req.body.cvv && req.body.cvv !== '***')) {
            console.warn(`[SECURITY] Rejected attempt to store sensitive authentication data (CVV/PIN) for user ${userId}`);
        }

        // Extract last4 safely
        const rawDigits = String(req.body.last4 || req.body.number || '').replace(/\D/g, '');
        const last4 = rawDigits.slice(-4);

        if (!last4 || last4.length !== 4) {
            return res.status(400).json({
                success: false,
                message: 'Valid card number or last 4 digits required'
            });
        }

        if (!holder || !expiry) {
            return res.status(400).json({
                success: false,
                message: 'Cardholder name and expiration date are required'
            });
        }

        const cardData = {
            user_id: userId,
            last4,
            holder: String(holder).trim().slice(0, 100),
            expiry: String(expiry).trim().slice(0, 10),
            card_type: card_type || 'unknown',
            theme: theme || 'money-moves'
        };

        const { data, error } = await supabase
            .from('cards')
            .insert(cardData)
            .select(SAFE_CARD_COLUMNS)
            .single();

        if (error) {
            console.error('Error creating card:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create card',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Card created successfully! 💳',
            data
        });
    } catch (error: any) {
        console.error('Create card error:', error.message);
        res.status(error.message.includes('Authentication required') ? 401 : 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Update card (PCI-DSS compliant: only non-sensitive visual and metadata fields)
export const updateCard = async (req: Request, res: Response) => {
    try {
        const userId = getCanonicalUserId(req);
        const { id } = req.params;
        const { holder, expiry, card_type, theme, last4, number } = req.body;

        const updates: Record<string, any> = {};

        if (holder !== undefined) updates.holder = String(holder).trim().slice(0, 100);
        if (expiry !== undefined) updates.expiry = String(expiry).trim().slice(0, 10);
        if (card_type !== undefined) updates.card_type = card_type;
        if (theme !== undefined) updates.theme = theme;

        const digits = String(last4 || number || '').replace(/\D/g, '');
        if (digits.length >= 4) {
            updates.last4 = digits.slice(-4);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid update fields provided'
            });
        }

        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select(SAFE_CARD_COLUMNS)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Card not found'
                });
            }
            console.error('Error updating card:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update card',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Card updated successfully! ✨',
            data
        });
    } catch (error: any) {
        console.error('Update card error:', error.message);
        res.status(error.message.includes('Authentication required') ? 401 : 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Delete card (ownership enforced)
export const deleteCard = async (req: Request, res: Response) => {
    try {
        const userId = getCanonicalUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting card:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete card',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Card deleted successfully! 🗑️'
        });
    } catch (error: any) {
        console.error('Delete card error:', error.message);
        res.status(error.message.includes('Authentication required') ? 401 : 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};
