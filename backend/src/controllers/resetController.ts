// Reset Controller - Handle data reset with OTP verification (Hardened & Distributed Storage)
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { generateOTP, sendResetOTPEmail } from '../services/emailService.js';
import { getCache, setCache, deleteCache } from '../services/redisCacheService.js';
import { getCanonicalUserId } from '../utils/userAuth.js';

interface ResetOTPData {
    otp: string;
    expiresAt: number;
    category: string;
    userId: string;
    attempts: number;
}

const VALID_CATEGORIES = ['transactions', 'goals', 'subscriptions', 'bills', 'cards', 'all'];
export const MAX_RESET_ATTEMPTS = 5;
const RESET_OTP_TTL_SEC = 600; // 10 minutes

// Request OTP for data reset
export const requestResetOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getCanonicalUserId(req);
        const userEmail = (req as any).user?.email;

        if (!userEmail) {
            res.status(400).json({ error: 'User email is required for verification' });
            return;
        }

        const { category } = req.body;

        if (!category || !VALID_CATEGORIES.includes(category)) {
            res.status(400).json({
                error: 'Invalid category',
                validCategories: VALID_CATEGORIES
            });
            return;
        }

        const storeKey = `reset:otp:${userId}`;

        // Check if there is an active OTP to enforce cool-down
        const existingData = await getCache<ResetOTPData>(storeKey);
        if (existingData && existingData.expiresAt - Date.now() > (RESET_OTP_TTL_SEC - 60) * 1000) {
            res.status(429).json({
                error: 'A verification code was recently sent. Please check your email or wait a minute before requesting another.',
            });
            return;
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + RESET_OTP_TTL_SEC * 1000;

        // Store OTP with user context in distributed Redis / fallback cache with TTL
        await setCache(storeKey, {
            otp,
            expiresAt,
            category,
            userId,
            attempts: 0
        }, RESET_OTP_TTL_SEC);

        // Send email
        const emailSent = await sendResetOTPEmail(userEmail, otp, category);

        if (!emailSent) {
            await deleteCache(storeKey);
            res.status(500).json({ error: 'Failed to send verification email' });
            return;
        }

        res.status(200).json({
            message: 'Verification code sent to your email',
            category,
            expiresIn: '10 minutes'
        });
    } catch (error: any) {
        console.error('Reset OTP request error:', error.message);
        res.status(error.message?.includes('Authentication required') ? 401 : 500).json({
            error: error.message || 'Internal server error'
        });
    }
};

// Confirm reset with OTP (Rate-limited & brute-force locked)
export const confirmReset = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getCanonicalUserId(req);
        const { otp } = req.body;

        if (!otp) {
            res.status(400).json({ error: 'OTP is required' });
            return;
        }

        const storeKey = `reset:otp:${userId}`;
        const storedData = await getCache<ResetOTPData>(storeKey);

        if (!storedData) {
            res.status(400).json({ error: 'No reset request found or code has expired. Please request a new code.' });
            return;
        }

        // Check expiry
        if (Date.now() > storedData.expiresAt) {
            await deleteCache(storeKey);
            res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
            return;
        }

        // SECURITY (SEC-06): Check failed attempt count
        if (storedData.attempts >= MAX_RESET_ATTEMPTS) {
            await deleteCache(storeKey);
            res.status(429).json({ error: 'Too many failed verification attempts. Reset code has been invalidated for security.' });
            return;
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            const currentAttempts = (storedData.attempts || 0) + 1;
            storedData.attempts = currentAttempts;

            if (currentAttempts >= MAX_RESET_ATTEMPTS) {
                await deleteCache(storeKey);
                res.status(429).json({ error: 'Too many incorrect attempts. Reset code invalidated.' });
                return;
            }

            const remainingAttempts = MAX_RESET_ATTEMPTS - currentAttempts;
            const remainingTtlSec = Math.max(1, Math.floor((storedData.expiresAt - Date.now()) / 1000));
            await setCache(storeKey, storedData, remainingTtlSec);

            res.status(400).json({
                error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
                remainingAttempts
            });
            return;
        }

        // OTP is valid! Immediately invalidate to guarantee single-use behavior
        await deleteCache(storeKey);

        // Execute reset based on category
        const { category } = storedData;
        const deleteResults: Record<string, number> = {};

        try {
            const deleteUserId = userId;
            console.log(`🔑 Reset executing for user: ${deleteUserId}, category: ${category}`);

            if (category === 'all' || category === 'transactions') {
                const { data, error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();

                if (error) throw error;
                deleteResults.transactions = data?.length || 0;
            }

            if (category === 'all' || category === 'goals') {
                const { data, error } = await supabase
                    .from('goals')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();
                if (error) throw error;
                deleteResults.goals = data?.length || 0;
            }

            if (category === 'all' || category === 'subscriptions') {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();
                if (error) throw error;
                deleteResults.subscriptions = data?.length || 0;
            }

            if (category === 'all' || category === 'bills') {
                const { data, error } = await supabase
                    .from('bills')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();
                if (error) throw error;
                deleteResults.bills = data?.length || 0;
            }

            if (category === 'all' || category === 'cards') {
                const { data, error } = await supabase
                    .from('cards')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();
                if (error) throw error;
                deleteResults.cards = data?.length || 0;
            }
        } catch (deleteError: any) {
            console.error('Data reset error:', deleteError);
            res.status(500).json({ error: 'Failed to delete data', details: deleteError.message });
            return;
        }

        console.log(`✅ User ${userId} successfully reset ${category} data:`, deleteResults);

        res.status(200).json({
            message: `Successfully reset ${category === 'all' ? 'all' : category} data`,
            deleted: deleteResults
        });
    } catch (error: any) {
        console.error('Reset confirmation error:', error.message);
        res.status(error.message?.includes('Authentication required') ? 401 : 500).json({
            error: error.message || 'Internal server error'
        });
    }
};
