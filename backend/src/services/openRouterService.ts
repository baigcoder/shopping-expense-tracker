// OpenRouter AI Service - provider-neutral LLM calls for Cashly AI
// With automatic model fallback chains for reliability

import { getDefaultForecast, normalizeForecasts, normalizeInsights, formatMoneyAmount } from '../utils/aiGrounding.js';
import {
    groqChatCompletion,
    isGroqConfigured,
    getGroqConfigurationError,
    getGroqModel,
    prefersGroqFirst,
} from './groqService.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_NAME = process.env.OPENROUTER_APP_NAME || 'Cashly';
const DEFAULT_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 15000);
let providerDisabledReason: string | null = null;

// Circuit breaker for models that are rate limited
const blacklistedModels = new Map<string, number>();
const BLACKLIST_DURATION_MS = 60000; // 1 minute

export type OpenRouterUseCase =
    | 'chat'
    | 'fastChat'
    | 'analysis'
    | 'forecast'
    | 'risk'
    | 'voice'
    | 'document';

// Primary + fallback model chains for each use case
// Using the latest available free models as of May 2026
const MODEL_CHAINS: Record<OpenRouterUseCase, string[]> = {
    chat: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'openai/gpt-oss-120b:free',
        'google/gemma-3-27b-it:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'minimax/minimax-m2.5:free',
        'openrouter/auto',
    ],
    fastChat: [
        'google/gemma-3-12b-it:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'nvidia/nemotron-nano-9b-v2:free',
        'openai/gpt-oss-20b:free',
        'openrouter/auto',
    ],
    analysis: [
        'openai/gpt-oss-120b:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
        'openrouter/auto',
    ],
    forecast: [
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'google/gemma-3-27b-it:free',
        'minimax/minimax-m2.5:free',
        'openrouter/auto',
    ],
    risk: [
        'nvidia/nemotron-3-super-120b-a12b:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
        'openrouter/auto',
    ],
    voice: [
        'google/gemma-3-12b-it:free',
        'nvidia/nemotron-nano-9b-v2:free',
        'openrouter/auto',
    ],
    document: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'openai/gpt-oss-120b:free',
        'openrouter/auto',
    ]
};

const USE_CASE_ENV: Record<OpenRouterUseCase, string> = {
    chat: 'OPENROUTER_CHAT_MODEL',
    fastChat: 'OPENROUTER_FAST_CHAT_MODEL',
    analysis: 'OPENROUTER_ANALYSIS_MODEL',
    forecast: 'OPENROUTER_FORECAST_MODEL',
    risk: 'OPENROUTER_RISK_MODEL',
    voice: 'OPENROUTER_VOICE_MODEL',
    document: 'OPENROUTER_DOCUMENT_MODEL'
};

type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

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
    pendingCount?: number;
    pendingAmount?: number;
    overBudgetCount?: number;
    currency?: string;
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

export interface ChatCompletionOptions {
    model?: string;
    useCase?: OpenRouterUseCase;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
    user?: string;
}

export interface ChatCompletionResult {
    content: string;
    model: string;
    provider?: 'groq' | 'openrouter';
}

function getApiKey(): string {
    return (process.env.OPENROUTER_API_KEY || '').trim();
}

function isPlaceholderApiKey(apiKey: string): boolean {
    return !apiKey
        || apiKey.includes('xxxxx')
        || apiKey.includes('your_openrouter_api_key')
        || apiKey.includes('replace_with');
}

function getHeaders(): Record<string, string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('OpenRouter API key is missing');
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-OpenRouter-Title': APP_NAME
    };

    const siteUrl = process.env.OPENROUTER_SITE_URL || process.env.FRONTEND_URL;
    if (siteUrl) {
        headers['HTTP-Referer'] = siteUrl;
    }

    return headers;
}

export function isOpenRouterConfigured(): boolean {
    const apiKey = getApiKey();
    return !providerDisabledReason && !isPlaceholderApiKey(apiKey);
}

export function isConfigured(): boolean {
    return isOpenRouterConfigured() || isGroqConfigured();
}

export function getOpenRouterConfigurationError(): string | null {
    if (providerDisabledReason) return providerDisabledReason;
    const apiKey = getApiKey();
    if (!apiKey) return 'OPENROUTER_API_KEY is not configured';
    if (isPlaceholderApiKey(apiKey)) return 'OPENROUTER_API_KEY is still a placeholder';
    return null;
}

export function getConfigurationError(): string | null {
    if (isConfigured()) return null;
    return getGroqConfigurationError() || getOpenRouterConfigurationError() || 'No AI provider is configured';
}

