// DeepSeek AI Service - Dynamic LLM-powered financial insights
// Uses the ChatAnywhere API endpoint with DeepSeek R1 model

const DEEPSEEK_API_URL = 'https://api.chatanywhere.tech/v1/chat/completions';
const DEEPSEEK_API_KEY = 'sk-pU53O9QCANvAfNYHz6ykI4OMdeXfExDJfHulM2KICALWrnXH';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface DeepSeekResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

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

// Cache for AI responses to avoid hitting API too frequently
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Call DeepSeek API with a prompt
 */
async function callDeepSeek(messages: ChatMessage[], temperature = 0.7): Promise<string> {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Using gpt-4o-mini for faster responses
                messages,
                temperature,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', errorText);
            throw new Error(`API error: ${response.status}`);
        }

        const data: DeepSeekResponse = await response.json();
        return data.choices[0]?.message?.content || 'I could not generate a response.';
    } catch (error) {
        console.error('DeepSeek API call failed:', error);
        throw error;
    }
}

/**
 * Generate a financial insight based on user's real data
 */
export async function generateFinancialInsight(
    userMessage: string,
    context: FinancialContext
): Promise<string> {
    // Check cache first
    const cacheKey = `${userMessage}-${JSON.stringify(context)}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response;
    }

    const systemPrompt = `You are a Gen-Z friendly financial advisor AI called "Finzen AI". 
You speak casually but give genuinely helpful financial advice. Use emojis sparingly but effectively.
Keep responses concise (2-4 sentences max unless asked for details).

The user's REAL financial data (use this to personalize your response):
- Monthly spending: Rs ${context.monthlySpent}
- Weekly spending: Rs ${context.weeklySpent}  
- Top spending category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Total transactions: ${context.transactionCount}
- Active subscriptions: ${context.subscriptionCount} (Rs ${context.monthlySubCost}/month)
- Savings goals: ${context.goalCount}
- Budgets set: ${context.budgetCount}
${context.healthScore !== undefined ? `- Financial health score: ${context.healthScore}/100` : ''}
${context.burnRate !== undefined ? `- Burn rate: ${context.burnRate}%` : ''}
${context.daysUntilBroke !== null && context.daysUntilBroke !== undefined ? `- Days until funds run out: ${context.daysUntilBroke}` : ''}

Important: Base your advice on the ACTUAL numbers above. Be specific and actionable.`;

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

    try {
        const response = await callDeepSeek(messages);

        // Cache the response
        responseCache.set(cacheKey, { response, timestamp: Date.now() });

        return response;
    } catch (error) {
        // Return null to indicate failure - caller should use fallback
        throw error;
    }
}

/**
 * Generate AI-powered risk prevention advice
 */
export async function generateRiskAdvice(
    riskTitle: string,
    riskMessage: string,
    context: FinancialContext
): Promise<string> {
    const cacheKey = `risk-${riskTitle}-${context.monthlySpent}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response;
    }

    const systemPrompt = `You are a financial risk advisor. Give ONE specific, actionable tip to prevent this risk.
Keep it to 1-2 sentences max. Be direct and practical.

User's spending context:
- Monthly spending: Rs ${context.monthlySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Subscriptions: ${context.subscriptionCount} (Rs ${context.monthlySubCost}/month)`;

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Risk detected: ${riskTitle}\nDetails: ${riskMessage}\n\nGive me one specific tip to prevent this.` }
    ];

    try {
        const response = await callDeepSeek(messages, 0.5);
        responseCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Generate spending analysis summary
 */
export async function generateSpendingAnalysis(context: FinancialContext): Promise<string> {
    const cacheKey = `analysis-${context.monthlySpent}-${context.topCategory}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response;
    }

    const systemPrompt = `You are a financial analyst. Provide a brief, insightful analysis of the user's spending.
Focus on actionable observations. Keep it to 3-4 bullet points max.`;

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: `Analyze my spending:
- Monthly: Rs ${context.monthlySpent}
- Weekly: Rs ${context.weeklySpent}
- Top category: ${context.topCategory} (Rs ${context.topCategoryAmount})
- Transactions: ${context.transactionCount}
- Subscriptions: ${context.subscriptionCount} costing Rs ${context.monthlySubCost}/month
- Health score: ${context.healthScore || 'N/A'}/100

Give me 3 quick insights.`
        }
    ];

    try {
        const response = await callDeepSeek(messages, 0.6);
        responseCache.set(cacheKey, { response, timestamp: Date.now() });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Clear the response cache
 */
export function clearDeepSeekCache(): void {
    responseCache.clear();
}

export default {
    generateFinancialInsight,
    generateRiskAdvice,
    generateSpendingAnalysis,
    clearDeepSeekCache
};
