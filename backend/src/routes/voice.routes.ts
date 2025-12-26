// Voice Routes - ElevenLabs voice AI integration
import { Router } from 'express';
import { getVoicePreferences, saveVoicePreferences, getElevenLabsSignedUrl, textToSpeech } from '../controllers/voiceController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Preferences routes require authentication
router.get('/preferences', authMiddleware, getVoicePreferences);
router.post('/preferences', authMiddleware, saveVoicePreferences);

// ElevenLabs config requires auth
router.get('/elevenlabs-config', authMiddleware, getElevenLabsSignedUrl);

// TTS endpoint - use optional auth so it works even during setup
// The TTS itself just needs the API key, not user data
router.post('/tts', optionalAuth, textToSpeech);

export default router;
