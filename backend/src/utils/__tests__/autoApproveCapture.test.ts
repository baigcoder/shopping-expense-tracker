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

    it('auto-approves high-confidence extension captures with a merchant rule', () => {
        expect(shouldAutoApproveExtensionCapture(trusted)).toBe(true);
    });

    it('leaves csv and pdf imports in the inbox', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, source: 'csv' })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, source: 'pdf' })).toBe(false);
    });

    it('skips duplicates, low confidence, and zero amounts that are not trials', () => {
        expect(shouldAutoApproveExtensionCapture({ ...trusted, duplicate: true })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, confidence: 0.7 })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, amount: 0 })).toBe(false);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, amount: 0, isTrial: true })).toBe(true);
        expect(shouldAutoApproveExtensionCapture({ ...trusted, matchedRule: null })).toBe(false);
    });
});
