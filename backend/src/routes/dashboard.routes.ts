import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboardSummary } from '../services/dashboardService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/summary', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getDashboardSummary(getUserId(req)) });
}));

export default router;
