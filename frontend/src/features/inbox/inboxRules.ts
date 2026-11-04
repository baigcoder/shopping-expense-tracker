// Merchant rules applied to items already waiting. The backend applies rules only to new captures,
// so a rule saved today would otherwise leave this week's Foodpanda orders in the wrong category.
import type { InboxItem, InboxRule } from './InboxView';

const ORDER: Record<string, number> = { exact: 0, starts_with: 1, contains: 2, regex: 3 };

// Same matching as backend ruleMatches, most specific rule first.
export function ruleFor(merchant: string, rules: InboxRule[]): InboxRule | null {
    const m = merchant.toLowerCase();
    return rules
        .filter((r) => r.enabled && r.pattern.trim())
        .sort((a, b) => (ORDER[a.matchType] ?? 2) - (ORDER[b.matchType] ?? 2))
        .find((r) => {
            const p = r.pattern.toLowerCase();
            try {
                return r.matchType === 'exact' ? m === p : r.matchType === 'starts_with' ? m.startsWith(p) : r.matchType === 'regex' ? new RegExp(r.pattern, 'i').test(merchant) : m.includes(p);
            } catch { return false; }
        }) || null;
}

/** Items with their rule's category; `ruled` marks the ones whose approval must send that category. */
export function withRules(items: InboxItem[], rules: InboxRule[]): InboxItem[] {
    return items.map((item) => {
        const rule = ruleFor(item.merchant, rules);
        return rule && rule.category !== item.category ? { ...item, category: rule.category, ruled: true } : item;
    });
}
