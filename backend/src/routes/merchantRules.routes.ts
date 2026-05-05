import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { merchantRuleSchema, updateMerchantRuleSchema } from '../validators/schemas.js';
import {
    createMerchantRule,
    deleteMerchantRule,
    listMerchantRules,
    updateMerchantRule,
} from '../services/transactionInboxService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listMerchantRules(getUserId(req)) });
}));

router.post('/', validate(merchantRuleSchema), asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createMerchantRule(getUserId(req), req.body) });
}));

router.patch('/:id', validate(updateMerchantRuleSchema), asyncHandler(async (req, res) => {
    const rule = await updateMerchantRule(getUserId(req), req.params.id, req.body);
    if (!rule) throw createError('Rule not found', 404);
    res.json({ success: true, data: rule });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    await deleteMerchantRule(getUserId(req), req.params.id);
    res.json({ success: true });
}));

export default router;
