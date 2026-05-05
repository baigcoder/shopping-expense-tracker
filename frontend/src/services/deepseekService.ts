// Legacy AI helper kept for compatibility.
// All provider calls now go through the authenticated backend OpenRouter service.

import api from './api';

interface FinancialContext {
    monthlySpent: number;
    weeklySpent: number;
    topCategory: string;
    topCategoryAmount: number;
    transactionCount: number;
    subscriptionCount: number;
    monthlySubCost: number;
    goalCount: number;
    budgetCount: number;
    healthScore?: number;
    burnRate?: number;
    daysUntilBroke?: number | null;
}

const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function buildFinancialContext(context: FinancialContext): string {
    return `Financial context:
- Monthly spending: Rs ${context.monthlySpent}
- Weekly spending: Rs ${context.weeklySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Transactions: ${context.transactionCount}
- Active subscriptions: ${context.subscriptionCount} (Rs ${context.monthlySubCost}/month)
- Savings goals: ${context.goalCount}
- Budgets: ${context.budgetCount}
${context.healthScore !== undefined ? `- Financial health score: ${context.healthScore}/100` : ''}
${context.burnRate !== undefined ? `- Burn rate: ${context.burnRate}%` : ''}
${context.daysUntilBroke !== null && context.daysUntilBroke !== undefined ? `- Days until funds run out: ${context.daysUntilBroke}` : ''}`;
}

async function callBackendAI(message: string, context: FinancialContext, cacheKey: string): Promise<string> {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response;
    }

    const response = await api.post('/ai/chat/fast', {
        message,
        context: buildFinancialContext(context)
    });

    const reply = response.data?.reply || 'I could not generate a response.';
    responseCache.set(cacheKey, { response: reply, timestamp: Date.now() });
    return reply;
}

export async function generateFinancialInsight(
    userMessage: string,
    context: FinancialContext
): Promise<string> {
    const cacheKey = `${userMessage}-${JSON.stringify(context)}`;
    return callBackendAI(userMessage, context, cacheKey);
}

export async function generateRiskAdvice(
    riskTitle: string,
    riskMessage: string,
    context: FinancialContext
): Promise<string> {
    const message = `Risk detected: ${riskTitle}\nDetails: ${riskMessage}\n\nGive me one specific tip to prevent this.`;
    return callBackendAI(message, context, `risk-${riskTitle}-${context.monthlySpent}`);
}

export async function generateSpendingAnalysis(context: FinancialContext): Promise<string> {
    const message = `Analyze my spending and give me 3 quick insights:
- Monthly: Rs ${context.monthlySpent}
- Weekly: Rs ${context.weeklySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Transactions: ${context.transactionCount}
- Subscriptions: ${context.subscriptionCount} costing Rs ${context.monthlySubCost}/month
- Health score: ${context.healthScore || 'N/A'}/100`;

    return callBackendAI(message, context, `analysis-${context.monthlySpent}-${context.topCategory}`);
}

export function clearDeepSeekCache(): void {
    responseCache.clear();
}

export default {
    generateFinancialInsight,
    generateRiskAdvice,
    generateSpendingAnalysis,
    clearDeepSeekCache
};
