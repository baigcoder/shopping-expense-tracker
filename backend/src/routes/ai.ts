// AI Routes - Endpoints for AI insights, forecasts, and risk alerts
// With Redis caching for instant responses
// SECURITY: Input sanitization and rate limiting applied

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import openRouterService, { FinancialContext, OpenRouterUseCase } from '../services/openRouterService';
import cacheService from '../services/redisCacheService';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sanitizeChatMessage } from '../utils/security';
import { findUnverified, stripUnverified } from '../utils/replyVerifier.js';
import { trialInsights } from '../utils/userKnowledge.js';
import { composeChatSystemPrompt, formatMoneyAmount, parseVoiceIntent, spendRiskLevel, validateVoiceAction } from '../utils/aiGrounding.js';
import { supabase } from '../config/supabase.js';
import { buildCashlySystemPrompt, getFinancialSnapshot, getFinancialSummary } from '../services/financialContextService.js';
import { createMoneyTransaction } from '../services/transactionDomainService.js';
import { getUserSettings } from '../services/settingsService.js';
import { getGroqConfigurationError, getGroqModel, isGroqConfigured } from '../services/groqService.js';

const router = Router();

// Apply auth middleware to ALL AI routes
router.use(authMiddleware);

const getAIUserId = (req: AuthRequest) => req.user?.supabaseId || req.user?.id;
const AI_CONTEXT_TIMEOUT_MS = Number(process.env.AI_CONTEXT_TIMEOUT_MS || 3500);
const AI_FEATURE_TIMEOUT_MS = Number(process.env.AI_FEATURE_TIMEOUT_MS || 10000);

