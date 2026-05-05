import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    approveCandidateSchema,
    bulkCandidateSchema,
    mergeCandidateSchema,
    transactionCandidateSchema,
} from '../validators/schemas.js';
import {
    approveCandidate,
    bulkCandidates,
    createTransactionCandidate,
    listTransactionCandidates,
    mergeCandidate,
    rejectCandidate,
} from '../services/transactionInboxService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
    const result = await listTransactionCandidates(getUserId(req), req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
}));

router.post('/candidates', validate(transactionCandidateSchema), asyncHandler(async (req, res) => {
    const result = await createTransactionCandidate(getUserId(req), req.body);
    res.status(201).json({ success: true, pendingReview: true, ...result });
}));

router.post('/bulk', validate(bulkCandidateSchema), asyncHandler(async (req, res) => {
    const results = await bulkCandidates(getUserId(req), req.body);
    res.json({ success: true, data: results });
}));

router.post('/:id/approve', validate(approveCandidateSchema), asyncHandler(async (req, res) => {
    const result = await approveCandidate(getUserId(req), req.params.id, req.body);
    if (!result) throw createError('Candidate not found', 404);
    res.json({ success: true, ...result });
}));

router.post('/:id/reject', asyncHandler(async (req, res) => {
    const candidate = await rejectCandidate(getUserId(req), req.params.id);
    if (!candidate) throw createError('Pending candidate not found', 404);
    res.json({ success: true, data: candidate });
}));

router.post('/:id/merge', validate(mergeCandidateSchema), asyncHandler(async (req, res) => {
    const result = await mergeCandidate(getUserId(req), req.params.id, req.body.transactionId);
    if (!result?.candidate) throw createError('Candidate or transaction not found', 404);
    res.json({ success: true, ...result });
}));

export default router;
