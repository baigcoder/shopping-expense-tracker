import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../emailService.js';

describe('escapeHtml', () => {
    it('neutralises markup a signup name could inject into emails', () => {
        expect(escapeHtml(`<a href='https://evil'>Refund</a> & "x"`)).toBe(
            '&lt;a href=&#39;https://evil&#39;&gt;Refund&lt;/a&gt; &amp; &quot;x&quot;'
        );
    });
});