// Rate limiting specifically for AI chat endpoints (stricter than global)
const aiChatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per IP
    message: { error: 'Too many AI requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const aiActionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many voice actions. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

function getChatUseCase(context: unknown, useCase: unknown): OpenRouterUseCase {
    if (useCase === 'document' || context === 'pdf_analysis') return 'document';
    return 'chat';
}

function getEmptyFinancialContext(userId: string): FinancialContext {
    return {
        userId,
        monthlySpent: 0,
        weeklySpent: 0,
        topCategory: 'None',
        topCategoryAmount: 0,
        transactionCount: 0,
        healthScore: 50,
        subscriptionCount: 0,
        monthlySubCost: 0,
        pendingCount: 0,
        pendingAmount: 0,
        overBudgetCount: 0,
        currency: 'USD'
    };
}

function getFeatureFallback(feature: 'insights' | 'forecast' | 'risks', context: FinancialContext) {
    const generatedAt = new Date().toISOString();

    if (feature === 'forecast') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return [{
            month: nextMonth.toLocaleString('default', { month: 'short', year: 'numeric' }),
            predictedExpenses: Math.round(context.monthlySpent || 0),
            predictedIncome: 0,
            riskLevel: spendRiskLevel(context.monthlySpent, context.currency),
            insights: ['Local forecast based on your latest cached spending summary.']
        }];
    }

    if (feature === 'risks') {
        const trialRisks = trialInsights(context.trialAlerts, 'risk', generatedAt);
        if (!context.transactionCount) return trialRisks;
        return context.healthScore && context.healthScore < 60
            ? [...trialRisks, {
                type: 'risk',
                title: 'Spending Health Needs Attention',
                message: 'Your local financial health score is low. Review top categories and reduce flexible spending this week.',
                confidence: 0.8,
                generatedAt
            }]
            : trialRisks;
    }

    return [{
        type: context.transactionCount ? 'tip' : 'tip',
        title: context.transactionCount ? 'Review Your Top Category' : 'Start Tracking',
        message: context.transactionCount
            ? `${context.topCategory} is your top category this month. Check whether a simple weekly cap would help.`
            : 'Add a few transactions so Cashly can generate personalized insights.',
        confidence: 1,
        generatedAt
    }];
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<{
    value?: T;
    timedOut: boolean;
    error?: string;
}> {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
        const value = await Promise.race([
            promise,
            new Promise<never>((_resolve, reject) => {
                timeout = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
            })
        ]);
        return { value, timedOut: false };
    } catch (error: any) {
        return { timedOut: error?.message?.includes('timed out after') || false, error: error?.message || String(error) };
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

async function getSummaryForAI(userId: string, force = false) {
    const result = await withTimeout(getFinancialSummary(userId, { force }), AI_CONTEXT_TIMEOUT_MS, 'financial context');
    if (result.value) {
        return {
            context: result.value,
            contextDegraded: false,
            contextError: null as string | null
        };
    }

    return {
        context: getEmptyFinancialContext(userId),
        contextDegraded: true,
        contextError: result.error || 'Financial context unavailable'
    };
}

async function generateFeaturePayload<T>(
    feature: 'insights' | 'forecast' | 'risks',
    context: FinancialContext,
    producer: () => Promise<T>,
    fallback: T,
    contextDegraded: boolean,
    contextError?: string | null,
    liveEnabled = true
) {
    if (!liveEnabled) {
        return {
            data: fallback,
            meta: {
                status: 'degraded',
                feature,
                fromFallback: true,
                aiUnavailable: true,
                contextDegraded,
                error: 'Live AI is disabled in Settings',
                generatedAt: new Date().toISOString()
            }
        };
    }

    const result = await withTimeout(producer(), AI_FEATURE_TIMEOUT_MS, `AI ${feature}`);
    const fromFallback = !result.value || contextDegraded;
    const aiUnavailable = !openRouterService.isConfigured() || !result.value;

    return {
        data: result.value || fallback,
        meta: {
            status: fromFallback ? 'degraded' : 'ready',
            feature,
            fromFallback,
            aiUnavailable,
            contextDegraded,
            error: result.error || contextError || openRouterService.getConfigurationError(),
            generatedAt: new Date().toISOString()
        }
    };
}

function getFallbackChatReply(message: string, context: {
    monthlySpent?: number;
    weeklySpent?: number;
    transactions?: number;
    goals?: number;
    budgets?: number;
    currency?: string;
}) {
    const hasData = (context.transactions || 0) > 0 || (context.goals || 0) > 0 || (context.budgets || 0) > 0;

    if (!hasData) {
        return `Hey there! 👋 I'm having a brief connection issue with my AI brain, but I'm still here to help. Start by adding some transactions and I'll be able to give you personalized financial advice. You can track spending, set budgets, and create savings goals!`;
    }

    const monthly = formatMoneyAmount(context.monthlySpent || 0, context.currency);
    const weekly = formatMoneyAmount(context.weeklySpent || 0, context.currency);
    const txCount = context.transactions || 0;

    return `Hey! 👋 I'm working with a quick local summary right now. Here's what I see: you've spent ${monthly} this month and ${weekly} this week across ${txCount} transactions. Try asking me something specific like "how can I save money?" or "show my budget status" and I'll do my best to help! 💪`;
}

// Calls the model, then checks every figure/date in the reply against the prompt. One retry, then strip what can't be verified.
async function completeGrounded(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string,
    options: Parameters<typeof openRouterService.chatCompletion>[1]
) {
    const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history,
        { role: 'user' as const, content: userMessage }
    ];
    const first = await openRouterService.chatCompletion(messages, options);
    const bad = findUnverified(first.content, systemPrompt);
    if (!bad.length) return { content: first.content, model: first.model, grounding: 'verified' as const };

    console.warn('AI reply had unverified figures, retrying:', bad.join(', '));
    try {
        const retry = await openRouterService.chatCompletion([
            ...messages,
            { role: 'assistant' as const, content: first.content },
            { role: 'user' as const, content: `Your last answer used figures that are not in my data: ${bad.join(', ')}. Answer again using only figures from USER FINANCIAL DATA, or say you do not have them.` }
        ], options);
        const stillBad = findUnverified(retry.content, systemPrompt);
        if (!stillBad.length) return { content: retry.content, model: retry.model, grounding: 'corrected' as const };
        const cleaned = stripUnverified(retry.content, stillBad);
        return { content: cleaned || "I don't have a verified figure for that in your data yet.", model: retry.model, grounding: 'trimmed' as const };
    } catch {
        const cleaned = stripUnverified(first.content, bad);
        return { content: cleaned || "I don't have a verified figure for that in your data yet.", model: first.model, grounding: 'trimmed' as const };
    }
}

// Parses a spoken command into an intent. The user's words go in a user message, never inside the instructions.
async function detectVoiceIntent(message: string, userId: string): Promise<string> {
    const detectPrompt = `You are an intent parser for a financial assistant. Extract the user's intent and parameters from their voice command.

SUPPORTED ACTIONS:
1. add_goal - Create a savings goal (needs: name, target amount)
2. add_reminder - Create a bill reminder (needs: title, amount, due_date)
3. add_transaction - Log a transaction (needs: description, amount, category, type expense/income)
4. none - Just a question/conversation (no action needed)

RESPOND ONLY with valid JSON in this exact format:
{
  "action": "add_goal|add_reminder|add_transaction|none",
  "params": {
    "name": "goal name",
    "target": 50000,
    "title": "reminder title",
    "amount": 1000,
    "due_date": "2025-01-15",
    "description": "transaction desc",
    "category": "Food & Dining",
    "type": "expense"
  },
  "confirmation": "Natural language confirmation to speak to user"
}

If required fields are missing, use action "none". Do not invent amounts.`;
    const intentResponse = await openRouterService.chatCompletion(
        [
            { role: 'system', content: detectPrompt },
            { role: 'user', content: message }
        ],
        {
            temperature: 0.2,
            maxTokens: 300,
            useCase: 'voice',
            responseFormat: { type: 'json_object' },
            user: userId
        }
    );
    return intentResponse.content || '{"action":"none"}';
}

function describeProposal(intent: { action: string; params: Record<string, any> }, currency: string, name = '') {
    const money = (value: number) => formatMoneyAmount(value, currency);
    const who = name ? ` ${name}` : '';
    if (intent.action === 'add_goal') return `Create savings goal "${intent.params.name}" with a target of ${money(intent.params.target)}? Please confirm${who}.`;
    if (intent.action === 'add_reminder') return `Set a reminder "${intent.params.title}"${intent.params.amount ? ` for ${money(intent.params.amount)}` : ''} due ${intent.params.due_date}? Please confirm${who}.`;
    return `Record a ${intent.params.type} of ${money(intent.params.amount)} for "${intent.params.description}" (${intent.params.category})? Please confirm${who}.`;
}

// ==================== ROUTES ====================

/**
 * GET /api/ai/insights
 * Get AI-generated financial insights (cached)
 */
router.get('/insights', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        const aiSettings = await getUserSettings(userId);
        // Check cache first
        const cached = await cacheService.getCachedInsights(userId);
        if (cached && aiSettings.aiLiveEnabled) {
            return res.json({
                insights: cached,
                fromCache: true,
                generatedAt: (cached as any)[0]?.generatedAt,
                status: 'ready',
                aiUnavailable: false,
                fromFallback: false
            });
        }

        const { context, contextDegraded, contextError } = await getSummaryForAI(userId);
        const result = await generateFeaturePayload(
            'insights',
            context,
            () => openRouterService.generateInsights(context),
            getFeatureFallback('insights', context) as any,
            contextDegraded,
            contextError,
            aiSettings.aiLiveEnabled
        );
        const insights = result.data;

        if (!result.meta.fromFallback) {
            await cacheService.setCachedInsights(userId, insights);
        }

        res.json({
            insights,
            fromCache: false,
            ...result.meta
        });
    } catch (error: any) {
        console.error('AI insights error:', error.message);
        const fallback = getFeatureFallback('insights', getEmptyFinancialContext(userId));
        res.json({
            insights: fallback,
            fromCache: false,
            generatedAt: new Date().toISOString(),
            status: 'degraded',
            fromFallback: true,
            aiUnavailable: true,
            error: 'Failed to generate insights'
        });
    }
});

