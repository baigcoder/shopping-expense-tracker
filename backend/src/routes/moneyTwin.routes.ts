import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getMoneyTwin } from '../services/moneyTwinService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
    const includePending = req.query.includePending !== 'false';
    const force = req.query.force === 'true';
    res.json({
        success: true,
        data: await getMoneyTwin(getUserId(req), { force, includePending }),
    });
}));

export default router;
