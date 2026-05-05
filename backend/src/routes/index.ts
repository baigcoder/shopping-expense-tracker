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
import transactionInboxRoutes from './transactionInbox.routes.js';
import merchantRulesRoutes from './merchantRules.routes.js';
import importsRoutes from './imports.routes.js';
import featureExpansionRoutes from './featureExpansion.routes.js';
import settingsRoutes from './settings.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import onboardingRoutes from './onboarding.routes.js';
import moneyTwinRoutes from './moneyTwin.routes.js';
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
router.use('/transaction-inbox', transactionInboxRoutes);
router.use('/merchant-rules', merchantRulesRoutes);
router.use('/imports', importsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/money-twin', moneyTwinRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/categories', categoryRoutes);
router.use('/cards', cardRoutes);
router.use('/plaid', plaidRoutes);
router.use('/ai', aiRoutes);
router.use('/reset', resetRoutes);
router.use('/voice', voiceRoutes);
router.use('/settings', settingsRoutes);
router.use('/', featureExpansionRoutes);

export default router;


