const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /forget\s+(all\s+)?previous\s+instructions?/gi,
    /disregard\s+(all\s+)?previous/gi,
    /you\s+are\s+now\s+a/gi,
    /pretend\s+you\s+are/gi,
    /new\s+instructions?:/gi,
];

export const CASHLY_CHAT_RULES = `You are "Cashly AI", a friendly financial assistant for the Cashly expense tracker.

KEY RULES:
- Keep responses concise (3-5 sentences unless the user asks for detail)
- Be encouraging but honest
- Do not use markdown headings
- Use emojis sparingly

GROUNDING:
- Only use numbers, merchants, and dates from USER FINANCIAL DATA below. Never invent them.
- Monthly/weekly totals are approved ledger spending only.
- Pending inbox items are detections waiting for review. Do not add them into spent totals.
- If a figure is missing, say you do not have it yet instead of guessing.
- If client cache conflicts with USER FINANCIAL DATA, prefer USER FINANCIAL DATA.`;

const INSIGHT_TYPES = new Set(['tip', 'warning', 'forecast', 'risk']);
const FORECAST_RISKS = new Set(['low', 'medium', 'high']);
const VOICE_ACTIONS = new Set(['add_goal', 'add_reminder', 'add_transaction', 'none']);
const CATEGORIES = [
    'Food & Dining', 'Shopping', 'Subscriptions', 'Transport', 'Utilities',
    'Entertainment', 'Healthcare', 'Bills', 'Other',
];
const MAX_MONEY = 10_000_000;

export function sanitizeClientContext(text: string, maxLength = 8000): string {
    if (!text || typeof text !== 'string') return '';

    let sanitized = text
        .slice(0, maxLength)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[filtered]');
    }

    return sanitized.trim();
}

export function composeChatSystemPrompt(groundedPrompt: string, clientContext?: string): string {
    const extra = sanitizeClientContext(clientContext || '');
    if (!extra) return groundedPrompt;
    return `${groundedPrompt}

CLIENT CACHE (may be slightly newer; if numbers conflict, prefer USER FINANCIAL DATA above):
${extra}`;
}

export function normalizeCurrencyCode(code?: string | null): string {
    const value = String(code || 'USD').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(value) ? value : 'USD';
}

export function formatMoneyAmount(amount: number, currency?: string | null): string {
    const code = normalizeCurrencyCode(currency);
    const value = Number(amount);
    const safe = Number.isFinite(value) ? value : 0;
    try {
        return new Intl.NumberFormat('en', {
            style: 'currency',
            currency: code,
            maximumFractionDigits: 2,
        }).format(safe);
    } catch {
        return `${code} ${safe.toLocaleString()}`;
    }
}

const SPEND_BANDS: Record<string, { modest: number; heavy: number; extreme: number }> = {
    USD: { modest: 400, heavy: 2000, extreme: 5000 },
    EUR: { modest: 400, heavy: 2000, extreme: 5000 },
    GBP: { modest: 350, heavy: 1800, extreme: 4500 },
    CAD: { modest: 500, heavy: 2500, extreme: 6000 },
    AUD: { modest: 500, heavy: 2500, extreme: 6000 },
    PKR: { modest: 15000, heavy: 50000, extreme: 100000 },
    INR: { modest: 8000, heavy: 40000, extreme: 80000 },
    AED: { modest: 1500, heavy: 7000, extreme: 18000 },
};

export function spendBandsForCurrency(currency?: string | null) {
    return SPEND_BANDS[normalizeCurrencyCode(currency)] || SPEND_BANDS.USD;
}

export function spendRiskLevel(monthlySpent: number, currency?: string | null): 'low' | 'medium' | 'high' {
    const spent = Number(monthlySpent) || 0;
    const bands = spendBandsForCurrency(currency);
    if (spent > bands.extreme) return 'high';
    if (spent > bands.heavy) return 'medium';
    return 'low';
}

export function calculateHealthScore(input: {
    monthlySpent: number;
    txCount: number;
    budgetOverCount?: number;
    monthlySubCost?: number;
    pendingCount?: number;
    currency?: string | null;
}): number {
    let score = 72;
    const spent = Number(input.monthlySpent) || 0;
    const txCount = Number(input.txCount) || 0;
    const bands = spendBandsForCurrency(input.currency);

    if (spent > bands.extreme) score -= 18;
    else if (spent > bands.heavy) score -= 10;
    else if (spent > 0 && spent < bands.modest) score += 4;

    if (txCount > 20) score += 8;
    else if (txCount > 10) score += 4;
    else if (txCount === 0) score -= 8;

    score -= Math.min(20, (input.budgetOverCount || 0) * 8);

    const subCost = Number(input.monthlySubCost) || 0;
    if (spent > 0 && subCost > spent * 0.35) score -= 10;

    if ((input.pendingCount || 0) > 5) score -= 4;

    return Math.max(0, Math.min(100, Math.round(score)));
}

