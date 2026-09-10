export const ELEVENLABS_VOICES: Record<string, { id: string; name: string; gender: 'female' | 'male' }> = {
    jenny: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Jenny', gender: 'female' },
    aria: { id: '9BWtsMINqrJLrRamLj8C', name: 'Aria', gender: 'female' },
    guy: { id: 'nPczCjzI2devNBz1zQrb', name: 'Guy', gender: 'male' },
    davis: { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Davis', gender: 'male' },
    rachel: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female' },
};

const ALLOWED_VOICE_IDS = new Set(Object.values(ELEVENLABS_VOICES).map((voice) => voice.id));

export const DEFAULT_ELEVENLABS_VOICE = ELEVENLABS_VOICES.jenny;

export function resolveElevenLabsVoiceId(input?: string | null): string {
    const raw = String(input || '').trim();
    if (!raw) return DEFAULT_ELEVENLABS_VOICE.id;

    const alias = ELEVENLABS_VOICES[raw.toLowerCase()];
    if (alias) return alias.id;
    if (ALLOWED_VOICE_IDS.has(raw)) return raw;

    return DEFAULT_ELEVENLABS_VOICE.id;
}

export function listElevenLabsVoices() {
    return Object.entries(ELEVENLABS_VOICES).map(([alias, voice]) => ({
        alias,
        ...voice,
    }));
}

export function isElevenLabsConfigured(apiKey?: string): boolean {
    const key = (apiKey || '').trim();
    return Boolean(key) && key.startsWith('sk_') && key.length > 20 && !key.includes('your_elevenlabs');
}

export function sanitizeTtsText(text: string, maxLength = 800): string {
    return String(text || '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}
