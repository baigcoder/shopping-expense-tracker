// AI Routes - Endpoints for AI insights, forecasts, and risk alerts
// With Redis caching for instant responses
// SECURITY: Input sanitization and rate limiting applied

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import openRouterService, { FinancialContext, OpenRouterUseCase } from '../services/openRouterService';
import cacheService from '../services/redisCacheService';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sanitizeChatMessage } from '../utils/security';
import { supabase } from '../config/supabase.js';
import { buildCashlySystemPrompt, getFinancialSnapshot, getFinancialSummary } from '../services/financialContextService.js';
import { createMoneyTransaction } from '../services/transactionDomainService.js';
import { getUserSettings } from '../services/settingsService.js';

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
        monthlySubCost: 0
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
            riskLevel: context.monthlySpent > 50000 ? 'high' : 'medium',
            insights: ['Local forecast based on your latest cached spending summary.']
        }];
    }

    if (feature === 'risks') {
        if (!context.transactionCount) return [];
        return context.healthScore && context.healthScore < 60
            ? [{
                type: 'risk',
                title: 'Spending Health Needs Attention',
                message: 'Your local financial health score is low. Review top categories and reduce flexible spending this week.',
                confidence: 0.8,
                generatedAt
            }]
            : [];
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
}) {
    const hasData = (context.transactions || 0) > 0 || (context.goals || 0) > 0 || (context.budgets || 0) > 0;

    if (!hasData) {
        return `Hey there! 👋 I'm having a brief connection issue with my AI brain, but I'm still here to help. Start by adding some transactions and I'll be able to give you personalized financial advice. You can track spending, set budgets, and create savings goals!`;
    }

    const monthly = (context.monthlySpent || 0).toLocaleString();
    const weekly = (context.weeklySpent || 0).toLocaleString();
    const txCount = context.transactions || 0;

    return `Hey! 👋 I'm working with a quick local summary right now. Here's what I see: you've spent Rs ${monthly} this month and Rs ${weekly} this week across ${txCount} transactions. Try asking me something specific like "how can I save money?" or "show my budget status" and I'll do my best to help! 💪`;
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
            openrouter: {
                status: openRouterService.isConfigured() ? 'ok' : 'not_configured',
                error: openRouterService.getConfigurationError(),
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

        const snapshot = await getFinancialSnapshot(userId, {
            includePendingCandidates: aiSettings.aiIncludePendingCandidates,
        });

        const clientContextText = typeof clientContext === 'string' ? clientContext.trim().slice(0, 12000) : '';
        const systemPrompt = clientContextText
            ? `You are "Cashly AI", a friendly financial assistant. Use the user's current client-provided financial data below as the freshest source of truth.\n\n${clientContextText}`
            : buildCashlySystemPrompt(snapshot);

        let reply: string;
        const chatUseCase = getChatUseCase(context, useCase);
        let model = openRouterService.getModelName(chatUseCase);
        let aiUnavailable = false;

        try {
            if (!aiSettings.aiLiveEnabled) {
                throw new Error('Live AI is disabled in Settings');
            }

            const chatHistory = history
                .filter((item: any) => item?.role === 'user' || item?.role === 'assistant')
                .map((item: any) => ({ role: item.role, content: String(item.content || '') }));

            const response = await openRouterService.chatCompletion(
                [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory,
                    { role: 'user', content: sanitizedMessage }
                ],
                {
                    model,
                    useCase: chatUseCase,
                    temperature: 0.7,
                    maxTokens: 500,
                    user: userId
                }
            );

            reply = response.content;
            model = response.model;
        } catch (aiError: any) {
            aiUnavailable = true;
            model = 'local-fallback';
            console.error('AI chat provider error:', aiError.message);
            reply = getFallbackChatReply(sanitizedMessage, {
                monthlySpent: snapshot.summary.monthlySpent,
                weeklySpent: snapshot.summary.weeklySpent,
                transactions: snapshot.transactions.length,
                goals: snapshot.goals.length,
                budgets: snapshot.budgets.length
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

    if (!context) {
        return res.status(400).json({ error: 'Context required - use /chat endpoint for auto-fetch' });
    }

    const validation = sanitizeChatMessage(message);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid message' });
    }
    const sanitizedMessage = validation.sanitized;
    const sanitizedContext = String(context).slice(0, 12000);

    const startTime = Date.now();

    try {
        const aiSettings = await getUserSettings(userId);

        // Load chat history for memory/context continuity
        const history = aiSettings.aiMemoryEnabled ? await cacheService.getChatHistory(userId) : [];

        // Build system prompt from provided context
        const systemPrompt = `You are "Cashly AI", a smart and friendly financial assistant for the Cashly expense tracking app. You give genuinely helpful, personalized financial advice based on the user's REAL spending data.

PERSONALITY:
- Friendly, warm, and encouraging but always honest
- Use emojis naturally (1-2 per response) to keep things engaging
- Speak in a conversational tone, like a knowledgeable friend

RULES:
- Keep responses concise (3-5 sentences max unless the user asks for details)
- ALWAYS reference the user's actual data below to personalize your advice
- Be specific: mention real amounts, categories, and trends from their data
- If the user asks about something you have data for, give precise numbers
- DO NOT use markdown formatting (no **, no #, no bullet points with -)
- If the user references something from earlier in the conversation, use the chat history to stay contextual

${sanitizedContext}`;

        let reply: string;
        let model = openRouterService.getModelName('fastChat');
        let aiUnavailable = false;

        const contextData = await cacheService.getCachedUserSnapshot(userId) || {};
        
        try {
            if (!aiSettings.aiLiveEnabled) {
                throw new Error('Live AI is disabled in Settings');
            }

            // Include conversation history for contextual awareness
            const chatHistory = history
                .filter((item: any) => item?.role === 'user' || item?.role === 'assistant')
                .map((item: any) => ({ role: item.role as 'user' | 'assistant', content: String(item.content || '') }));

            const response = await openRouterService.chatCompletion(
                [
                    { role: 'system', content: systemPrompt },
                    ...chatHistory,
                    { role: 'user', content: sanitizedMessage }
                ],
                {
                    model,
                    useCase: 'fastChat',
                    temperature: 0.7,
                    maxTokens: 500,
                    user: userId
                }
            );

            reply = response.content;
            model = response.model;
        } catch (aiError: any) {
            aiUnavailable = true;
            model = 'local-fallback';
            console.error('AI fast chat provider error:', aiError.message);
            
            // Provide accurate local data in fallback
            const typedContextData = contextData as any;
            reply = getFallbackChatReply(sanitizedMessage, {
                monthlySpent: typedContextData?.monthlySpent || 0,
                weeklySpent: typedContextData?.weeklySpent || 0,
                transactions: typedContextData?.transactionCount || 0,
                goals: typedContextData?.goalCount || 0,
                budgets: typedContextData?.budgetCount || 0
            });
        }

        // Save to chat history for memory continuity
        if (aiSettings.aiMemoryEnabled) {
            await cacheService.appendChatHistory(userId, { role: 'user', content: sanitizedMessage });
            await cacheService.appendChatHistory(userId, { role: 'assistant', content: reply });
        }

        const responseTime = Date.now() - startTime;

        console.log(`⚡ Fast AI response in ${responseTime}ms (model: ${model})`);

        res.json({
            reply,
            model,
            fromBackend: true,
            aiUnavailable,
            fast: true,
            responseTime,
            historyLength: aiSettings.aiMemoryEnabled ? history.length + 2 : 0
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
router.post('/voice-action', async (req: AuthRequest, res: Response) => {
    const userId = getAIUserId(req);
    const { message, userName } = req.body;

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
    const sanitizedVoiceMessage = validation.sanitized;

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

        const detectPrompt = `You are an intent parser for a financial assistant. Extract the user's intent and parameters from their voice command.

SUPPORTED ACTIONS:
1. add_goal - Create a savings goal (needs: name, target amount)
2. add_reminder - Create a bill reminder (needs: title, amount, due_date)
3. add_transaction - Log a transaction (needs: description, amount, category, type expense/income)
4. none - Just a question/conversation (no action needed)

USER COMMAND: "${sanitizedVoiceMessage}"

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
    "category": "Food",
    "type": "expense"
  },
  "confirmation": "Natural language confirmation to speak to user"
}

If action is "none", params can be empty and confirmation should be a helpful response to their question.`;

        const intentResponse = await openRouterService.chatCompletion(
            [
                { role: 'system', content: detectPrompt }
            ],
            {
                temperature: 0.3,
                maxTokens: 300,
                useCase: 'voice',
                responseFormat: { type: 'json_object' },
                user: userId
            }
        );

        const intentText = intentResponse.content || '{"action":"none"}';

        // Extract JSON from response
        let intent;
        try {
            const jsonMatch = intentText.match(/\{[\s\S]*\}/);
            intent = JSON.parse(jsonMatch ? jsonMatch[0] : '{"action":"none"}');
        } catch (e) {
            intent = { action: 'none', params: {}, confirmation: "I didn't quite understand. Could you rephrase that?" };
        }

        console.log('🎤 Voice action detected:', intent.action, intent.params);

        let actionResult = null;
        const displayName = userName ? `Sir ${userName}` : '';

        // Execute the action
        if (intent.action === 'add_goal' && intent.params.name && intent.params.target) {
            const { data, error } = await supabase
                .from('goals')
                .insert({
                    user_id: userId,
                    name: intent.params.name,
                    target: intent.params.target,
                    saved: 0,
                    deadline: intent.params.deadline || null,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (!error && data) {
                actionResult = data;
                if (aiSettings.aiAutoRefresh) await cacheService.invalidateUserCache(userId);
                intent.confirmation = `Done ${displayName}! I've created a new savings goal: "${intent.params.name}" with a target of Rs ${intent.params.target.toLocaleString()}. You're now tracking this goal!`;
            } else {
                intent.confirmation = "I had trouble creating that goal. Please try again.";
            }
        } else if (intent.action === 'add_reminder' && intent.params.title) {
            const dueDate = intent.params.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('bills')
                .insert({
                    user_id: userId,
                    title: intent.params.title,
                    amount: intent.params.amount || 0,
                    due_date: dueDate,
                    is_paid: false,
                    category: 'Bills'
                })
                .select()
                .single();

            if (!error && data) {
                actionResult = data;
                if (aiSettings.aiAutoRefresh) await cacheService.invalidateUserCache(userId);
                intent.confirmation = `Got it ${displayName}! I've set a reminder for "${intent.params.title}"${intent.params.amount ? ` of Rs ${intent.params.amount.toLocaleString()}` : ''} due on ${new Date(dueDate).toLocaleDateString()}.`;
            } else {
                console.error('Bill insert error:', error);
                intent.confirmation = "I couldn't create that reminder. Please try again.";
            }
        } else if (intent.action === 'add_transaction' && intent.params.amount) {
            try {
                actionResult = await createMoneyTransaction({
                    user_id: userId,
                    description: intent.params.description || 'Voice transaction',
                    amount: intent.params.amount,
                    type: intent.params.type || 'expense',
                    category: intent.params.category || 'Other',
                    date: new Date().toISOString().split('T')[0],
                    source: 'voice-action'
                });
                const type = intent.params.type === 'income' ? 'income' : 'expense';
                intent.confirmation = `Recorded ${displayName}! I've added a ${type} of Rs ${intent.params.amount.toLocaleString()} for "${intent.params.description || intent.params.category}".`;
            } catch (error) {
                console.error('Transaction insert error:', error);
                intent.confirmation = "I couldn't log that transaction. Please try again.";
            }
        }

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

