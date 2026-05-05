import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commitImportSessionSchema, importSessionSchema } from '../validators/schemas.js';
import {
    commitImportSession,
    createImportSession,
    getImportSession,
    listImportSessions,
} from '../services/importPipelineService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listImportSessions(getUserId(req)) });
}));

router.post('/sessions', validate(importSessionSchema), asyncHandler(async (req, res) => {
    const session = await createImportSession(getUserId(req), req.body);
    res.status(201).json({ success: true, data: session });
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getImportSession(getUserId(req), req.params.id) });
}));

router.post('/sessions/:id/commit', validate(commitImportSessionSchema), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await commitImportSession(getUserId(req), req.params.id, req.body) });
}));

export default router;
