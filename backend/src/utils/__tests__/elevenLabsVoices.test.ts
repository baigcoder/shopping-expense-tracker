import { describe, expect, it } from 'vitest';
import {
    isElevenLabsConfigured,
    resolveElevenLabsVoiceId,
    sanitizeTtsText,
} from '../elevenLabsVoices.js';

describe('elevenLabsVoices', () => {
    it('maps friendly names to ElevenLabs voice ids', () => {
        expect(resolveElevenLabsVoiceId('jenny')).toMatch(/^[A-Za-z0-9]+$/);
        expect(resolveElevenLabsVoiceId('Aria')).toBe(resolveElevenLabsVoiceId('aria'));
        expect(resolveElevenLabsVoiceId('unknown')).toBe(resolveElevenLabsVoiceId('jenny'));
    });

    it('accepts known raw voice ids and rejects others', () => {
        const jennyId = resolveElevenLabsVoiceId('jenny');
        expect(resolveElevenLabsVoiceId(jennyId)).toBe(jennyId);
        expect(resolveElevenLabsVoiceId('not-a-real-voice')).toBe(jennyId);
    });

    it('requires a real sk_ key', () => {
        expect(isElevenLabsConfigured('sk_123456789012345678901')).toBe(true);
        expect(isElevenLabsConfigured('your_elevenlabs_api_key')).toBe(false);
        expect(isElevenLabsConfigured('')).toBe(false);
    });

    it('trims tts text to a safe length', () => {
        expect(sanitizeTtsText('  hello\nworld  ')).toBe('hello world');
        expect(sanitizeTtsText('x'.repeat(2000)).length).toBe(800);
    });
});