/**
 * GET /api/ai/forecast
 * Get AI-generated spending forecast (cached)
 */
router.get('/forecast', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        const aiSettings = await getUserSettings(userId);
        // Check cache first
        const cached = await cacheService.getCachedForecast(userId);
        if (cached && aiSettings.aiLiveEnabled) {
            return res.json({ forecast: cached, fromCache: true });
        }

        const { context, contextDegraded, contextError } = await getSummaryForAI(userId);
        const result = await generateFeaturePayload(
            'forecast',
            context,
            () => openRouterService.generateForecast(context),
            getFeatureFallback('forecast', context) as any,
            contextDegraded,
            contextError,
            aiSettings.aiLiveEnabled
        );
        const forecast = result.data;

        if (!result.meta.fromFallback) {
            await cacheService.setCachedForecast(userId, forecast);
        }

        res.json({ forecast, fromCache: false, ...result.meta });
    } catch (error: any) {
        console.error('AI forecast error:', error.message);
        res.json({
            forecast: getFeatureFallback('forecast', getEmptyFinancialContext(userId)),
            fromCache: false,
            status: 'degraded',
            fromFallback: true,
            aiUnavailable: true,
            error: 'Failed to generate forecast'
        });
    }
});

/**
 * GET /api/ai/risks
 * Get AI-generated risk alerts (cached)
 */
