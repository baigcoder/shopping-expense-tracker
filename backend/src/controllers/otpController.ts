// OTP Controller - Handle email verification with OTP
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateOTP, getOTPExpiry, sendOTPEmail } from '../services/emailService.js';
import crypto from 'crypto';

// Maximum OTP verification attempts
const MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_MINUTES = 1; // Minimum time between OTP requests
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
const IV_LENGTH = 16;

// Helper to encrypt password
const encryptPassword = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Helper to decrypt password
const decryptPassword = (text: string): string => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Send OTP for signup
export const sendSignupOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        // Check if email is already registered in Supabase
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const emailExists = existingUsers?.users?.some(
            (user) => user.email?.toLowerCase() === email.toLowerCase()
        );

        if (emailExists) {
            res.status(400).json({
                success: false,
                error: 'Email already registered. Please login instead.',
            });
            return;
        }

        // Check for recent OTP requests (rate limiting)
        const recentOTP = await prisma.emailOTP.findFirst({
            where: {
                email: email.toLowerCase(),
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

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiry();

        // Encrypt password for temporary storage
        const encryptedPassword = encryptPassword(password);

        // Store signup data in metadata
        const metadata = JSON.stringify({
            name: name || '',
            encryptedPassword,
        });

        // Delete any existing unverified OTPs for this email
        await prisma.emailOTP.deleteMany({
            where: {
                email: email.toLowerCase(),
                verified: false,
            },
        });

        // Create new OTP record
        await prisma.emailOTP.create({
            data: {
                email: email.toLowerCase(),
                otp,
                expiresAt,
                metadata,
            },
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp, name);

        if (!emailSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to send verification email. Please check your email settings.',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email',
            email: email.toLowerCase(),
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

        if (!email || !otp) {
            res.status(400).json({
                success: false,
                error: 'Email and OTP are required',
            });
            return;
        }

        // Find the OTP record
        const otpRecord = await prisma.emailOTP.findFirst({
            where: {
                email: email.toLowerCase(),
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
            res.status(400).json({
                success: false,
                error: 'Too many attempts. Please request a new code.',
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

        // OTP is valid! Parse metadata and get original password
        const metadata = JSON.parse(otpRecord.metadata || '{}');
        const { name, encryptedPassword } = metadata;

        let password = 'Password@123'; // Fallback (should not happen)
        try {
            if (encryptedPassword) {
                password = decryptPassword(encryptedPassword);
            }
        } catch (e) {
            console.error('Password decryption failed:', e);
            throw new Error('Security check failed. Please signup again.');
        }

        // Create user in Supabase Auth (with confirmed email)
        let userId = '';

        try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email.toLowerCase(),
                password,
                email_confirm: true, // Mark email as confirmed
                user_metadata: {
                    name: name || '',
                    full_name: name || '',
                },
            });

            if (authError) {
                // Check if user already exists (retry scenario)
                const isAlreadyRegistered = authError.message?.toLowerCase().includes('already registered') ||
                    authError.message?.toLowerCase().includes('already exists');

                if (isAlreadyRegistered) {
                    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

                    if (existingUser) {
                        userId = existingUser.id;
                        console.log('Recovered existing Supabase user for completion');
                    } else {
                        throw authError;
                    }
                } else {
                    throw authError;
                }
            } else if (authData.user) {
                userId = authData.user.id;
            } else {
                throw new Error('User creation failed without error');
            }
        } catch (error: any) {
            console.error('Supabase user creation error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create account. Please try again.',
            });
            return;
        }

        // Create user in our database
        // Use upsert to be safe in case Prisma sync failed but Supabase succeeded previously
        const user = await prisma.user.upsert({
            where: { email: email.toLowerCase() },
            update: {
                supabaseId: userId,
                name: name || null,
            },
            create: {
                supabaseId: userId,
                email: email.toLowerCase(),
                name: name || null,
            },
        });

        // Create default categories for new user
        // Use createMany with skipDuplicates if possible, or ignore error
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

        // Mark OTP as verified and delete it
        await prisma.emailOTP.delete({ where: { id: otpRecord.id } });

        // Clean up old OTPs for this email
        await prisma.emailOTP.deleteMany({
            where: { email: email.toLowerCase() },
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

        if (!email) {
            res.status(400).json({
                success: false,
                error: 'Email is required',
            });
            return;
        }

        // Find existing pending OTP
        const existingOTP = await prisma.emailOTP.findFirst({
            where: {
                email: email.toLowerCase(),
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
                createdAt: new Date(), // Reset created time for cooldown
            },
        });

        // Get name from metadata
        const metadata = JSON.parse(existingOTP.metadata || '{}');
        const name = metadata.name;

        // Send new OTP email
        const emailSent = await sendOTPEmail(email, otp, name);

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
