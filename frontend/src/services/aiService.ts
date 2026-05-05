// AI Service - Cashly AI with Full User Data Context
import api from './api';
import { supabaseTransactionService, SupabaseTransaction } from './supabaseTransactionService';
import { subscriptionService, Subscription } from './subscriptionService';
import { goalService, Goal } from './goalService';
import { budgetService, Budget } from './budgetService';
import { formatCurrency } from './currencyService';

const AI_REQUEST_TIMEOUT_MS = 12000;
const AI_REFRESH_TIMEOUT_MS = 18000;

// User context cache
let userContextCache: UserContext | null = null;
let contextLastUpdated: number = 0;
const CONTEXT_TTL = 60000; // 1 minute

interface UserContext {
    userId: string;
    transactions: SupabaseTransaction[];
    subscriptions: Subscription[];
    goals: Goal[];
    budgets: Budget[];
    stats: {
        totalSpent: number;
        monthlySpent: number;
        weeklySpent: number;
        topCategory: string;
        topCategoryAmount: number;
        avgTransactionAmount: number;
        transactionCount: number;
    };
}

// Fetch and process user financial context
async function getUserContext(userId: string): Promise<UserContext> {
    const now = Date.now();

    // Return cached context if recent
    if (userContextCache && userContextCache.userId === userId && now - contextLastUpdated < CONTEXT_TTL) {
        return userContextCache;
    }

    try {
        const [transactions, subscriptions, goals, budgets] = await Promise.all([
            supabaseTransactionService.getAll(userId),
            subscriptionService.getAll(userId).catch(() => []),
            goalService.getAll(userId).catch(() => []),
            budgetService.getAll(userId).catch(() => [])
        ]);

        // Calculate stats
        const today = new Date();
        const thisMonth = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        });

        const thisWeek = transactions.filter(t => {
            const d = new Date(t.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return d >= weekAgo;
        });

        const expenses = transactions.filter(t => t.type === 'expense');
        const monthlyExpenses = thisMonth.filter(t => t.type === 'expense');

        // Category breakdown
        const categoryTotals: Record<string, number> = {};
        monthlyExpenses.forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
        });

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0] || ['None', 0];

        const stats = {
            totalSpent: expenses.reduce((s, t) => s + Math.abs(t.amount), 0),
            monthlySpent: monthlyExpenses.reduce((s, t) => s + Math.abs(t.amount), 0),
            weeklySpent: thisWeek.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
            topCategory: topCategory[0] as string,
            topCategoryAmount: topCategory[1] as number,
            avgTransactionAmount: expenses.length > 0 ? expenses.reduce((s, t) => s + Math.abs(t.amount), 0) / expenses.length : 0,
            transactionCount: transactions.length
        };

        userContextCache = { userId, transactions, subscriptions, goals, budgets, stats };
        contextLastUpdated = now;

        return userContextCache;
    } catch (error) {
        console.error('Error fetching user context:', error);
        return {
            userId,
            transactions: [],
            subscriptions: [],
            goals: [],
            budgets: [],
            stats: {
                totalSpent: 0,
                monthlySpent: 0,
                weeklySpent: 0,
                topCategory: 'Unknown',
                topCategoryAmount: 0,
                avgTransactionAmount: 0,
                transactionCount: 0
            }
        };
    }
}

