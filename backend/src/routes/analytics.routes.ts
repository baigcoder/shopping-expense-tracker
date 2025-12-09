// Analytics Routes
import { Router } from 'express';
import {
    getSummary,
    getMonthlySpending,
    getCategorySpending,
    getStoreSpending
} from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlySpending);
router.get('/by-category', getCategorySpending);
router.get('/by-store', getStoreSpending);

export default router;
