import { describe, expect, it } from 'vitest';
import { csvCell } from '../exportService';

describe('csvCell', () => {
    it('quotes text and doubles inner quotes, so commas stay in one column', () => {
        expect(csvCell('Food, Dining')).toBe('"Food, Dining"');
        expect(csvCell('5" screen')).toBe('"5"" screen"');
    });

    it('turns anything a spreadsheet would run as a formula into plain text', () => {
        expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
        expect(csvCell('+92 300')).toBe('"\'+92 300"');
        expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
        expect(csvCell('Daraz')).toBe('"Daraz"');
    });
});
