// AI Routes - Endpoints for AI insights, forecasts, and risk alerts
// With Redis caching for instant responses
// SECURITY: Input sanitization and rate limiting applied

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import groqService, { FinancialContext } from '../services/groqService';
import cacheService from '../services/redisCacheService';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sanitizeChatMessage, sanitizeContext } from '../utils/security';

const router = Router();

// Apply auth middleware to ALL AI routes
router.use(authMiddleware);

// Rate limiting specifically for AI chat endpoints (stricter than global)
const aiChatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per IP
    message: { error: 'Too many AI requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Supabase client for fetching user data
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Build financial context from user's transaction data
 */
async function buildUserContext(userId: string): Promise<FinancialContext> {
    // Check cache first
    const cached = await cacheService.getCachedUserContext(userId);
    if (cached) return cached as FinancialContext;

    // Fetch from Supabase
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', monthStart.toISOString())
        .order('date', { ascending: false });

    const expenses = (transactions || []).filter(t => t.type === 'expense');
    const weeklyExpenses = expenses.filter(t => new Date(t.date) >= weekStart);

    // Calculate totals
    const monthlySpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const weeklySpent = weeklyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Find top category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => {
        const cat = t.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
    });
    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0] || ['Other', 0];

    const context = {
        userId,
        monthlySpent: Math.round(monthlySpent),
        weeklySpent: Math.round(weeklySpent),
        topCategory: topCategory[0],
        topCategoryAmount: Math.round(topCategory[1]),
        transactionCount: expenses.length,
        healthScore: calculateHealthScore(monthlySpent, expenses.length)
    };

    // Cache context
    await cacheService.setCachedUserContext(userId, context);
    return context;
}

/**
 * Simple health score calculation
 */
function calculateHealthScore(monthlySpent: number, txCount: number): number {
    // Base score
    let score = 70;

    // Penalize high spending
    if (monthlySpent > 100000) score -= 20;
    else if (monthlySpent > 50000) score -= 10;

    // Reward consistent tracking
    if (txCount > 20) score += 10;
    else if (txCount > 10) score += 5;

    return Math.max(0, Math.min(100, score));
}

// ==================== ROUTES ====================

/**
 * GET /api/ai/insights
 * Get AI-generated financial insights (cached)
 */
router.get('/insights', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.supabaseId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        // Check cache first
        const cached = await cacheService.getCachedInsights(userId);
        if (cached) {
            return res.json({
                insights: cached,
                fromCache: true,
                generatedAt: (cached as any)[0]?.generatedAt
            });
        }

        // Generate fresh insights
        const context = await buildUserContext(userId);
        const insights = await groqService.generateInsights(context);

        // Cache results
        await cacheService.setCachedInsights(userId, insights);

        res.json({
            insights,
            fromCache: false,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('AI insights error:', error.message);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

/**
 * GET /api/ai/forecast
 * Get AI-generated spending forecast (cached)
 */
router.get('/forecast', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.supabaseId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        // Check cache first
        const cached = await cacheService.getCachedForecast(userId);
        if (cached) {
            return res.json({ forecast: cached, fromCache: true });
        }

        // Generate fresh forecast
        const context = await buildUserContext(userId);
        const forecast = await groqService.generateForecast(context);

        // Cache results
        await cacheService.setCachedForecast(userId, forecast);

        res.json({ forecast, fromCache: false });
    } catch (error: any) {
        console.error('AI forecast error:', error.message);
        res.status(500).json({ error: 'Failed to generate forecast' });
    }
});

/**
 * GET /api/ai/risks
 * Get AI-generated risk alerts (cached)
 */
router.get('/risks', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.supabaseId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        // Check cache first
        const cached = await cacheService.getCachedRisks(userId);
        if (cached) {
            return res.json({ risks: cached, fromCache: true });
        }

        // Generate fresh risk analysis
        const context = await buildUserContext(userId);
        const risks = await groqService.generateRiskAlerts(context);

        // Cache results
        await cacheService.setCachedRisks(userId, risks);

        res.json({ risks, fromCache: false });
    } catch (error: any) {
        console.error('AI risks error:', error.message);
        res.status(500).json({ error: 'Failed to analyze risks' });
    }
});

