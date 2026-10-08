// OTP Controller - Handle email verification with OTP (Hardened & Native Supabase Auth)
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateOTP, getOTPExpiry, sendOTPEmail } from '../services/emailService.js';

// Maximum OTP verification attempts
const MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MINUTES = 1; // Minimum time between OTP requests

// Send OTP for signup
export const sendSignupOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

        if (!normalizedEmail || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long',
            });
            return;
        }

        // SECURITY (SEC-09): Use exact, non-enumerated database lookup instead of unpaginated listUsers()
        const existingAppUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingAppUser && existingAppUser.supabaseId) {
            res.status(400).json({
                success: false,
                error: 'Email already registered. Please login instead.',
            });
            return;
        }

        // Check for recent OTP requests (rate limiting)
        const recentOTP = await prisma.emailOTP.findFirst({
            where: {
                email: normalizedEmail,
                createdAt: {
                    gte: new Date(Date.now() - OTP_COOLDOWN_MINUTES * 60 * 1000),
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (recentOTP) {
            const waitTime = Math.ceil(
                (OTP_COOLDOWN_MINUTES * 60 * 1000 - (Date.now() - recentOTP.createdAt.getTime())) / 1000
            );
            res.status(429).json({
                success: false,
                error: `Please wait ${waitTime} seconds before requesting a new code.`,
                retryAfter: waitTime,
            });
            return;
        }

        // SECURITY (SEC-04): Use Supabase Auth's native password hashing lifecycle.
        // We never store user passwords in emailOTP, metadata, Prisma, or temporary records.
        let supabaseUserId = '';

        try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                password, // Hashed immediately by Supabase Auth (bcrypt in auth schema)
                email_confirm: false, // Remains unconfirmed until OTP is entered
                user_metadata: {
                    name: name || '',
                    full_name: name || '',
                },
            });

            if (authError) {
                const errorMsg = authError.message?.toLowerCase() || '';
                const isAlreadyRegistered = errorMsg.includes('already registered') || errorMsg.includes('already exists');

                if (isAlreadyRegistered) {
                    // If account was staged in Supabase from a previous unverified attempt, update password safely
                    const existingOtp = await prisma.emailOTP.findFirst({
                        where: { email: normalizedEmail },
                        orderBy: { createdAt: 'desc' },
                    });
                    const pendingSupabaseId = (existingOtp?.metadata as any)?.supabaseUserId;

                    let existingUser = null;
                    if (pendingSupabaseId) {
                        const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(pendingSupabaseId);
                        existingUser = userRes?.user;
                    }
                    if (!existingUser) {
                        const { data: listRes } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
                        existingUser = listRes?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
                    }

                    if (existingUser) {
                        supabaseUserId = existingUser.id;
                        await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
                            password,
                            user_metadata: { name: name || '' },
                        });
                    } else {
                        throw authError;
                    }
                } else {
                    throw authError;
                }
            } else if (authData.user) {
                supabaseUserId = authData.user.id;
            } else {
                throw new Error('Supabase user creation failed without error');
            }
        } catch (authError: any) {
            console.error('Supabase user staging error:', authError);
            res.status(400).json({
                success: false,
                error: authError.message || 'Unable to register account with provided credentials',
            });
            return;
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiry();

        // Metadata stores ONLY non-sensitive user identity tags (NO PASSWORDS)
        const metadata = JSON.stringify({
            name: name || '',
            supabaseUserId,
        });

        // Delete any existing unverified OTPs for this email
        await prisma.emailOTP.deleteMany({
            where: {
                email: normalizedEmail,
                verified: false,
            },
        });

        // Create new OTP record
        await prisma.emailOTP.create({
            data: {
                email: normalizedEmail,
                otp,
                expiresAt,
                metadata,
            },
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(normalizedEmail, otp, name);

        if (!emailSent) {
            await prisma.emailOTP.deleteMany({
                where: {
                    email: normalizedEmail,
                    verified: false,
                },
            });

            res.status(500).json({
                success: false,
                error: 'Failed to send verification email. Please check your email settings.',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email',
            email: normalizedEmail,
        });
    } catch (error: any) {
        console.error('Send signup OTP error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send verification code',
        });
    }
};

// Verify OTP and complete signup
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

        if (!normalizedEmail || !otp) {
            res.status(400).json({
                success: false,
                error: 'Email and OTP are required',
            });
            return;
        }

        // Find the OTP record
        const otpRecord = await prisma.emailOTP.findFirst({
            where: {
                email: normalizedEmail,
                verified: false,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            res.status(400).json({
                success: false,
                error: 'No pending verification found. Please request a new code.',
            });
            return;
        }

        // Check if expired
        if (new Date() > otpRecord.expiresAt) {
            await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
            res.status(400).json({
                success: false,
                error: 'Verification code expired. Please request a new one.',
            });
            return;
        }

        // Check attempts
        if (otpRecord.attempts >= MAX_ATTEMPTS) {
            await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
            res.status(429).json({
                success: false,
                error: 'Too many failed attempts. Code invalidated. Please request a new one.',
            });
            return;
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            // Increment attempts
            await prisma.emailOTP.update({
                where: { id: otpRecord.id },
                data: { attempts: otpRecord.attempts + 1 },
            });

            const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;
            res.status(400).json({
                success: false,
                error: `Invalid code. ${remainingAttempts} attempts remaining.`,
                remainingAttempts,
            });
            return;
        }

        // OTP is valid! Parse metadata
        const metadata = JSON.parse(otpRecord.metadata || '{}');
        const { name, supabaseUserId } = metadata;

        if (!supabaseUserId) {
            throw new Error('Verification context missing. Please register again.');
        }

        // Confirm email in Supabase Auth natively
        try {
            await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
                email_confirm: true,
                user_metadata: {
                    name: name || '',
                    full_name: name || '',
                },
            });
        } catch (authError: any) {
            console.error('Supabase user confirmation error:', authError);
            res.status(500).json({
                success: false,
                error: 'Failed to finalize account verification in auth provider',
            });
            return;
        }

        // Upsert user in our database
        const user = await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                supabaseId: supabaseUserId,
                name: name || null,
            },
            create: {
                supabaseId: supabaseUserId,
                email: normalizedEmail,
                name: name || null,
            },
        });

        // Initialize default categories for user
        try {
            await prisma.category.createMany({
                data: [
                    { userId: user.id, name: 'Shopping', icon: '🛍️', color: '#6366f1' },
                    { userId: user.id, name: 'Electronics', icon: '📱', color: '#8b5cf6' },
                    { userId: user.id, name: 'Groceries', icon: '🛒', color: '#22c55e' },
                    { userId: user.id, name: 'Clothing', icon: '👕', color: '#f59e0b' },
                    { userId: user.id, name: 'Entertainment', icon: '🎮', color: '#ec4899' },
                    { userId: user.id, name: 'Other', icon: '📦', color: '#71717a' },
                ],
                skipDuplicates: true,
            });
        } catch (e) {
            // Ignore if categories already exist
        }

        // Clean up OTPs for this email
        await prisma.emailOTP.deleteMany({
            where: { email: normalizedEmail },
        });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify code',
        });
    }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

        if (!normalizedEmail) {
            res.status(400).json({
                success: false,
                error: 'Email is required',
            });
            return;
        }

        // Find existing pending OTP
        const existingOTP = await prisma.emailOTP.findFirst({
            where: {
                email: normalizedEmail,
                verified: false,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!existingOTP) {
            res.status(400).json({
                success: false,
                error: 'No pending verification found. Please signup again.',
            });
            return;
        }

        // Check cooldown
        const timeSinceCreated = Date.now() - existingOTP.createdAt.getTime();
        if (timeSinceCreated < OTP_COOLDOWN_MINUTES * 60 * 1000) {
            const waitTime = Math.ceil(
                (OTP_COOLDOWN_MINUTES * 60 * 1000 - timeSinceCreated) / 1000
            );
            res.status(429).json({
                success: false,
                error: `Please wait ${waitTime} seconds before requesting a new code.`,
                retryAfter: waitTime,
            });
            return;
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiry();

        // Update OTP record
        await prisma.emailOTP.update({
            where: { id: existingOTP.id },
            data: {
                otp,
                expiresAt,
                attempts: 0,
                createdAt: new Date(),
            },
        });

        // Get name from metadata
        const metadata = JSON.parse(existingOTP.metadata || '{}');
        const name = metadata.name;

        // Send new OTP email
        const emailSent = await sendOTPEmail(normalizedEmail, otp, name);

        if (!emailSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to send verification email. Please check your email settings.',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'New verification code sent to your email',
        });
    } catch (error: any) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to resend verification code',
        });
    }
};
