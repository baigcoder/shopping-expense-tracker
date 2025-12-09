// OTP Routes for email verification
import { Router } from 'express';
import { sendSignupOTP, verifyOTP, resendOTP } from '../controllers/otpController.js';

const router = Router();

// Send OTP for signup verification
router.post('/send', sendSignupOTP);

// Verify OTP and complete signup
router.post('/verify', verifyOTP);

// Resend OTP
router.post('/resend', resendOTP);

export default router;