/**
 * POST /api/ai/refresh
 * Force refresh all AI data (invalidate cache)
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.supabaseId;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    try {
        // Invalidate all cached data
        await cacheService.invalidateUserCache(userId);

        // Pre-generate new data
        const context = await buildUserContext(userId);
        const [insights, forecast, risks] = await Promise.all([
            groqService.generateInsights(context),
            groqService.generateForecast(context),
            groqService.generateRiskAlerts(context)
        ]);

        // Cache all results
        await Promise.all([
            cacheService.setCachedInsights(userId, insights),
            cacheService.setCachedForecast(userId, forecast),
            cacheService.setCachedRisks(userId, risks)
        ]);

        res.json({
            message: 'AI data refreshed',
            insights,
            forecast,
            risks
        });
    } catch (error: any) {
        console.error('AI refresh error:', error.message);
        res.status(500).json({ error: 'Failed to refresh AI data' });
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
            groq: { status: 'ok', model: 'llama-3.1-8b-instant' },
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
    const userId = req.user?.supabaseId;
    const { message } = req.body;

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
        // 1. Get previous chat history from Redis
        const history = await cacheService.getChatHistory(userId);

        // Fetch ALL user financial data in parallel
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const next7Days = new Date();
        next7Days.setDate(next7Days.getDate() + 7);

        const [
            transactionsResult,
            subscriptionsResult,
            goalsResult,
            budgetsResult,
            remindersResult
        ] = await Promise.all([
            supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(100),
            supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId),
            supabase
                .from('goals')
                .select('*')
                .eq('user_id', userId),
            supabase
                .from('budgets')
                .select('*')
                .eq('user_id', userId),
            supabase
                .from('reminders')
                .select('*')
                .eq('user_id', userId)
                .gte('due_date', now.toISOString())
                .lte('due_date', next7Days.toISOString())
                .order('due_date', { ascending: true })
        ]);

        const transactions = transactionsResult.data || [];
        const subscriptions = subscriptionsResult.data || [];
        const goals = goalsResult.data || [];
        const budgets = budgetsResult.data || [];
        const reminders = remindersResult.data || [];

        // Calculate spending stats
        const expenses = transactions.filter(t => t.type === 'expense');
        const monthlyExpenses = expenses.filter(t => new Date(t.date) >= monthStart);
        const weeklyExpenses = expenses.filter(t => new Date(t.date) >= weekStart);

        const monthlySpent = monthlyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const weeklySpent = weeklyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Category breakdown
        const categoryTotals: Record<string, number> = {};
        monthlyExpenses.forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
        });
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0] || ['None', 0];

        // Format subscriptions
        const activeSubscriptions = subscriptions.filter(s => s.is_active !== false);
        const monthlySubCost = activeSubscriptions.reduce((sum, s) => {
            if (s.cycle === 'yearly') return sum + (s.price || 0) / 12;
            if (s.cycle === 'weekly') return sum + (s.price || 0) * 4;
            return sum + (s.price || 0);
        }, 0);
        const trialSubs = activeSubscriptions.filter(s => s.is_trial);

        const subscriptionsList = activeSubscriptions.slice(0, 8).map(s =>
            `• ${s.name}: Rs ${(s.price || 0).toLocaleString()}/${s.cycle || 'monthly'}${s.is_trial ? ' (TRIAL)' : ''}`
        ).join('\n');

        // Format goals
        const goalsList = goals.map(g => {
            const progress = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
            const remaining = Math.max(0, g.target - g.saved);
            return `• ${g.name}: ${progress}% done (Rs ${g.saved?.toLocaleString()} / Rs ${g.target?.toLocaleString()}, need Rs ${remaining.toLocaleString()} more)`;
        }).join('\n');

        // Format budgets with spending
        const budgetsList = budgets.map(b => {
            const spent = categoryTotals[b.category] || 0;
            const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
            const status = percent >= 100 ? '🔴 OVER' : percent >= 80 ? '🟡 CLOSE' : '🟢 OK';
            return `• ${b.category}: Rs ${spent.toLocaleString()} / Rs ${b.amount?.toLocaleString()} (${percent}%) ${status}`;
        }).join('\n');

        // Format upcoming bills/reminders
        const upcomingBills = reminders.slice(0, 5).map(r => {
            const dueDate = new Date(r.due_date);
            const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `• ${r.title}: Rs ${(r.amount || 0).toLocaleString()} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${dueDate.toLocaleDateString()})`;
        }).join('\n');

        // Format recent transactions
        const recentTx = transactions.slice(0, 10).map(t => {
            const type = t.type === 'expense' ? '💸' : '💰';
            return `${type} ${t.description || t.category}: Rs ${Math.abs(t.amount).toLocaleString()} (${t.category}, ${new Date(t.date).toLocaleDateString()})`;
        }).join('\n');

        // Build comprehensive system prompt
        const systemPrompt = `You are "Cashly AI", a friendly Gen-Z financial assistant. You speak casually, use emojis naturally, and give genuinely helpful financial advice based on the user's REAL data.

KEY RULES:
- Keep responses concise (3-5 sentences max unless asked for details)
- Reference the user's ACTUAL data below to personalize advice
- Be encouraging but honest about spending habits
- DO NOT use markdown formatting (no **, no #, no bullet points with -)
- Use emojis naturally to make responses engaging

═══════════════════════════════════════════════════════════
                    USER'S REAL FINANCIAL DATA
═══════════════════════════════════════════════════════════

📊 SPENDING OVERVIEW:
• This Month: Rs ${monthlySpent.toLocaleString()}
• This Week: Rs ${weeklySpent.toLocaleString()}
• Top Category: ${topCategory[0]} (Rs ${(topCategory[1] as number).toLocaleString()})
• Total Transactions: ${transactions.length}

📱 SUBSCRIPTIONS (${activeSubscriptions.length} active, ~Rs ${Math.round(monthlySubCost).toLocaleString()}/month):
${subscriptionsList || '• No subscriptions tracked yet'}
${trialSubs.length > 0 ? `⚠️ ${trialSubs.length} trial(s) active - watch for charges!` : ''}

🎯 SAVINGS GOALS (${goals.length} goals):
${goalsList || '• No goals set yet'}

📊 BUDGETS:
${budgetsList || '• No budgets set yet'}

📅 UPCOMING BILLS (Next 7 days):
${upcomingBills || '• No bills due soon'}

📝 RECENT TRANSACTIONS:
${recentTx || '• No recent transactions'}

CATEGORY SPENDING BREAKDOWN THIS MONTH:
${sortedCategories.slice(0, 5).map(([cat, amt]) => `• ${cat}: Rs ${(amt as number).toLocaleString()}`).join('\n') || '• No spending data'}
═══════════════════════════════════════════════════════════`;

        // Import Groq and generate response
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: sanitizedMessage }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const reply = response.choices[0]?.message?.content || 'I could not generate a response.';

        // 2. Save current interaction to chat history
        await cacheService.appendChatHistory(userId, { role: 'user', content: sanitizedMessage });
        await cacheService.appendChatHistory(userId, { role: 'assistant', content: reply });

        res.json({
            reply,
            model: 'llama-3.1-8b-instant',
            fromBackend: true,
            contextLoaded: {
                transactions: transactions.length,
                subscriptions: activeSubscriptions.length,
                goals: goals.length,
                budgets: budgets.length,
                reminders: reminders.length
            },
            historyLength: history.length + 2
        });
    } catch (error: any) {
        console.error('AI chat error:', error.message);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

/**
 * POST /api/ai/chat/fast
 * FAST AI chatbot - accepts pre-built context from frontend cache
 * No database fetching = instant responses
 */
