// Auth Controller - Using Supabase Auth
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { UserUpdateInput } from '../types';

// Register or get user (called after Supabase auth)
export const registerOrGetUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { supabaseId, email, name, avatarUrl } = req.body;

        if (!supabaseId || !email) {
            res.status(400).json({
                success: false,
                error: 'supabaseId and email are required',
            });
            return;
        }

        // Try to find existing user
        let user = await prisma.user.findUnique({
            where: { supabaseId },
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    supabaseId,
                    email,
                    name: name || null,
                    avatarUrl: avatarUrl || null,
                },
            });

            // Create default categories for new user
            await prisma.category.createMany({
                data: [
                    { userId: user.id, name: 'Shopping', icon: '🛍️', color: '#6366f1' },
                    { userId: user.id, name: 'Electronics', icon: '📱', color: '#8b5cf6' },
                    { userId: user.id, name: 'Groceries', icon: '🛒', color: '#22c55e' },
                    { userId: user.id, name: 'Clothing', icon: '👕', color: '#f59e0b' },
                    { userId: user.id, name: 'Entertainment', icon: '🎮', color: '#ec4899' },
                    { userId: user.id, name: 'Other', icon: '📦', color: '#71717a' },
                ],
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                currency: user.currency,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Register/get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register/get user',
        });
    }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                currency: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile',
        });
    }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const updateData: UserUpdateInput = req.body;

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                currency: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
        });
    }
};
