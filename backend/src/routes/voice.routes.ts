// Voice Routes - ElevenLabs voice AI integration
import { Router } from 'express';
import { getVoicePreferences, saveVoicePreferences, getElevenLabsSignedUrl, textToSpeech } from '../controllers/voiceController.js';

const router = Router();

// All routes now accept x-user-id header (like AI endpoints) instead of auth middleware
// This simplifies auth and matches the pattern that works for AI chat

// Get user's voice preferences
router.get('/preferences', getVoicePreferences);

// Save voice preferences (setup or update)
router.post('/preferences', saveVoicePreferences);

// Get ElevenLabs configuration for client
router.get('/elevenlabs-config', getElevenLabsSignedUrl);

// Text-to-speech proxy
router.post('/tts', textToSpeech);

export default router;
