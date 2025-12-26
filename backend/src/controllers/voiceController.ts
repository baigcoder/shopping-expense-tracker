// Voice Controller - Handle voice preferences and ElevenLabs integration
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// Get user's voice preferences
export const getVoicePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Use supabaseId for consistency with other tables
        const userId = user.supabaseId || user.id;

        const { data, error } = await supabase
            .from('voice_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        res.status(200).json({
            isSetup: data?.is_setup || false,
            voiceId: data?.voice_id || 'rachel',
            voiceName: data?.voice_name || 'Rachel',
            preferences: data
        });
    } catch (error: any) {
        console.error('Get voice preferences error:', error);
        res.status(500).json({ error: 'Failed to get voice preferences' });
    }
};

// Save voice preferences (initial setup or update)
export const saveVoicePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { voiceId, voiceName } = req.body;

        if (!voiceId || !voiceName) {
            res.status(400).json({ error: 'voiceId and voiceName are required' });
            return;
        }

        // Use supabaseId for consistency with other tables
        const userId = user.supabaseId || user.id;

        // Upsert the voice preferences
        const { data, error } = await supabase
            .from('voice_preferences')
            .upsert({
                user_id: userId,
                is_setup: true,
                voice_id: voiceId,
                voice_name: voiceName,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log(`✅ Voice preferences saved for user ${userId}: ${voiceName}`);

        res.status(200).json({
            success: true,
            message: 'Voice preferences saved',
            preferences: data
        });
    } catch (error: any) {
        console.error('Save voice preferences error:', error);
        res.status(500).json({ error: 'Failed to save voice preferences' });
    }
};

// Generate signed URL for ElevenLabs conversation
export const getElevenLabsSignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        // Get user's voice preferences
        const { data: prefs } = await supabase
            .from('voice_preferences')
            .select('voice_id')
            .eq('user_id', user.id)
            .single();

        const voiceId = prefs?.voice_id || 'rachel';

        // Return the API key for client-side use (in production, use signed URLs)
        // For now, we'll return a configuration object
        res.status(200).json({
            apiKey: apiKey,
            voiceId: voiceId,
            agentConfig: {
                model: 'eleven_turbo_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            }
        });
    } catch (error: any) {
        console.error('Get ElevenLabs signed URL error:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
};
