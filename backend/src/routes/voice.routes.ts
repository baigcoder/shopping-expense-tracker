// Voice Routes - ElevenLabs voice AI integration
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getVoicePreferences, saveVoicePreferences, getElevenLabsSignedUrl, textToSpeech } from '../controllers/voiceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const ttsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many voice requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(authMiddleware);

router.get('/preferences', getVoicePreferences);
router.post('/preferences', saveVoicePreferences);
router.get('/elevenlabs-config', getElevenLabsSignedUrl);
router.post('/tts', ttsLimiter, textToSpeech);

export default router;
