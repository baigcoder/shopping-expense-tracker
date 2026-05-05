import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { extensionHealthEventSchema, generateReportSchema } from '../validators/schemas.js';
import {
    generateReport,
    generateWeeklyCoachPlan,
    getCashflowCalendar,
    getCurrentCoachPlan,
    getExtensionHealth,
    getReportExports,
    getSubscriptionCommandCenter,
    recordExtensionHealthEvent,
    updateCoachAction,
} from '../services/featureExpansionService.js';

const router = Router();
const getUserId = (req: any) => req.user!.supabaseId || req.user!.id;

router.use(authMiddleware);

router.get('/cashflow-calendar', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getCashflowCalendar(getUserId(req)) });
}));

router.get('/subscription-command-center', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getSubscriptionCommandCenter(getUserId(req)) });
}));

router.post('/extension-health/events', validate(extensionHealthEventSchema), asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await recordExtensionHealthEvent(getUserId(req), req.body) });
}));

router.get('/extension-health', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getExtensionHealth(getUserId(req)) });
}));

router.post('/reports/generate', validate(generateReportSchema), asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await generateReport(getUserId(req), req.body) });
}));

router.get('/reports/exports', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getReportExports(getUserId(req)) });
}));

router.get('/coach/current', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getCurrentCoachPlan(getUserId(req)) });
}));

router.post('/coach/generate-weekly', asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await generateWeeklyCoachPlan(getUserId(req)) });
}));

router.patch('/coach/actions/:id', asyncHandler(async (req, res) => {
    res.json({ success: true, data: await updateCoachAction(getUserId(req), req.params.id, req.body.status) });
}));

export default router;