export interface NormalizedInsight {
    type: 'tip' | 'warning' | 'forecast' | 'risk';
    title: string;
    message: string;
    confidence: number;
    generatedAt: string;
}

export function normalizeInsights(raw: unknown, generatedAt = new Date().toISOString()): NormalizedInsight[] {
    const source = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { insights?: unknown })?.insights)
            ? (raw as { insights: unknown[] }).insights
            : [];

    return source.slice(0, 5).flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as Record<string, unknown>;
        const title = String(row.title || '').trim().slice(0, 80);
        const message = String(row.message || row.description || '').trim().slice(0, 400);
        if (!title || !message) return [];
        const type = INSIGHT_TYPES.has(String(row.type)) ? String(row.type) as NormalizedInsight['type'] : 'tip';
        const confidence = Math.max(0, Math.min(1, Number(row.confidence) || 0.7));
        return [{ type, title, message, confidence, generatedAt }];
    });
}

export interface NormalizedForecast {
    month: string;
    predictedExpenses: number;
    predictedIncome: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
}

export function normalizeForecasts(raw: unknown, monthlySpent = 0, currency?: string | null): NormalizedForecast[] {
    const source = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { forecasts?: unknown })?.forecasts)
            ? (raw as { forecasts: unknown[] }).forecasts
            : [];

    const baseline = Math.max(0, Number(monthlySpent) || 0);
    const minSpend = Math.round(baseline * 0.4);
    const maxSpend = Math.round(Math.max(baseline, 1) * 2.5);

    return source.slice(0, 3).flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as Record<string, unknown>;
        const month = String(row.month || '').trim().slice(0, 40);
        if (!month) return [];
        const predictedExpenses = Math.max(minSpend, Math.min(maxSpend, Math.round(Number(row.predictedExpenses) || baseline)));
        const predictedIncome = Math.max(0, Math.min(MAX_MONEY, Math.round(Number(row.predictedIncome) || 0)));
        const riskLevel = FORECAST_RISKS.has(String(row.riskLevel))
            ? String(row.riskLevel) as NormalizedForecast['riskLevel']
            : spendRiskLevel(baseline, currency);
        const insights = Array.isArray(row.insights)
            ? row.insights.map((value) => String(value).trim()).filter(Boolean).slice(0, 3)
            : ['Based on your current spending pattern'];
        return [{ month, predictedExpenses, predictedIncome, riskLevel, insights }];
    });
}

export function getDefaultForecast(monthlySpent: number, currency?: string | null): NormalizedForecast[] {
    const now = new Date();
    const baseline = Math.max(0, Math.round(Number(monthlySpent) || 0));
    return [1, 2].map((offset) => {
        const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return {
            month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            predictedExpenses: baseline,
            predictedIncome: 0,
            riskLevel: spendRiskLevel(baseline, currency),
            insights: ['Projected from your latest approved monthly spending, not a random estimate.'],
        };
    });
}

export interface VoiceIntent {
    action: 'add_goal' | 'add_reminder' | 'add_transaction' | 'none';
    params: Record<string, any>;
    confirmation: string;
}

export function parseVoiceIntent(content: string): VoiceIntent {
    const fallback: VoiceIntent = {
        action: 'none',
        params: {},
        confirmation: "I didn't quite understand. Could you rephrase that?",
    };

    try {
        const match = content.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(match ? match[0] : '{}') as Record<string, any>;
        const action = VOICE_ACTIONS.has(String(parsed.action)) ? parsed.action as VoiceIntent['action'] : 'none';
        return {
            action,
            params: parsed.params && typeof parsed.params === 'object' ? parsed.params : {},
            confirmation: String(parsed.confirmation || fallback.confirmation).slice(0, 300),
        };
    } catch {
        return fallback;
    }
}

