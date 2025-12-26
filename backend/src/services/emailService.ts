// Email Service using Nodemailer
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Create reusable transporter
let transporter: Transporter<SMTPTransport.SentMessageInfo>;

// Initialize transporter based on environment
export const initializeEmailTransporter = () => {
    // Check for required environment variables
    const emailUser = process.env.SMTP_USER;
    const emailPass = process.env.SMTP_PASS;
    const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.SMTP_PORT || '587');

    if (!emailUser || !emailPass) {
        console.warn('⚠️ SMTP credentials not configured. Email sending will fail.');
        console.warn('Set SMTP_USER and SMTP_PASS environment variables.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });

    console.log('✅ Email transporter initialized');
    return transporter;
};

// Generate 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time (10 minutes from now)
export const getOTPExpiry = (): Date => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, name?: string): Promise<boolean> => {
    if (!transporter) {
        console.error('Email transporter not initialized');
        return false;
    }

    const userName = name || email.split('@')[0];
    const appName = 'Expense Tracker';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="480px" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); max-width: 480px;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 32px 24px; text-align: center;">
                                <!-- Logo Icon -->
                                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%); border-radius: 20px; display: inline-block; text-align: center; line-height: 80px; font-size: 40px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(255,255,255,0.1);">
                                    🛒
                                </div>
                                <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                                    Verify Your Email
                                </h1>
                                <p style="margin: 12px 0 0; color: rgba(255,255,255,0.6); font-size: 15px;">
                                    Hey ${userName}, here's your verification code
                                </p>
                            </td>
                        </tr>
                        
                        <!-- OTP Code -->
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <div style="background: #ffffff; border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                                    <p style="margin: 0 0 8px; font-size: 11px; color: rgba(0,0,0,0.5); text-transform: uppercase; font-weight: 700; letter-spacing: 3px;">
                                        Your Code
                                    </p>
                                    <p style="margin: 0; font-size: 42px; font-weight: 800; color: #000; letter-spacing: 10px; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </p>
                                </div>
                                
                                <p style="margin: 20px 0 0; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">
                                    ⏱️ Expires in <strong style="color: #fff;">10 minutes</strong>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Instructions -->
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
                                    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6); text-align: center;">
                                        💡 Enter this code in the app to verify your email and complete your signup.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 32px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-radius: 0 0 19px 19px;">
                                <p style="margin: 0; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px;">
                                    Didn't request this? Just ignore this email.<br>
                                    © 2024 ${appName}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    const plainText = `
Hi ${userName}!

Your verification code for ${appName} is: ${otp}

This code expires in 10 minutes.

Enter this code in the app to verify your email address.

If you didn't request this, please ignore this email.

- ${appName} Team
    `;

    try {
        await transporter.sendMail({
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${otp} is your ${appName} verification code`,
            text: plainText,
            html: htmlContent,
        });

        console.log(`✅ OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        return false;
    }
};

// Send Reset OTP email - For data deletion confirmation
export const sendResetOTPEmail = async (email: string, otp: string, category: string, name?: string): Promise<boolean> => {
    if (!transporter) {
        console.error('Email transporter not initialized');
        return false;
    }

    const userName = name || email.split('@')[0];
    const appName = 'Expense Tracker';
    const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Data Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="480px" cellpadding="0" cellspacing="0" style="background-color: #1a0505; border-radius: 20px; border: 1px solid rgba(239,68,68,0.3); max-width: 480px;">
                        <tr>
                            <td style="padding: 40px 32px 24px; text-align: center;">
                                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 20px; display: inline-block; text-align: center; line-height: 80px; font-size: 40px; margin-bottom: 20px; box-shadow: 0 8px 32px rgba(239,68,68,0.3);">
                                    ⚠️
                                </div>
                                <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">
                                    Data Reset Request
                                </h1>
                                <p style="margin: 12px 0 0; color: rgba(255,255,255,0.6); font-size: 15px;">
                                    Hey ${userName}, you requested to reset your <strong style="color: #ef4444;">${categoryDisplay}</strong> data
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <div style="background: #ffffff; border-radius: 16px; padding: 28px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); border: 2px solid #ef4444;">
                                    <p style="margin: 0 0 8px; font-size: 11px; color: rgba(0,0,0,0.5); text-transform: uppercase; font-weight: 700; letter-spacing: 3px;">
                                        Confirmation Code
                                    </p>
                                    <p style="margin: 0; font-size: 42px; font-weight: 800; color: #b91c1c; letter-spacing: 10px; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </p>
                                </div>
                                <p style="margin: 20px 0 0; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">
                                    ⏱️ Expires in <strong style="color: #fff;">10 minutes</strong>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px;">
                                    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); text-align: center;">
                                        ⚠️ <strong>This action is irreversible!</strong><br>
                                        All your ${categoryDisplay.toLowerCase()} data will be permanently deleted.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 24px 32px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-radius: 0 0 19px 19px;">
                                <p style="margin: 0; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px;">
                                    Didn't request this? Contact support immediately.<br>
                                    © 2024 ${appName}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `⚠️ ${otp} - Confirm ${categoryDisplay} Data Reset`,
            text: `Your reset code is: ${otp}. This action will permanently delete your ${categoryDisplay} data.`,
            html: htmlContent,
        });

        console.log(`✅ Reset OTP email sent to ${email} for ${category}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send reset OTP email:', error);
        return false;
    }
};

