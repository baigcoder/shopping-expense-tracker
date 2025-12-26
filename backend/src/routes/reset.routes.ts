// Reset Routes - Data reset with OTP verification
import { Router } from 'express';
import { requestResetOTP, confirmReset } from '../controllers/resetController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All reset routes require authentication
router.use(authMiddleware);

// Request OTP for data reset
router.post('/request-otp', requestResetOTP);

// Confirm reset with OTP
router.post('/confirm', confirmReset);

export default router;

