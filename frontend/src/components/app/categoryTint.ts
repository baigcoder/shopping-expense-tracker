// Pale tile + the dark of its own hue, from the --cat-* tokens in index.css.
const MAP: [RegExp, string][] = [
    [/food|dining|grocer|restaurant/i, 'food'],
    [/shop|cloth|electronic|amazon|daraz/i, 'shopping'],
    [/subscri|stream|software|netflix|spotify/i, 'subscriptions'],
    [/transport|fuel|uber|careem|travel|ride/i, 'transport'],
    [/bill|util|rent|internet|phone/i, 'bills'],
    [/health|medic|pharm|fitness|gym/i, 'health'],
    [/entertain|game|movie|fun/i, 'entertainment'],
    [/income|salary|refund/i, 'income'],
];

export function categoryTint(category: string): { ink: string; soft: string } {
    const key = MAP.find(([re]) => re.test(category || ''))?.[1] || 'other';
    return { ink: `var(--cat-${key})`, soft: `var(--cat-${key}-soft)` };
}