router.get('/risks', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        const aiSettings = await getUserSettings(userId);
        // Check cache first
        const cached = await cacheService.getCachedRisks(userId);
        if (cached && aiSettings.aiLiveEnabled) {
            return res.json({ risks: cached, fromCache: true });
        }

        const { context, contextDegraded, contextError } = await getSummaryForAI(userId);
        const result = await generateFeaturePayload(
            'risks',
            context,
            () => openRouterService.generateRiskAlerts(context),
            getFeatureFallback('risks', context) as any,
            contextDegraded,
            contextError,
            aiSettings.aiLiveEnabled
        );
        const risks = result.data;

        if (!result.meta.fromFallback) {
            await cacheService.setCachedRisks(userId, risks);
        }

        res.json({ risks, fromCache: false, ...result.meta });
    } catch (error: any) {
        console.error('AI risks error:', error.message);
        res.json({
            risks: getFeatureFallback('risks', getEmptyFinancialContext(userId)),
            fromCache: false,
            status: 'degraded',
            fromFallback: true,
            aiUnavailable: true,
            error: 'Failed to analyze risks'
        });
    }
});

/**
 * POST /api/ai/refresh
 * Force refresh all AI data (invalidate cache)
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        // Invalidate all cached data
        await cacheService.invalidateUserCache(userId);

        const aiSettings = await getUserSettings(userId);
        const { context, contextDegraded, contextError } = await getSummaryForAI(userId, true);
        const [insightsPayload, forecastPayload, risksPayload] = await Promise.all([
            generateFeaturePayload(
                'insights',
                context,
                () => openRouterService.generateInsights(context),
                getFeatureFallback('insights', context) as any,
                contextDegraded,
                contextError,
                aiSettings.aiLiveEnabled
            ),
            generateFeaturePayload(
                'forecast',
                context,
                () => openRouterService.generateForecast(context),
                getFeatureFallback('forecast', context) as any,
                contextDegraded,
                contextError,
                aiSettings.aiLiveEnabled
            ),
            generateFeaturePayload(
                'risks',
                context,
                () => openRouterService.generateRiskAlerts(context),
                getFeatureFallback('risks', context) as any,
                contextDegraded,
                contextError,
                aiSettings.aiLiveEnabled
            )
        ]);

        const insights = insightsPayload.data;
        const forecast = forecastPayload.data;
        const risks = risksPayload.data;

        // Cache all results
        await Promise.all([
            !insightsPayload.meta.fromFallback ? cacheService.setCachedInsights(userId, insights) : Promise.resolve(false),
            !forecastPayload.meta.fromFallback ? cacheService.setCachedForecast(userId, forecast) : Promise.resolve(false),
            !risksPayload.meta.fromFallback ? cacheService.setCachedRisks(userId, risks) : Promise.resolve(false)
        ]);

        res.json({
            message: 'AI data refreshed',
            insights,
            forecast,
            risks,
            status: [insightsPayload.meta, forecastPayload.meta, risksPayload.meta].some(meta => meta.status === 'degraded')
                ? 'degraded'
                : 'ready',
            meta: {
                insights: insightsPayload.meta,
                forecast: forecastPayload.meta,
                risks: risksPayload.meta
            }
        });
    } catch (error: any) {
        console.error('AI refresh error:', error.message);
        res.status(500).json({ error: 'Failed to refresh AI data' });
    }
});

/**
 * POST /api/ai/cache/invalidate
 * Lightweight invalidation used after direct Supabase writes from the frontend.
 */
