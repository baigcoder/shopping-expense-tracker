// Analytics Routes
import { Router } from 'express';
import {
    getSummary,
    getMonthlySpending,
    getCategorySpending,
    getStoreSpending
} from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { cacheControl } from '../middleware/cache.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Analytics endpoints - dynamic caching (1 minute) for frequently changing data
router.get('/summary', cacheControl('dynamic'), getSummary);
router.get('/monthly', cacheControl('dynamic'), getMonthlySpending);
router.get('/by-category', cacheControl('dynamic'), getCategorySpending);
router.get('/by-store', cacheControl('dynamic'), getStoreSpending);

export default router;
