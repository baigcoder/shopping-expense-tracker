// Main Routes Index - Combines all route modules
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import transactionRoutes from './transaction.routes.js';
import analyticsRoutes from './analytics.routes.js';
import categoryRoutes from './category.routes.js';
import otpRoutes from './otp.routes.js';
import cardRoutes from './card.routes.js';
import plaidRoutes from './plaid.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
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

export default router;

