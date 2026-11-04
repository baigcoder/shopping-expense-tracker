import { describe, expect, it } from 'vitest';
import { ruleFor, withRules } from './inboxRules';

const rule = (id: string, pattern: string, category: string, matchType = 'contains', enabled = true) => ({ id, pattern, category, matchType, enabled });
const item = (id: string, merchant: string, category = 'Other') => ({ id, merchant, description: merchant, amount: 100, category, date: '2026-11-15', source: 'extension', confidence: 0.9 });

describe('inbox rules', () => {
    it('picks the most specific enabled rule and ignores paused or broken ones', () => {
        const rules = [rule('a', 'food', 'Shopping'), rule('b', 'Foodpanda', 'Food & Dining', 'exact'), rule('c', 'panda', 'Transport', 'contains', false), rule('d', '(', 'X', 'regex')];
        expect(ruleFor('Foodpanda', rules)?.id).toBe('b');
        expect(ruleFor('Foodpanda Mart', rules)?.id).toBe('a');
        expect(ruleFor('Careem', rules)).toBeNull();
    });

    it('recategorises waiting items and marks only the ones that changed', () => {
        const out = withRules([item('1', 'Foodpanda'), item('2', 'Careem'), item('3', 'Foodpanda', 'Food & Dining')], [rule('b', 'foodpanda', 'Food & Dining')]);
        expect(out.map((i) => [i.category, Boolean(i.ruled)])).toEqual([['Food & Dining', true], ['Other', false], ['Food & Dining', false]]);
    });
});
