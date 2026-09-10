import { describe, expect, it } from 'vitest';
import { getGroqModel, isGroqConfigured, prefersGroqFirst } from '../groqService.js';

describe('groqService helpers', () => {
    it('uses instant models for fast chat and voice', () => {
        expect(getGroqModel('fastChat')).toContain('instant');
        expect(getGroqModel('voice')).toContain('instant');
        expect(getGroqModel('chat')).toContain('70b');
    });

    it('prefers Groq first only for low-latency paths', () => {
        expect(prefersGroqFirst('fastChat')).toBe(true);
        expect(prefersGroqFirst('voice')).toBe(true);
        expect(prefersGroqFirst('analysis')).toBe(false);
        expect(prefersGroqFirst('chat')).toBe(false);
    });

    it('rejects placeholder groq keys', () => {
        const previous = process.env.GROQ_API_KEY;
        process.env.GROQ_API_KEY = 'your_groq_api_key_here';
        expect(isGroqConfigured()).toBe(false);
        process.env.GROQ_API_KEY = previous;
    });
});
