// Reset Controller - Handle data reset with OTP verification
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { generateOTP, getOTPExpiry, sendResetOTPEmail } from '../services/emailService.js';

// In-memory OTP storage (for production, use Redis)
interface ResetOTPData {
    otp: string;
    expiry: Date;
    category: string;
    userId: string;
}

const resetOTPStore = new Map<string, ResetOTPData>();

// Valid categories for reset
const VALID_CATEGORIES = ['transactions', 'goals', 'subscriptions', 'bills', 'cards', 'all'];

// Request OTP for data reset
export const requestResetOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
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

        // Generate OTP
        const otp = generateOTP();
        const expiry = getOTPExpiry();

        // Store OTP with user context
        const storeKey = `${user.id}_reset`;
        resetOTPStore.set(storeKey, {
            otp,
            expiry,
            category,
            userId: user.id
        });

        // Send email
        const emailSent = await sendResetOTPEmail(user.email, otp, category);

        if (!emailSent) {
            res.status(500).json({ error: 'Failed to send verification email' });
            return;
        }

        res.status(200).json({
            message: 'Verification code sent to your email',
            category,
            expiresIn: '10 minutes'
        });
    } catch (error) {
        console.error('Reset OTP request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Confirm reset with OTP
export const confirmReset = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { otp } = req.body;

        if (!otp) {
            res.status(400).json({ error: 'OTP is required' });
            return;
        }

        // Retrieve stored OTP
        const storeKey = `${user.id}_reset`;
        const storedData = resetOTPStore.get(storeKey);

        if (!storedData) {
            res.status(400).json({ error: 'No reset request found. Please request a new code.' });
            return;
        }

        // Verify OTP
        if (storedData.otp !== otp) {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
        }

        // Check expiry
        if (new Date() > storedData.expiry) {
            resetOTPStore.delete(storeKey);
            res.status(400).json({ error: 'Verification code has expired' });
            return;
        }

        // Execute reset based on category
        const { category } = storedData;
        const deleteResults: Record<string, number> = {};

        try {
            // Look up the user's supabaseId from the User table
            // Transactions are stored with supabaseId, not the Prisma user ID
            const { data: userData } = await supabase
                .from('User')
                .select('supabaseId')
                .eq('id', user.id)
                .single();

            const deleteUserId = userData?.supabaseId || user.id;
            console.log(`🔑 Using ID for delete: ${deleteUserId} (original: ${user.id})`);

            if (category === 'all' || category === 'transactions') {
                console.log(`🗑️ Deleting transactions for user: ${deleteUserId}`);

                // First, count how many transactions exist
                const { count } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', deleteUserId);

                console.log(`   Found ${count || 0} transactions to delete`);

                const { data, error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('user_id', deleteUserId)
                    .select();

                if (error) {
                    console.error('   ❌ Delete error:', error);
                    throw error;
                }

                deleteResults.transactions = data?.length || 0;
                console.log(`   ✅ Deleted ${deleteResults.transactions} transactions`);
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
            console.error('Delete error:', deleteError);
            res.status(500).json({ error: 'Failed to delete data', details: deleteError.message });
            return;
        }

        // Clear the OTP
        resetOTPStore.delete(storeKey);

        console.log(`✅ User ${user.id} reset ${category} data:`, deleteResults);

        res.status(200).json({
            message: `Successfully reset ${category === 'all' ? 'all' : category} data`,
            deleted: deleteResults
        });
    } catch (error) {
        console.error('Reset confirmation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
