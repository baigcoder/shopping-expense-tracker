// AI Service - Cashly AI with Full User Data Context
import api from './api';
import { supabaseTransactionService, SupabaseTransaction } from './supabaseTransactionService';
import { subscriptionService, Subscription } from './subscriptionService';
import { goalService, Goal } from './goalService';
import { budgetService, Budget } from './budgetService';
import { formatCurrency } from './currencyService';

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
    return `Hey! I'm Cashly AI, your financial bestie 🤖\n\n` +
        `Try asking me about:\n` +
        `• "How much did I spend?"\n` +
        `• "Roast my spending"\n` +
        `• "Show my subscriptions"\n` +
        `• "Goal progress"\n` +
        `• "Budget status"\n` +
        `• "Tips to save money"`;
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

// Main export - enhanced AI response with multi-model routing
export const getAIResponse = async (message: string, userId?: string): Promise<string> => {
    // Get user context first
    let context: UserContext | null = null;
    if (userId) {
        try {
            context = await getUserContext(userId);
        } catch (e) {
            console.log('Could not get user context');
        }
    }

    // Try multi-model AI service - uses GPT-4o-mini for chat (faster)
    if (context) {
        try {
            const { callAI } = await import('./multiModelService');
            const { getCurrencySymbol, getCurrencyInfo } = await import('./currencyService');
            const currency = getCurrencyInfo();

            // Build detailed subscription list
            const subsDetails = context.subscriptions.filter(s => s.is_active).slice(0, 5)
                .map(s => `${s.name}: ${currency.symbol}${s.price}/${s.cycle}`)
                .join(', ') || 'None tracked';

            // Build goals list
            const goalsDetails = context.goals.slice(0, 5)
                .map(g => `${g.name}: ${currency.symbol}${g.saved}/${currency.symbol}${g.target}`)
                .join(', ') || 'None set';

            // Build budget status
            const budgetDetails = context.budgets.slice(0, 5)
                .map(b => {
                    const spent = context.transactions
                        .filter(t => t.category === b.category && t.type === 'expense')
                        .reduce((s, t) => s + Math.abs(t.amount), 0);
                    return `${b.category}: ${currency.symbol}${spent}/${currency.symbol}${b.amount}`;
                })
                .join(', ') || 'None set';

            const systemPrompt = `You are "Cashly AI", a friendly Gen-Z financial assistant. You speak casually, use emojis naturally, and give genuinely helpful financial advice based on the user's REAL data.

KEY RULES:
- Keep responses concise (2-4 sentences max unless asked for details)
- Always use ${currency.symbol} (${currency.code}) for currency amounts
- Reference the user's ACTUAL data below to personalize advice
- When asked about subscriptions/goals/budgets, LIST THE ACTUAL ITEMS you see below
- Be encouraging but honest about spending habits
- DO NOT use markdown formatting like ** or // or -- in your responses
- Use plain text only, emojis are fine

USER'S REAL FINANCIAL DATA:
📊 Monthly Spending: ${currency.symbol}${context.stats.monthlySpent.toLocaleString()}
📈 Weekly Spending: ${currency.symbol}${context.stats.weeklySpent.toLocaleString()}
🏆 Top Category: ${context.stats.topCategory} (${currency.symbol}${context.stats.topCategoryAmount.toLocaleString()})
📝 Total Transactions: ${context.stats.transactionCount}

💳 SUBSCRIPTIONS (${context.subscriptions.length}): ${subsDetails}
🎯 GOALS (${context.goals.length}): ${goalsDetails}
📋 BUDGETS (${context.budgets.length}): ${budgetDetails}

When the user asks about their subscriptions, goals, or budgets - tell them the EXACT items listed above!`;

            const result = await callAI('chat', systemPrompt, message);
            console.log(`✅ AI Chat response via ${result.model}`);
            return result.response;
        } catch (error) {
            console.log('Multi-model AI unavailable, using smart fallback:', error);
        }
    }

    // Try backend AI endpoint as second option
    try {
        const response = await api.post('/ai/chat', { message });
        return response.data.reply;
    } catch (error) {
        console.log('Backend AI unavailable, using local fallback');
    }

    // Smart local fallback with user context
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief thinking delay

    if (context) {
        return generateSmartResponse(message, context);
    }

    // No user context available - generic response
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
};

// Clear context cache (call when user logs out or data changes)
export const clearAIContext = () => {
    userContextCache = null;
    contextLastUpdated = 0;
};