router.post('/cache/invalidate', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        await cacheService.invalidateUserCache(userId);
        res.json({
            success: true,
            invalidatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('AI cache invalidation error:', error.message);
        res.status(500).json({ error: 'Failed to invalidate AI cache' });
    }
});

/**
 * GET /api/ai/status
 * Check AI service status
 */
router.get('/status', async (_req: Request, res: Response) => {
    try {
        const cacheStats = await cacheService.getCacheStats();
        res.json({
            groq: {
                status: isGroqConfigured() ? 'ok' : 'not_configured',
                error: getGroqConfigurationError(),
                model: getGroqModel('fastChat'),
            },
            openrouter: {
                status: openRouterService.isOpenRouterConfigured() ? 'ok' : 'not_configured',
                error: openRouterService.getOpenRouterConfigurationError(),
                model: openRouterService.getModelName(),
                models: openRouterService.getModelMap()
            },
            redis: cacheStats
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/chat
 * AI chatbot with FULL financial context
 * SECURITY: Rate limited to 20 req/min, input sanitized
 */
router.post('/chat', aiChatLimiter, async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);
    const { message, context, useCase, clientContext } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    // SECURITY: Validate and sanitize user input
    const validation = sanitizeChatMessage(message);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid message' });
    }
    const sanitizedMessage = validation.sanitized;

    try {
        const aiSettings = await getUserSettings(userId);
        // 1. Get previous chat history from Redis
        const history = aiSettings.aiMemoryEnabled ? await cacheService.getChatHistory(userId) : [];

        const snapshot = await getFinancialSnapshot(userId);
        const clientContextText = typeof clientContext === 'string' ? clientContext : '';
        const systemPrompt = composeChatSystemPrompt(
            buildCashlySystemPrompt(snapshot, { includePendingCandidates: aiSettings.aiIncludePendingCandidates }),
            clientContextText
        );

        let reply: string;
        const chatUseCase = getChatUseCase(context, useCase);
        let model = openRouterService.getModelName(chatUseCase);
        let aiUnavailable = false;
        let grounding: string | undefined;

        try {
            if (!aiSettings.aiLiveEnabled) {
                throw new Error('Live AI is disabled in Settings');
            }

            const chatHistory = history
                .filter((item: any) => item?.role === 'user' || item?.role === 'assistant')
                .map((item: any) => ({ role: item.role, content: String(item.content || '') }));

            const response = await completeGrounded(systemPrompt, chatHistory, sanitizedMessage, {
                model,
                useCase: chatUseCase,
                temperature: 0.5,
                maxTokens: 500,
                user: userId
            });

            reply = response.content;
            model = response.model;
            grounding = response.grounding;
        } catch (aiError: any) {
            aiUnavailable = true;
            model = 'local-fallback';
            console.error('AI chat provider error:', aiError.message);
            reply = getFallbackChatReply(sanitizedMessage, {
                monthlySpent: snapshot.summary.monthlySpent,
                weeklySpent: snapshot.summary.weeklySpent,
                transactions: snapshot.transactions.length,
                goals: snapshot.goals.length,
                budgets: snapshot.budgets.length,
                currency: snapshot.summary.currency
            });
        }

        // 2. Save current interaction to chat history when AI memory is enabled.
        if (aiSettings.aiMemoryEnabled) {
            await cacheService.appendChatHistory(userId, { role: 'user', content: sanitizedMessage });
            await cacheService.appendChatHistory(userId, { role: 'assistant', content: reply });
        }

        res.json({
            reply,
            model,
            fromBackend: true,
            aiUnavailable,
            grounding,
            contextLoaded: {
                transactions: snapshot.transactions.length,
                subscriptions: snapshot.subscriptions.length,
                goals: snapshot.goals.length,
                budgets: snapshot.budgets.length,
                reminders: snapshot.upcomingBills.length,
                pendingCandidates: snapshot.pendingCandidates.length
            },
            historyLength: aiSettings.aiMemoryEnabled ? history.length + 2 : 0
        });
    } catch (error: any) {
        console.error('AI chat error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

/**
 * POST /api/ai/chat/fast
 * FAST AI chatbot with MEMORY - accepts pre-built context from frontend cache
 * No database fetching = instant responses, but includes conversation history
 */
router.post('/chat/fast', aiChatLimiter, async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);
    const { message, context } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    if (!message) {
        return res.status(400).json({ error: 'Message required' });
    }

    const validation = sanitizeChatMessage(message);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid message' });
    }
    const sanitizedMessage = validation.sanitized;

    const startTime = Date.now();

    try {
        const aiSettings = await getUserSettings(userId);
        const history = aiSettings.aiMemoryEnabled ? await cacheService.getChatHistory(userId) : [];
        const snapshotResult = await withTimeout(
            getFinancialSnapshot(userId),
            Math.min(AI_CONTEXT_TIMEOUT_MS, 2000),
            'financial snapshot'
        );
        const snapshot = snapshotResult.value;
        const groundedPrompt = snapshot
            ? buildCashlySystemPrompt(snapshot, { includePendingCandidates: aiSettings.aiIncludePendingCandidates })
            : '';
        const systemPrompt = composeChatSystemPrompt(groundedPrompt || 'You are Cashly AI. Financial data is still loading; do not invent totals.', String(context || ''));

        let reply: string;
        let model = openRouterService.getModelName('fastChat');
        let aiUnavailable = false;
        let grounding: string | undefined;

        try {
            if (!aiSettings.aiLiveEnabled) {
                throw new Error('Live AI is disabled in Settings');
            }

            const chatHistory = history
                .filter((item: any) => item?.role === 'user' || item?.role === 'assistant')
                .map((item: any) => ({ role: item.role as 'user' | 'assistant', content: String(item.content || '') }));

            const response = await completeGrounded(systemPrompt, chatHistory, sanitizedMessage, {
                model,
                useCase: 'fastChat',
                temperature: 0.5,
                maxTokens: 500,
                user: userId
            });

            reply = response.content;
            model = response.model;
            grounding = response.grounding;
        } catch (aiError: any) {
            aiUnavailable = true;
            model = 'local-fallback';
            console.error('AI fast chat provider error:', aiError.message);
            reply = getFallbackChatReply(sanitizedMessage, {
                monthlySpent: snapshot?.summary.monthlySpent || 0,
                weeklySpent: snapshot?.summary.weeklySpent || 0,
                transactions: snapshot?.transactions.length || 0,
                goals: snapshot?.goals.length || 0,
                budgets: snapshot?.budgets.length || 0,
                currency: snapshot?.summary.currency
            });
        }

        if (aiSettings.aiMemoryEnabled) {
            await cacheService.appendChatHistory(userId, { role: 'user', content: sanitizedMessage });
            await cacheService.appendChatHistory(userId, { role: 'assistant', content: reply });
        }

        const responseTime = Date.now() - startTime;

        res.json({
            reply,
            model,
            fromBackend: true,
            aiUnavailable,
            grounding,
            fast: true,
            responseTime,
            historyLength: aiSettings.aiMemoryEnabled ? history.length + 2 : 0,
            contextLoaded: snapshot ? {
                transactions: snapshot.transactions.length,
                pendingCandidates: snapshot.pendingCandidates.length
            } : undefined
        });
    } catch (error: any) {
        console.error('AI fast chat error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

/**
 * POST /api/ai/chat/clear
 * Clear AI chatbot history for the user
 */
router.post('/chat/clear', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        await cacheService.clearChatHistory(userId);
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error: any) {
        console.error('Clear context error:', error.message);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

/**
 * POST /api/ai/voice-action
 * Execute actions via voice commands (add goals, reminders, transactions)
 */
router.post('/voice-action', aiActionLimiter, async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);
    const { message, userName, confirm, intent: proposed, confirmId } = req.body;
    const confirmed = confirm === true;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    if (!message && !confirmed) {
        return res.status(400).json({ error: 'Message required' });
    }

    let sanitizedVoiceMessage = '';
    if (!confirmed) {
        const validation = sanitizeChatMessage(message);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error || 'Invalid message' });
        }
        sanitizedVoiceMessage = validation.sanitized;
    }

    try {
        const aiSettings = await getUserSettings(userId);
        if (!aiSettings.aiLiveEnabled) {
            return res.json({
                action: 'none',
                params: {},
                confirmation: 'Live AI is disabled in Settings. Turn it on to use voice actions.',
                actionResult: null,
                success: false
            });
        }

        // Confirmed calls skip the model: the validated proposal the user approved is what runs.
        const intentContent = confirmed
            ? JSON.stringify({ action: proposed?.action, params: proposed?.params || {}, confirmation: '' })
            : await detectVoiceIntent(sanitizedVoiceMessage, userId);
        const parsed = parseVoiceIntent(intentContent);
        const validated = validateVoiceAction(parsed);
        const intent = validated.intent;

        if (!validated.ok) {
            return res.json({
                action: 'none',
                params: {},
                confirmation: validated.error || "I didn't quite understand. Could you rephrase that?",
                actionResult: null,
                success: false
            });
        }

        const displayName = userName ? String(userName).slice(0, 40) : '';

        // Money-moving writes never run straight from a model's reading of speech: propose, then wait for confirm.
        if (!confirmed && intent.action !== 'none') {
            return res.json({
                action: intent.action,
                params: intent.params,
                confirmation: describeProposal(intent, aiSettings.currency, displayName),
                needsConfirmation: true,
                actionResult: null,
                success: false
            });
        }
        if (confirmed && intent.action === 'none') {
            return res.json({ action: 'none', params: {}, confirmation: 'Nothing to confirm.', actionResult: null, success: false });
        }

        // The same confirmation tapped twice must not create the record twice.
        const doneKey = confirmed && confirmId ? `voice:done:${userId}:${String(confirmId).slice(0, 64)}` : null;
        if (doneKey && await cacheService.getCache(doneKey)) {
            return res.json({ action: intent.action, params: intent.params, confirmation: 'Already done.', actionResult: null, success: true, duplicate: true });
        }

        let actionResult = null;

        if (intent.action === 'add_goal') {
            const { data, error } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    name: intent.params.name,
                    target: intent.params.target,
                    saved: 0,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (!error && data) {
                actionResult = data;
                if (aiSettings.aiAutoRefresh) await cacheService.invalidateUserCache(userId);
                intent.confirmation = `Done ${displayName}! I've created a new savings goal: "${intent.params.name}" with a target of ${formatMoneyAmount(intent.params.target, aiSettings.currency)}.`;
            } else {
                intent.confirmation = 'I had trouble creating that goal. Please try again.';
            }
        } else if (intent.action === 'add_reminder') {
            const { data, error } = await supabase
                .from('bills')
                .insert({
                    user_id: userId,
                    title: intent.params.title,
                    amount: intent.params.amount || 0,
                    due_date: intent.params.due_date,
                    is_paid: false,
                    category: 'Bills'
                })
                .select()
                .single();

            if (!error && data) {
                actionResult = data;
                if (aiSettings.aiAutoRefresh) await cacheService.invalidateUserCache(userId);
                intent.confirmation = `Got it ${displayName}! I've set a reminder for "${intent.params.title}"${intent.params.amount ? ` of ${formatMoneyAmount(intent.params.amount, aiSettings.currency)}` : ''} due on ${new Date(intent.params.due_date).toLocaleDateString()}.`;
            } else {
                intent.confirmation = "I couldn't create that reminder. Please try again.";
            }
        } else if (intent.action === 'add_transaction') {
            try {
                actionResult = await createMoneyTransaction({
                    user_id: userId,
                    description: intent.params.description,
                    amount: intent.params.amount,
                    type: intent.params.type,
                    category: intent.params.category,
                    date: new Date().toISOString().split('T')[0],
                    source: 'voice-action'
                });
                if (aiSettings.aiAutoRefresh) await cacheService.invalidateUserCache(userId);
                intent.confirmation = `Recorded ${displayName}! I've added a ${intent.params.type} of ${formatMoneyAmount(intent.params.amount, aiSettings.currency)} for "${intent.params.description}".`;
            } catch (error) {
                console.error('Transaction insert error:', error);
                intent.confirmation = "I couldn't log that transaction. Please try again.";
            }
        }

        if (doneKey && actionResult) await cacheService.setCache(doneKey, true, 120);

        res.json({
            action: intent.action,
            params: intent.params,
            confirmation: intent.confirmation,
            actionResult,
            success: !!actionResult
        });

    } catch (error: any) {
        console.error('Voice action error:', error.message);
        res.status(500).json({ error: 'Failed to process voice action' });
    }
});

export default router;

