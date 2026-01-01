// Main Routes Index - Combines all route modules
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import transactionRoutes from './transaction.routes.js';
import analyticsRoutes from './analytics.routes.js';
import categoryRoutes from './category.routes.js';
import otpRoutes from './otp.routes.js';
import cardRoutes from './card.routes.js';
import plaidRoutes from './plaid.routes.js';
import aiRoutes from './ai.js';
import resetRoutes from './reset.routes.js';
import voiceRoutes from './voice.routes.js';
import { cacheControl } from '../middleware/cache.js';

const router = Router();

// Health check (cached for 1 minute)
router.get('/health', cacheControl('dynamic'), (_req, res) => {
    res.json({
        success: true,
        message: 'Shopping Expense Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/categories', categoryRoutes);
router.use('/cards', cardRoutes);
router.use('/plaid', plaidRoutes);
router.use('/ai', aiRoutes);
router.use('/reset', resetRoutes);
router.use('/voice', voiceRoutes);

export default router;