router.post('/chat/fast', async (req: AuthRequest, res: Response) => {
    const userId = req.user?.supabaseId;
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

    const startTime = Date.now();

    try {
        // Build system prompt from provided context
        const systemPrompt = `You are "Cashly AI", a friendly Gen-Z financial assistant. You speak casually, use emojis naturally, and give genuinely helpful financial advice based on the user's REAL data.

KEY RULES:
- Keep responses concise (3-5 sentences max unless asked for details)
- Reference the user's ACTUAL data below to personalize advice
- Be encouraging but honest about spending habits
- DO NOT use markdown formatting (no **, no #, no bullet points with -)
- Use emojis naturally to make responses engaging

${context}`;

        // Import Groq and generate response
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const reply = response.choices[0]?.message?.content || 'I could not generate a response.';
        const responseTime = Date.now() - startTime;

        console.log(`⚡ Fast AI response in ${responseTime}ms`);

        res.json({
            reply,
            model: 'llama-3.1-8b-instant',
            fromBackend: true,
            fast: true,
            responseTime
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
    const userId = req.user?.supabaseId;

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
    const userId = req.user?.supabaseId;
    const { message, userName } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    if (!message) {
        return res.status(400).json({ error: 'Message required' });
    }

    try {
        // Use AI to detect intent and extract parameters
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

        const detectPrompt = `You are an intent parser for a financial assistant. Extract the user's intent and parameters from their voice command.

SUPPORTED ACTIONS:
1. add_goal - Create a savings goal (needs: name, target amount)
2. add_reminder - Create a bill reminder (needs: title, amount, due_date)
3. add_transaction - Log a transaction (needs: description, amount, category, type expense/income)
4. none - Just a question/conversation (no action needed)

USER COMMAND: "${message}"

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

        const intentResponse = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: detectPrompt }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        const intentText = intentResponse.choices[0]?.message?.content || '{"action":"none"}';

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
                intent.confirmation = `Got it ${displayName}! I've set a reminder for "${intent.params.title}"${intent.params.amount ? ` of Rs ${intent.params.amount.toLocaleString()}` : ''} due on ${new Date(dueDate).toLocaleDateString()}.`;
            } else {
                console.error('Bill insert error:', error);
                intent.confirmation = "I couldn't create that reminder. Please try again.";
            }
        } else if (intent.action === 'add_transaction' && intent.params.amount) {
            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    description: intent.params.description || 'Voice transaction',
                    amount: intent.params.amount,
                    type: intent.params.type || 'expense',
                    category: intent.params.category || 'Other',
                    date: new Date().toISOString().split('T')[0] // Use date format without time
                })
                .select()
                .single();

            if (!error && data) {
                actionResult = data;
                const type = intent.params.type === 'income' ? 'income' : 'expense';
                intent.confirmation = `Recorded ${displayName}! I've added a ${type} of Rs ${intent.params.amount.toLocaleString()} for "${intent.params.description || intent.params.category}".`;
            } else {
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

