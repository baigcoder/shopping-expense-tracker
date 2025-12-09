// Auth Routes
import { Router } from 'express';
import { registerOrGetUser, getProfile, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes - Register or sync user after Supabase auth
router.post('/register', registerOrGetUser);

// Protected routes
router.get('/me', authMiddleware, getProfile);
router.patch('/me', authMiddleware, updateProfile);

export default router;