export function getModelName(useCase: OpenRouterUseCase = 'chat'): string {
    return process.env[USE_CASE_ENV[useCase]]
        || process.env.OPENROUTER_MODEL
        || MODEL_CHAINS[useCase][0];
}

export function getModelMap(): Record<OpenRouterUseCase, string> {
    return {
        chat: getModelName('chat'),
        fastChat: getModelName('fastChat'),
        analysis: getModelName('analysis'),
        forecast: getModelName('forecast'),
        risk: getModelName('risk'),
        voice: getModelName('voice'),
        document: getModelName('document')
    };
}

// Single attempt to call OpenRouter with a specific model
async function attemptCompletion(
    model: string,
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    timeoutMs: number
): Promise<ChatCompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: getHeaders(),
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 500,
                response_format: options.responseFormat,
                user: options.user
            })
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || errorText.includes('invalid_api_key')) {
            providerDisabledReason = 'OPENROUTER_API_KEY is invalid or revoked';
        }
        
        // If 429, blacklist for a while
        if (response.status === 429) {
            blacklistedModels.set(model, Date.now() + BLACKLIST_DURATION_MS);
        }
        
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json() as {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Empty response from model');
    }

    return { content, model: data.model || model, provider: 'openrouter' };
}

// Main chat completion with automatic fallback chain
export async function chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
    if (!isConfigured()) {
        throw new Error(getConfigurationError() || 'No AI provider is configured');
    }

    const useCase = options.useCase || 'chat';
    const errors: string[] = [];
    const groqFirst = prefersGroqFirst(useCase);

    const tryGroq = async () => groqChatCompletion(messages, {
        useCase,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        responseFormat: options.responseFormat,
        user: options.user,
    });

    if (groqFirst && isGroqConfigured()) {
        try {
            return await tryGroq();
        } catch (error: any) {
            errors.push(`groq: ${(error?.message || String(error)).slice(0, 80)}`);
        }
    }

    if (isOpenRouterConfigured()) {
        const models: string[] = [];
        if (options.model) models.push(options.model);
        for (const model of MODEL_CHAINS[useCase]) {
            if (!models.includes(model)) models.push(model);
        }

        const now = Date.now();
        for (const model of models) {
            const blacklistExpiry = blacklistedModels.get(model);
            if (blacklistExpiry && blacklistExpiry > now) {
                continue;
            }

            try {
                return await attemptCompletion(model, messages, options, DEFAULT_TIMEOUT_MS);
            } catch (error: any) {
                const msg = error?.message || String(error);
                errors.push(`${model}: ${msg.slice(0, 50)}`);
                if (msg.includes('invalid_api_key') || msg.includes('401')) break;
            }
        }
    }

    if (!groqFirst && isGroqConfigured()) {
        try {
            return await tryGroq();
        } catch (error: any) {
            errors.push(`groq: ${(error?.message || String(error)).slice(0, 80)}`);
        }
    }

    throw new Error(`All models failed. Tried: ${errors.join(' | ') || 'no providers'}`);
}

function parseJsonPayload(content: string): any {
    try {
        return JSON.parse(content);
    } catch {
        const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!match) throw new Error('No JSON payload found in AI response');
        return JSON.parse(match[0]);
    }
}

export async function generateInsights(context: FinancialContext): Promise<AIInsight[]> {
    const systemPrompt = `You are a financial advisor AI. Use ONLY the numbers provided. Do not invent merchants or extra totals.
Return ONLY valid JSON in this shape:
{"insights":[{"type":"tip|warning|forecast|risk","title":"Short title","message":"Actionable advice","confidence":0.0}]}`;

    const money = (value?: number) => formatMoneyAmount(Number(value) || 0, context.currency);
    const userPrompt = `User's approved ledger:
- Monthly spending: ${money(context.monthlySpent)}
- Weekly spending: ${money(context.weeklySpent)}
- Top category: ${context.topCategory} (${money(context.topCategoryAmount)})
- Transactions: ${context.transactionCount}
- Health score: ${context.healthScore || 'N/A'}/100
${context.subscriptionCount ? `- Subscriptions: ${context.subscriptionCount} (${money(context.monthlySubCost)}/month)` : ''}
${context.pendingCount ? `- Pending inbox (not in ledger): ${context.pendingCount} items totaling ${money(context.pendingAmount)}` : ''}
${context.overBudgetCount ? `- Categories over budget: ${context.overBudgetCount}` : ''}

Amounts are in ${context.currency || 'USD'}. Provide 3 specific, actionable insights based only on this data.`;

    try {
        const response = await chatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            { useCase: 'analysis', temperature: 0.4, maxTokens: 500, responseFormat: { type: 'json_object' }, user: context.userId }
        );

        const parsed = parseJsonPayload(response.content);
        const insights = normalizeInsights(parsed);
        return insights.length ? insights : getDefaultInsights(context);
    } catch (error: any) {
        console.error('OpenRouter insights error:', error.message);
        return getDefaultInsights(context);
    }
}