// Generate smart response based on user's actual data
function generateSmartResponse(message: string, context: UserContext): string {
    const lowerMsg = message.toLowerCase();
    const { stats, subscriptions, goals, budgets, transactions } = context;

    // SAVINGS / TIPS
    if (lowerMsg.includes('save') || lowerMsg.includes('tip') || lowerMsg.includes('cut')) {
        if (stats.topCategory && stats.topCategoryAmount > 0) {
            const percentage = stats.monthlySpent > 0 ? Math.round((stats.topCategoryAmount / stats.monthlySpent) * 100) : 0;
            return `💡 Real talk: You've spent ${formatCurrency(stats.topCategoryAmount)} on ${stats.topCategory} this month (${percentage}% of spending).\n\n` +
                `Try cutting that by 20% and you'd save ${formatCurrency(stats.topCategoryAmount * 0.2)}/month! 📉\n\n` +
                `${getRandomTip()}`;
        }
        return `You're doing alright! Your avg transaction is ${formatCurrency(stats.avgTransactionAmount)}. ${getRandomTip()}`;
    }

    // SUBSCRIPTIONS
    if (lowerMsg.includes('subscription') || lowerMsg.includes('sub') || lowerMsg.includes('recurring')) {
        const activeSubs = subscriptions.filter(s => s.is_active);
        const monthlyTotal = activeSubs.reduce((sum, s) => {
            if (s.cycle === 'yearly') return sum + s.price / 12;
            if (s.cycle === 'weekly') return sum + s.price * 4;
            return sum + s.price;
        }, 0);

        if (activeSubs.length === 0) {
            return "No active subscriptions tracked yet! 🎉 Add them so I can help you manage your recurring costs.";
        }

        const trials = subscriptions.filter(s => s.is_trial);
        let response = `📱 You have ${activeSubs.length} active subscriptions costing ~${formatCurrency(monthlyTotal)}/month:\n\n`;

        activeSubs.slice(0, 5).forEach(s => {
            response += `• ${s.name}: ${formatCurrency(s.price)}/${s.cycle}\n`;
        });

        if (trials.length > 0) {
            response += `\n⚠️ ${trials.length} trial(s) - make sure to cancel before they charge!`;
        }

        return response;
    }

    // GOALS
    if (lowerMsg.includes('goal')) {
        if (goals.length === 0) {
            return "No goals set yet! 🎯 Create some savings goals and I'll help you track progress. You got this!";
        }

        let response = "🎯 Here's your goal progress:\n\n";
        goals.forEach(goal => {
            const progress = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
            const bar = getProgressBar(progress);
            response += `${goal.name}: ${bar} ${progress}%\n`;
            response += `${formatCurrency(goal.saved)} / ${formatCurrency(goal.target)}\n\n`;
        });

        const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
        response += `💰 Total saved: ${formatCurrency(totalSaved)}. Keep grinding!`;
        return response;
    }

    // ROAST / REVIEW
    if (lowerMsg.includes('roast') || lowerMsg.includes('review') || lowerMsg.includes('analyze')) {
        if (stats.transactionCount < 5) {
            return "I need more data to roast you properly 🔥 Add more transactions and come back!";
        }

        const roasts = [
            `Your spending graph looks like you're fighting gravity... and losing. ${formatCurrency(stats.monthlySpent)} this month? 💀`,
            `${stats.topCategory} is your financial nemesis. ${formatCurrency(stats.topCategoryAmount)} could've been invested! 📉`,
            `Average transaction: ${formatCurrency(stats.avgTransactionAmount)}. Death by a thousand cuts, bestie. 💸`,
            `You've made ${stats.transactionCount} transactions. That's ${stats.transactionCount} opportunities to regret. 🫠`
        ];

        return roasts[Math.floor(Math.random() * roasts.length)] + `\n\nBut seriously, ${getRandomTip()}`;
    }

    // BUDGET
    if (lowerMsg.includes('budget')) {
        if (budgets.length === 0) {
            return "No budgets set! 📊 Create category budgets to track your spending limits.";
        }

        let response = "📊 Budget Status:\n\n";
        budgets.forEach(b => {
            const spent = transactions
                .filter(t => t.category === b.category && t.type === 'expense')
                .reduce((s, t) => s + Math.abs(t.amount), 0);
            const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
            const status = percent >= 100 ? '🔴' : percent >= 80 ? '🟡' : '🟢';
            response += `${status} ${b.category}: ${formatCurrency(spent)} / ${formatCurrency(b.amount)} (${percent}%)\n`;
        });

        return response;
    }

    // TRANSACTIONS
    if (lowerMsg.includes('transaction') || lowerMsg.includes('history') || lowerMsg.includes('recent')) {
        if (transactions.length === 0) {
            return "📝 No transactions recorded yet. Start tracking your spending and I'll help you analyze it! 💪";
        }

        const recentTx = transactions.slice(0, 8);
        let response = `📝 Here are your recent transactions (${transactions.length} total):\n\n`;

        recentTx.forEach(t => {
            const type = t.type === 'expense' ? '💸' : '💰';
            const amount = t.type === 'expense' ? `-${formatCurrency(Math.abs(t.amount))}` : `+${formatCurrency(Math.abs(t.amount))}`;
            response += `${type} ${t.description || t.category}: ${amount}\n`;
        });

        response += `\n📊 This month: ${formatCurrency(stats.monthlySpent)} spent`;
        if (stats.topCategory !== 'None') {
            response += ` | Top: ${stats.topCategory}`;
        }

        return response;
    }

    // SPENDING / STATS
    if (lowerMsg.includes('spend') || lowerMsg.includes('stat') || lowerMsg.includes('how much')) {
        return `📈 Your spending breakdown:\n\n` +
            `• This month: ${formatCurrency(stats.monthlySpent)}\n` +
            `• This week: ${formatCurrency(stats.weeklySpent)}\n` +
            `• Top category: ${stats.topCategory} (${formatCurrency(stats.topCategoryAmount)})\n` +
            `• Avg transaction: ${formatCurrency(stats.avgTransactionAmount)}\n` +
            `• Total transactions: ${stats.transactionCount}`;
    }

    // HYPE / MOTIVATION
    if (lowerMsg.includes('hype') || lowerMsg.includes('motivat')) {
        const hypes = [
            "You're literally building generational wealth rn. Every dollar saved is a soldier in your financial army! 💪",
            "Rich people don't just make money, they MANAGE it. And that's what you're doing. Iconic behavior! ✨",
            "You tracked your spending. 90% of people don't even do that. Already ahead of the game! 🏆",
            "Your future self is gonna send a thank you card. Keep stacking! 📈"
        ];
        return hypes[Math.floor(Math.random() * hypes.length)];
    }

    // DEFAULT
    return `Hey! I'm Cashly AI, your personal financial assistant 🤖\n\n` +
        `I'm here to help you manage your money, track spending, and reach your goals. Try asking me:\n\n` +
        `• "How much have I spent this month?"\n` +
        `• "Give me a review of my spending"\n` +
        `• "What are my active subscriptions?"\n` +
        `• "Show my progress on savings goals"\n` +
        `• "Tips for saving more money"`;

}

