// Card Controller - Handles card CRUD operations
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// Get all cards for authenticated user
export const getCards = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { data, error } = await supabase
            .from('cards')
            .select('*')
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
    } catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get single card by ID
export const getCardById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { data, error } = await supabase
            .from('cards')
            .select('*')
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
    } catch (error) {
        console.error('Get card error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create new card
export const createCard = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { number, holder, expiry, cvv, pin, card_type, theme } = req.body;

        // Validation
        if (!number || !holder || !expiry || !cvv || !pin || !card_type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const cardData = {
            user_id: userId,
            number,
            holder,
            expiry,
            cvv,
            pin,
            card_type,
            theme: theme || 'money-moves'
        };

        const { data, error } = await supabase
            .from('cards')
            .insert(cardData)
            .select()
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
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update card
export const updateCard = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { number, holder, expiry, cvv, pin, card_type, theme } = req.body;

        // Build update object with only provided fields
        const updates: any = {};
        if (number !== undefined) updates.number = number;
        if (holder !== undefined) updates.holder = holder;
        if (expiry !== undefined) updates.expiry = expiry;
        if (cvv !== undefined) updates.cvv = cvv;
        if (pin !== undefined) updates.pin = pin;
        if (card_type !== undefined) updates.card_type = card_type;
        if (theme !== undefined) updates.theme = theme;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        const { data, error } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
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
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete card
export const deleteCard = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

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
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
