import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import {
    settingsAISchema,
    settingsPreferencesSchema,
    settingsProfileSchema,
    settingsResetConfirmSchema,
    settingsResetRequestSchema,
} from '../validators/schemas.js';
import {
    getSessionMetadata,
    getSettingsDashboard,
    getSettingsUserId,
    refreshSettingsAI,
    requestPasswordReset,
    testSettingsAI,
    updateSettingsAI,
    updateSettingsPreferences,
    updateSettingsProfile,
} from '../services/settingsService.js';
import { confirmReset, requestResetOTP } from '../controllers/resetController.js';

const router = Router();

router.use(authMiddleware);

const requestInfo = (req: any) => ({
    ip: req.ip,
    userAgent: req.get('user-agent'),
});

router.get('/', asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await getSettingsDashboard(req.user, requestInfo(req)) });
}));

router.patch('/profile', validate(settingsProfileSchema), asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await updateSettingsProfile(req.user, req.body) });
}));

router.patch('/preferences', validate(settingsPreferencesSchema), asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await updateSettingsPreferences(req.user, req.body) });
}));

router.patch('/ai', validate(settingsAISchema), asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await updateSettingsAI(getSettingsUserId(req.user), req.body) });
}));

router.post('/ai/refresh', asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await refreshSettingsAI(getSettingsUserId(req.user)) });
}));

router.post('/ai/test', asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await testSettingsAI(getSettingsUserId(req.user)) });
}));

router.post('/security/password-reset', asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await requestPasswordReset(req.user) });
}));

router.get('/security/sessions', asyncHandler(async (req: any, res) => {
    res.json({ success: true, data: await getSessionMetadata(req.user, requestInfo(req)) });
}));

router.post('/data/request-reset-otp', validate(settingsResetRequestSchema), requestResetOTP);
router.post('/data/confirm-reset', validate(settingsResetConfirmSchema), confirmReset);

export default router;