export async function generateForecast(context: FinancialContext): Promise<AIForecast[]> {
    const systemPrompt = `You are a financial forecasting AI. Base the next 2 months on the provided monthly spend only. Do not invent income.
Return ONLY valid JSON in this shape:
{"forecasts":[{"month":"Month Year","predictedExpenses":0,"predictedIncome":0,"riskLevel":"low|medium|high","insights":["insight"]}]}`;

    const userPrompt = `User's current approved spending:
- Monthly: ${formatMoneyAmount(context.monthlySpent, context.currency)}
- Weekly: ${formatMoneyAmount(context.weeklySpent, context.currency)}
- Top category: ${context.topCategory}

Amounts are in ${context.currency || 'USD'}. Forecast the next 2 months. Keep predicted expenses near the current monthly amount.`;

    try {
        const response = await chatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            { useCase: 'forecast', temperature: 0.2, maxTokens: 400, responseFormat: { type: 'json_object' }, user: context.userId }
        );

        const parsed = parseJsonPayload(response.content);
        const forecasts = normalizeForecasts(parsed, context.monthlySpent, context.currency);
        return forecasts.length ? forecasts : getDefaultForecast(context.monthlySpent, context.currency);
    } catch (error: any) {
        console.error('OpenRouter forecast error:', error.message);
        return getDefaultForecast(context.monthlySpent, context.currency);
    }
}

export async function generateRiskAlerts(context: FinancialContext): Promise<AIInsight[]> {
    const systemPrompt = `You are a financial risk detection AI. Identify risks only from the provided numbers.
Return ONLY valid JSON in this shape:
{"risks":[{"type":"risk","title":"Risk title","message":"Risk description and prevention tip","confidence":0.0}]}
If no risks are detected, return {"risks":[]}.`;

    const userPrompt = `Analyze for risks:
- Monthly: ${formatMoneyAmount(context.monthlySpent, context.currency)}
- Top category: ${context.topCategory} (${formatMoneyAmount(context.topCategoryAmount, context.currency)})
- Health score: ${context.healthScore || 50}/100
${context.pendingCount ? `- Pending inbox items: ${context.pendingCount}` : ''}
${context.overBudgetCount ? `- Over-budget categories: ${context.overBudgetCount}` : ''}
Amounts are in ${context.currency || 'USD'}.`;

    try {
        const response = await chatCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            { useCase: 'risk', temperature: 0.3, maxTokens: 300, responseFormat: { type: 'json_object' }, user: context.userId }
        );

        const parsed = parseJsonPayload(response.content);
        return normalizeInsights(Array.isArray(parsed) ? parsed : parsed.risks || []).map((risk) => ({
            ...risk,
            type: 'risk' as const,
        }));
    } catch (error: any) {
        console.error('OpenRouter risk analysis error:', error.message);
        return [];
    }
}

function getDefaultInsights(context: FinancialContext): AIInsight[] {
    const insights: AIInsight[] = [];

    if (context.topCategoryAmount > context.monthlySpent * 0.3) {
        insights.push({
            type: 'warning',
            title: `High ${context.topCategory} Spending`,
            message: `Your ${context.topCategory} spending is over 30% of your monthly spending. Consider setting a tighter limit.`,
            confidence: 0.9,
            generatedAt: new Date().toISOString()
        });
    }

    if (context.healthScore && context.healthScore < 60) {
        insights.push({
            type: 'tip',
            title: 'Improve Financial Health',
            message: 'Your health score is below average. Try reducing discretionary spending by 10% this month.',
            confidence: 0.85,
            generatedAt: new Date().toISOString()
        });
    }

    if (insights.length === 0) {
        insights.push({
            type: 'tip',
            title: 'Keep Tracking',
            message: 'Continue logging your expenses to get personalized AI insights.',
            confidence: 1,
            generatedAt: new Date().toISOString()
        });
    }

    return insights;
}

export { getDefaultForecast };

export default {
    chatCompletion,
    generateInsights,
    generateForecast,
    generateRiskAlerts,
    getModelName,
    getModelMap,
    getConfigurationError,
    getOpenRouterConfigurationError,
    isConfigured,
    isOpenRouterConfigured,
};
