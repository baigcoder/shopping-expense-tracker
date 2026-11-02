import { describe, expect, it } from 'vitest';
import { shouldAutoApproveExtensionCapture } from '../autoApproveCapture.js';

describe('shouldAutoApproveExtensionCapture', () => {
    const trusted = {
        source: 'extension',
        matchedRule: { id: 'rule-1' },
        duplicate: false,
        confidence: 0.9,
        amount: 12.99,
        isTrial: false,
    };

    it('auto-approves high-confidence extension captures', () => {
        expect(shouldAutoApproveExtensionCapture(trusted)).toBe(true);
    });

    it('leaves csv and pdf imports in the inbox', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, source: 'csv' })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, source: 'pdf' })).toBe(false);
    });

    it('skips duplicates, low confidence, and zero amounts (trials live in Subscriptions)', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, duplicate: true })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, confidence: 0.7 })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, amount: 0 })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, amount: 0, isTrial: true })).toBe(false);
    });

    it('does not need a merchant rule unless review is required', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, matchedRule: null })).toBe(true);
        process.env.EXTENSION_REQUIRE_REVIEW = 'true';
        try {
            expect(shouldAutoApproveExtensionCapture({ ...trusted, matchedRule: null })).toBe(false);
            expect(shouldAutoApproveExtensionCapture(trusted)).toBe(true);
        } finally {
            delete process.env.EXTENSION_REQUIRE_REVIEW;
        }
    });

    it('keeps captures in the inbox when the currency could not be converted', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, fxUnavailable: true })).toBe(false);
    });
});
