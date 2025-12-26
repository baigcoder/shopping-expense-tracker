// Voice Routes - ElevenLabs voice AI integration
import { Router } from 'express';
import { getVoicePreferences, saveVoicePreferences, getElevenLabsSignedUrl } from '../controllers/voiceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's voice preferences
router.get('/preferences', getVoicePreferences);

// Save voice preferences (setup or update)
router.post('/preferences', saveVoicePreferences);

// Get ElevenLabs configuration for client
router.get('/elevenlabs-config', getElevenLabsSignedUrl);

export default router;
