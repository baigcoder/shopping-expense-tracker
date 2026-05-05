import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getOnboardingStatus, updateOnboardingStatus } from '../services/onboardingService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/status', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getOnboardingStatus(getUserId(req)) });
}));

router.patch('/status', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateOnboardingStatus(getUserId(req), req.body || {}) });
}));

export default router;