function getProgressBar(percent: number): string {
    const filled = Math.floor(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(Math.min(filled, 10)) + '░'.repeat(Math.max(empty, 0));
}

function getRandomTip(): string {
    const tips = [
        "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings! 💡",
        "Unsubscribe from shopping emails. Out of sight, out of cart! 🛒",
        "Wait 24 hours before any purchase over $50. Impulse control hits different. ⏰",
        "Cook at home one more day per week = ~$200/month saved! 🍳",
        "Cancel one subscription you forgot about. We all have one. 👀",
        "Round up your purchases to savings. Spare change adds up! 🪙"
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

// Main export - FAST AI response using frontend cache
export const getAIResponse = async (message: string, userId?: string): Promise<string> => {
    if (!userId) {
        return generateSmartResponse(message, {
            userId: '',
            transactions: [],
            subscriptions: [],
            goals: [],
            budgets: [],
            stats: {
                totalSpent: 0,
                monthlySpent: 0,
                weeklySpent: 0,
                topCategory: 'Unknown',
                topCategoryAmount: 0,
                avgTransactionAmount: 0,
                transactionCount: 0
            }
        });
    }

    try {
        const { aiDataCache } = await import('./aiDataCacheService');
        const cachedData = await aiDataCache.getCachedData(userId);
        const contextString = aiDataCache.buildContextString(cachedData);

        // Try FAST endpoint
        try {
            const response = await api.post('/ai/chat/fast', {
                message,
                context: contextString
            }, {
                timeout: AI_REQUEST_TIMEOUT_MS
            });
            return response.data.reply;
        } catch (fastError) {
            console.log('Fast endpoint failed, trying regular...');
        }

        // Try regular endpoint
        try {
            const response = await api.post('/ai/chat', { message, clientContext: contextString }, {
                timeout: AI_REQUEST_TIMEOUT_MS
            });
            
            // Smarter fallback if backend AI is unavailable
            if (response.data.aiUnavailable && cachedData.transactions.length > 0) {
                console.log('Backend AI unavailable, using local intelligence');
                return generateSmartResponse(message, {
                    userId,
                    transactions: cachedData.transactions,
                    subscriptions: cachedData.subscriptions,
                    goals: cachedData.goals,
                    budgets: cachedData.budgets,
                    stats: {
                        totalSpent: cachedData.monthlySpent,
                        monthlySpent: cachedData.monthlySpent,
                        weeklySpent: cachedData.weeklySpent,
                        topCategory: cachedData.topCategory,
                        topCategoryAmount: cachedData.topCategoryAmount,
                        avgTransactionAmount: cachedData.transactions.length > 0 
                            ? cachedData.monthlySpent / Math.max(1, cachedData.transactions.length) 
                            : 0,
                        transactionCount: cachedData.transactions.length
                    }
                });
            }

            return response.data.reply;
        } catch (backendError) {
            console.log('Backend AI unavailable, using local fallback');
            const context = await getUserContext(userId);
            return generateSmartResponse(message, context);
        }

    } catch (error) {
        console.error('AI response error:', error);
        try {
            const context = await getUserContext(userId);
            return generateSmartResponse(message, context);
        } catch {
            return "I'm having trouble connecting right now. Try again in a moment! 😅";
        }
    }
};

// Clear context cache
export const clearAIContext = () => {
    userContextCache = null;
    contextLastUpdated = 0;
    import('./aiDataCacheService').then(({ aiDataCache }) => {
        aiDataCache.invalidate();
    }).catch(() => { });
};

// Generate proactive insights
export const generateProactiveInsight = async (userId: string): Promise<{
    type: 'warning' | 'tip' | 'celebration';
    title: string;
    message: string;
} | null> => {
    try {
        const context = await getUserContext(userId);

        for (const budget of context.budgets) {
            const spent = context.transactions
                .filter(t => t.category === budget.category && t.type === 'expense')
                .reduce((s, t) => s + Math.abs(t.amount), 0);
            const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            if (percent >= 90 && percent < 100) {
                return {
                    type: 'warning',
                    title: `${budget.category} Budget Alert`,
                    message: `You're at ${percent.toFixed(0)}% of your ${budget.category} budget. Consider slowing down! 💸`
                };
            }
        }

        for (const goal of context.goals) {
            const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
            if (progress >= 50 && progress < 55) {
                return {
                    type: 'celebration',
                    title: 'Goal Milestone! 🎉',
                    message: `You're halfway to "${goal.name}"! Keep it up, you've saved ${formatCurrency(goal.saved)}!`
                };
            }
        }

        const trialSubs = context.subscriptions.filter(s => s.is_trial && s.trial_end_date);
        for (const sub of trialSubs) {
            const endDate = new Date(sub.trial_end_date!);
            const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 2 && daysLeft > 0) {
                return {
                    type: 'warning',
                    title: 'Trial Ending Soon! ⚠️',
                    message: `Your ${sub.name} trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Cancel now if you don't want to be charged!`
                };
            }
        }

        if (context.stats.weeklySpent > 0) {
            const avgDaily = context.stats.weeklySpent / 7;
            if (avgDaily > context.stats.monthlySpent / 30 * 1.5) {
                return {
                    type: 'tip',
                    title: 'Spending Trend 📊',
                    message: `Your spending this week is higher than usual. You've spent ${formatCurrency(context.stats.weeklySpent)} in 7 days.`
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error generating proactive insight:', error);
        return null;
    }
};

export { getUserContext };

// ==================== BACKEND AI ENDPOINTS ====================

export interface BackendAIInsight {
    type: 'tip' | 'warning' | 'forecast' | 'risk';
    title: string;
    message: string;
    confidence: number;
    generatedAt?: string;
}

export interface BackendAIForecast {
    month: string;
    predictedExpenses: number;
    predictedIncome: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
}

export async function getBackendInsights(userId: string): Promise<{
    insights: BackendAIInsight[];
    fromCache: boolean;
}> {
    try {
        const response = await api.get('/ai/insights', { timeout: AI_REQUEST_TIMEOUT_MS });
        return response.data;
    } catch (error) {
        console.error('Backend AI insights error:', error);
        return { insights: [], fromCache: false };
    }
}

export async function getBackendForecast(userId: string): Promise<{
    forecast: BackendAIForecast[];
    fromCache: boolean;
}> {
    try {
        const response = await api.get('/ai/forecast', { timeout: AI_REQUEST_TIMEOUT_MS });
        return response.data;
    } catch (error) {
        console.error('Backend AI forecast error:', error);
        return { forecast: [], fromCache: false };
    }
}

export async function getBackendRisks(userId: string): Promise<{
    risks: BackendAIInsight[];
    fromCache: boolean;
}> {
    try {
        const response = await api.get('/ai/risks', { timeout: AI_REQUEST_TIMEOUT_MS });
        return response.data;
    } catch (error) {
        console.error('Backend AI risks error:', error);
        return { risks: [], fromCache: false };
    }
}

export async function refreshBackendAI(userId: string): Promise<{
    insights: BackendAIInsight[];
    forecast: BackendAIForecast[];
    risks: BackendAIInsight[];
}> {
    try {
        const response = await api.post('/ai/refresh', {}, { timeout: AI_REFRESH_TIMEOUT_MS });
        return response.data;
    } catch (error) {
        console.error('Backend AI refresh error:', error);
        return { insights: [], forecast: [], risks: [] };
    }
}

export async function getAIServiceStatus(): Promise<{
    openrouter: { status: string; model: string; error?: string | null; models?: Record<string, string> };
    redis: { connected: boolean; memory?: string };
}> {
    try {
        const response = await api.get('/ai/status', { timeout: AI_REQUEST_TIMEOUT_MS });
        return response.data;
    } catch (error) {
        return {
            openrouter: { status: 'error', model: 'unknown' },
            redis: { connected: false }
        };
    }
}
