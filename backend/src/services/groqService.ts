// Groq AI Service - Fast LLM inference for financial insights
// Uses Groq's free tier with Llama 3.1 8B model

import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

// Default model - Llama 3.1 8B is fast and capable
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export interface FinancialContext {
    userId: string;
    monthlySpent: number;
    weeklySpent: number;
    topCategory: string;
    topCategoryAmount: number;
    transactionCount: number;
    healthScore?: number;
    subscriptionCount?: number;
    monthlySubCost?: number;
}

export interface AIInsight {
    type: 'tip' | 'warning' | 'forecast' | 'risk';
    title: string;
    message: string;
    confidence: number;
    generatedAt: string;
}

export interface AIForecast {
    month: string;
    predictedExpenses: number;
    predictedIncome: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
}

/**
 * Generate financial insights using Groq
 */
export async function generateInsights(context: FinancialContext): Promise<AIInsight[]> {
    const systemPrompt = `You are a financial advisor AI. Analyze the user's spending data and provide 3 actionable insights.
Return ONLY a JSON array with this structure (no other text):
[
  {"type": "tip|warning|forecast|risk", "title": "Short title", "message": "Actionable advice", "confidence": 0.0-1.0}
]`;

    const userPrompt = `User's financial data:
- Monthly spending: Rs ${context.monthlySpent}
- Weekly spending: Rs ${context.weeklySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Transactions: ${context.transactionCount}
- Health score: ${context.healthScore || 'N/A'}/100
${context.subscriptionCount ? `- Subscriptions: ${context.subscriptionCount} (Rs ${context.monthlySubCost}/month)` : ''}

Provide 3 specific, actionable insights based on this data.`;

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '[]';

        // Parse JSON response
        let insights: AIInsight[];
        try {
            const parsed = JSON.parse(content);
            insights = Array.isArray(parsed) ? parsed : (parsed.insights || []);
        } catch {
            console.error('Failed to parse Groq response:', content);
            return getDefaultInsights(context);
        }

        // Add timestamp
        return insights.map(insight => ({
            ...insight,
            generatedAt: new Date().toISOString()
        }));
    } catch (error: any) {
        console.error('Groq API error:', error.message);
        return getDefaultInsights(context);
    }
}

/**
 * Generate spending forecast using Groq
 */
export async function generateForecast(context: FinancialContext): Promise<AIForecast[]> {
    const systemPrompt = `You are a financial forecasting AI. Predict the user's spending for the next 2 months.
Return ONLY a JSON array with this structure (no other text):
[
  {"month": "Month Year", "predictedExpenses": number, "predictedIncome": number, "riskLevel": "low|medium|high", "insights": ["insight1"]}
]`;

    const userPrompt = `User's current spending:
- Monthly: Rs ${context.monthlySpent}
- Weekly: Rs ${context.weeklySpent}
- Top category: ${context.topCategory}

Forecast the next 2 months based on current patterns.`;

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '[]';

        try {
            const parsed = JSON.parse(content);
            return Array.isArray(parsed) ? parsed : (parsed.forecasts || []);
        } catch {
            console.error('Failed to parse Groq forecast:', content);
            return getDefaultForecast(context);
        }
    } catch (error: any) {
        console.error('Groq forecast error:', error.message);
        return getDefaultForecast(context);
    }
}

/**
 * Generate risk alerts using Groq
 */
export async function generateRiskAlerts(context: FinancialContext): Promise<AIInsight[]> {
    const systemPrompt = `You are a financial risk detection AI. Identify potential risks in the user's spending.
Return ONLY a JSON array with this structure (no other text):
[
  {"type": "risk", "title": "Risk title", "message": "Risk description and prevention tip", "confidence": 0.0-1.0}
]
If no risks are detected, return an empty array.`;

    const userPrompt = `Analyze for risks:
- Monthly: Rs ${context.monthlySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Health score: ${context.healthScore || 50}/100`;

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content || '[]';

        try {
            const parsed = JSON.parse(content);
            const risks = Array.isArray(parsed) ? parsed : (parsed.risks || []);
            return risks.map((r: AIInsight) => ({
                ...r,
                type: 'risk' as const,
                generatedAt: new Date().toISOString()
            }));
        } catch {
            return [];
        }
    } catch (error: any) {
        console.error('Groq risk analysis error:', error.message);
        return [];
    }
}

/**
 * Default insights when API fails
 */
function getDefaultInsights(context: FinancialContext): AIInsight[] {
    const insights: AIInsight[] = [];

    // Category-based tip
    if (context.topCategoryAmount > context.monthlySpent * 0.3) {
        insights.push({
            type: 'warning',
            title: `High ${context.topCategory} Spending`,
            message: `Your ${context.topCategory} spending is over 30% of your monthly budget. Consider setting a limit.`,
            confidence: 0.9,
            generatedAt: new Date().toISOString()
        });
    }

    // Health score tip
    if (context.healthScore && context.healthScore < 60) {
        insights.push({
            type: 'tip',
            title: 'Improve Financial Health',
            message: 'Your health score is below average. Try reducing discretionary spending by 10% this month.',
            confidence: 0.85,
            generatedAt: new Date().toISOString()
        });
    }

    // Default tip
    if (insights.length === 0) {
        insights.push({
            type: 'tip',
            title: 'Keep Tracking',
            message: 'Continue logging your expenses to get personalized AI insights.',
            confidence: 1.0,
            generatedAt: new Date().toISOString()
        });
    }

    return insights;
}

/**
 * Default forecast when API fails
 */
function getDefaultForecast(context: FinancialContext): AIForecast[] {
    const now = new Date();
    return [1, 2].map(i => {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return {
            month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            predictedExpenses: Math.round(context.monthlySpent * (1 + (Math.random() * 0.1 - 0.05))),
            predictedIncome: 0, // Unknown without income data
            riskLevel: context.monthlySpent > 50000 ? 'high' : 'medium' as const,
            insights: ['Based on your current spending patterns']
        };
    });
}

export default {
    generateInsights,
    generateForecast,
    generateRiskAlerts
};