export function validateVoiceAction(intent: VoiceIntent): { ok: boolean; error?: string; intent: VoiceIntent } {
    const money = (value: unknown) => {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0 || amount > MAX_MONEY) return null;
        return Math.round(amount * 100) / 100;
    };

    if (intent.action === 'none') return { ok: true, intent };

    if (intent.action === 'add_goal') {
        const name = String(intent.params.name || '').trim().slice(0, 80);
        const target = money(intent.params.target);
        if (!name || !target || target <= 0) {
            return { ok: false, error: 'A goal needs a name and a positive target amount.', intent: { ...intent, action: 'none' } };
        }
        return { ok: true, intent: { ...intent, params: { name, target } } };
    }

    if (intent.action === 'add_reminder') {
        const title = String(intent.params.title || '').trim().slice(0, 80);
        const amount = money(intent.params.amount ?? 0);
        if (!title || amount === null) {
            return { ok: false, error: 'A reminder needs a title.', intent: { ...intent, action: 'none' } };
        }
        const due = String(intent.params.due_date || '').slice(0, 10);
        const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(due)
            ? due
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return { ok: true, intent: { ...intent, params: { title, amount, due_date: dueDate } } };
    }

    if (intent.action === 'add_transaction') {
        const amount = money(intent.params.amount);
        const description = String(intent.params.description || intent.params.category || '').trim().slice(0, 200);
        if (!amount || amount <= 0 || !description) {
            return { ok: false, error: 'A transaction needs a description and a positive amount.', intent: { ...intent, action: 'none' } };
        }
        const type = intent.params.type === 'income' ? 'income' : 'expense';
        const category = CATEGORIES.includes(String(intent.params.category)) ? String(intent.params.category) : 'Other';
        return { ok: true, intent: { ...intent, params: { description, amount, type, category } } };
    }

    return { ok: false, error: 'Unsupported action.', intent: { ...intent, action: 'none' } };
}

export function buildWeeklyCoachActions(input: {
    topCategory: string;
    topCategoryAmount: number;
    monthlySpent: number;
    goals: Array<{ name?: string; saved?: number; target?: number }>;
    trials: Array<{ name?: string }>;
    monthlySubCost: number;
    pendingCount: number;
    overBudgetCategories: string[];
}) {
    const topCategory = input.topCategory && input.topCategory !== 'None' ? input.topCategory : 'flexible spending';
    const cutTarget = Math.max(5, Math.round((input.topCategoryAmount || input.monthlySpent || 0) * 0.08));
    const lowestGoal = [...input.goals].sort((a, b) => {
        const aPct = a.target ? (a.saved || 0) / a.target : 0;
        const bPct = b.target ? (b.saved || 0) / b.target : 0;
        return aPct - bPct;
    })[0];
    const trial = input.trials[0];
    const overBudget = input.overBudgetCategories[0];

    const spendingTitle = overBudget
        ? `Pull ${overBudget} back under budget`
        : `Cut one ${topCategory} purchase`;
    const spendingDescription = overBudget
        ? `${overBudget} is already over budget. Skip one extra purchase this week.`
        : `Your largest approved category is ${topCategory}. Skip one avoidable buy (~${cutTarget}).`;

    const savingsTitle = lowestGoal?.name
        ? `Move money toward ${lowestGoal.name}`
        : 'Create one savings goal';
    const savingsDescription = lowestGoal?.name
        ? `Add a small transfer toward ${lowestGoal.name} so the goal stays in motion.`
        : 'Create a simple emergency or purchase goal so weekly saving has a target.';

    const subTitle = trial?.name
        ? `Decide on the ${trial.name} trial`
        : 'Audit one subscription';
    const subDescription = trial?.name
        ? `${trial.name} is still in trial. Cancel before it converts if you do not need it.`
        : `Active subscriptions total about ${Math.round(input.monthlySubCost || 0)}. Cancel or downgrade one low-value service.`;

    const pendingNote = input.pendingCount > 0
        ? ` ${input.pendingCount} inbox capture${input.pendingCount === 1 ? '' : 's'} still need review.`
        : '';

    return {
        summary: `This week: trim ${topCategory}, keep a savings habit, and clean recurring costs.${pendingNote}`,
        actions: [
            {
                action_type: 'spending',
                title: spendingTitle,
                description: spendingDescription,
                target_amount: cutTarget,
            },
            {
                action_type: 'savings',
                title: savingsTitle,
                description: savingsDescription,
                target_amount: Math.max(10, Math.round((lowestGoal?.target || 100) * 0.02)),
            },
            {
                action_type: 'subscription',
                title: subTitle,
                description: subDescription,
                target_amount: Math.max(5, Math.round((input.monthlySubCost || 0) * 0.1)),
            },
        ],
    };
}
