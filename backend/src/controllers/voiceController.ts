// Voice Controller - Handle voice preferences and ElevenLabs integration
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
    isElevenLabsConfigured,
    listElevenLabsVoices,
    resolveElevenLabsVoiceId,
    sanitizeTtsText,
} from '../utils/elevenLabsVoices.js';

const getVoiceUserId = (req: Request) => (req as any).user?.supabaseId || (req as any).user?.id;

export const getVoicePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getVoiceUserId(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized - no user ID' });
            return;
        }

        const { data, error } = await supabase
            .from('voice_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.status(200).json({
            isSetup: data?.is_setup || false,
            voiceId: data?.voice_id || 'jenny',
            voiceName: data?.voice_name || 'Jenny',
            preferences: data,
            voices: listElevenLabsVoices(),
        });
    } catch (error: any) {
        console.error('Get voice preferences error:', error);
        res.status(500).json({ error: 'Failed to get voice preferences' });
    }
};

export const saveVoicePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getVoiceUserId(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized - no user ID' });
            return;
        }

        const { voiceId, voiceName } = req.body;
        const resolvedId = resolveElevenLabsVoiceId(voiceId);
        const catalog = listElevenLabsVoices();
        const selected = catalog.find((voice) => voice.id === resolvedId || voice.alias === String(voiceId || '').toLowerCase());

        if (!voiceId) {
            res.status(400).json({ error: 'voiceId is required' });
            return;
        }

        const { data, error } = await supabase
            .from('voice_preferences')
            .upsert({
                user_id: userId,
                is_setup: true,
                voice_id: selected?.alias || 'jenny',
                voice_name: selected?.name || voiceName || 'Jenny',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Voice preferences saved',
            preferences: data,
        });
    } catch (error: any) {
        console.error('Save voice preferences error:', error);
        res.status(500).json({ error: 'Failed to save voice preferences' });
    }
};

export const getElevenLabsSignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getVoiceUserId(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const apiKey = process.env.ELEVENLABS_API_KEY || '';
        const configured = isElevenLabsConfigured(apiKey);

        const { data: prefs } = await supabase
            .from('voice_preferences')
            .select('voice_id, voice_name')
            .eq('user_id', userId)
            .single();

        res.status(200).json({
            configured,
            voiceId: prefs?.voice_id || 'jenny',
            voiceName: prefs?.voice_name || 'Jenny',
            ttsProxy: '/api/voice/tts',
            voices: listElevenLabsVoices(),
            agentConfig: {
                model: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.45,
                    similarity_boost: 0.8,
                    style: 0.15,
                    use_speaker_boost: true,
                },
            },
        });
    } catch (error: any) {
        console.error('Get ElevenLabs config error:', error);
        res.status(500).json({ error: 'Failed to load voice config' });
    }
};

export const textToSpeech = async (req: Request, res: Response): Promise<void> => {
    try {
        const text = sanitizeTtsText(req.body?.text || '');
        const voiceId = resolveElevenLabsVoiceId(req.body?.voiceId || req.body?.voice);

        if (!text) {
            res.status(400).json({ error: 'Text is required' });
            return;
        }

        const apiKey = process.env.ELEVENLABS_API_KEY || '';
        if (!isElevenLabsConfigured(apiKey)) {
            res.status(503).json({ error: 'ElevenLabs is not configured' });
            return;
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_44100_64`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                    Accept: 'audio/mpeg',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_flash_v2_5',
                    voice_settings: {
                        stability: 0.45,
                        similarity_boost: 0.8,
                        style: 0.15,
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.error('ElevenLabs TTS failed:', response.status);
            res.status(502).json({ error: 'Voice playback is unavailable right now' });
            return;
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Length', audioBuffer.byteLength);
        res.send(Buffer.from(audioBuffer));
    } catch (error: any) {
        console.error('Text-to-speech error:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
};
