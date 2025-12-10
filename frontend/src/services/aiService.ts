// AI Service - Multi-Provider with Auto-Fallback
// Priority: Groq (fastest) -> OpenAI -> Gemini -> Simulated
// Enhanced with more accurate spending analysis algorithms

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// API endpoints
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface SpendingData {
    totalSpent: number;
    categories: { name: string; amount: number; percentage: number }[];
    monthlyAverage: number;
    topMerchant: string;
}

interface Transaction {
    id?: string;
    date: string;
    amount: number;
    category: string;
    description?: string;
    type: 'income' | 'expense';
}

// System prompt - NO markdown formatting
const SYSTEM_PROMPT = `You are a helpful Gen Z financial assistant called "Vibe Buddy" for an expense tracking app called "Vibe Tracker". 
Your personality is friendly, casual, and uses Gen Z slang occasionally but not excessively.

IMPORTANT FORMATTING RULES:
- DO NOT use markdown formatting like ** or # or ## 
- DO NOT use bold or headers
- Use plain text only
- Use emojis sparingly to make responses fun
- Use bullet points with • or - symbols
- Keep responses concise (under 150 words)
- Be encouraging and positive

You help users with:
- Spending analysis and tips
- Budget recommendations  
- Savings advice
- Subscription management
- Financial goal tracking`;

// Track which provider is currently working
let lastWorkingProvider: 'groq' | 'openai' | 'gemini' | null = null;

// Groq API call - UPDATED to use current model
const callGroq = async (message: string, context?: string): Promise<string> => {
    if (!GROQ_API_KEY) throw new Error('No Groq API key');

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', // Updated to current model
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + (context || '') },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API Error:', errText);
        throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty Groq response');

    lastWorkingProvider = 'groq';
    console.log('✅ AI Response from: Groq');
    return cleanResponse(text);
};

// OpenAI API call
const callOpenAI = async (message: string, context?: string): Promise<string> => {
    if (!OPENAI_API_KEY) throw new Error('No OpenAI API key');

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + (context || '') },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('OpenAI API Error:', errText);
        throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty OpenAI response');

    lastWorkingProvider = 'openai';
    console.log('✅ AI Response from: OpenAI');
    return cleanResponse(text);
};

// Gemini API call - COMPLETELY FIXED with correct v1 endpoint
const callGemini = async (message: string, context?: string): Promise<string> => {
    if (!GEMINI_API_KEY) throw new Error('No Gemini API key');

    // Use v1 endpoint (not v1beta) with gemini-1.5-flash model
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${SYSTEM_PROMPT}${context || ''}\n\nUser: ${message}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API Error:', errText);
        throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('Empty Gemini response');

    lastWorkingProvider = 'gemini';
    console.log('✅ AI Response from: Gemini');
    return cleanResponse(text);
};

// Clean response - remove any markdown formatting
const cleanResponse = (text: string): string => {
    return text
        .replace(/\*\*/g, '')      // Remove **bold**
        .replace(/\*/g, '')         // Remove *italic*
        .replace(/#{1,6}\s/g, '')   // Remove # headers
        .replace(/`{1,3}/g, '')     // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .trim();
};

// Main function with auto-fallback
export const getAIResponse = async (
    message: string,
    context?: SpendingData
): Promise<string> => {
    const contextInfo = context
        ? `\n\nUser's spending context: Total spent this month: $${context.totalSpent}, Top categories: ${context.categories.map(c => `${c.name}: $${c.amount}`).join(', ')}`
        : '';

    // Define provider order (try last working provider first for speed)
    const providers = [
        { name: 'groq', fn: () => callGroq(message, contextInfo) },
        { name: 'openai', fn: () => callOpenAI(message, contextInfo) },
        { name: 'gemini', fn: () => callGemini(message, contextInfo) },
    ];

    // Reorder to try last working provider first
    if (lastWorkingProvider) {
        const idx = providers.findIndex(p => p.name === lastWorkingProvider);
        if (idx > 0) {
            const [provider] = providers.splice(idx, 1);
            providers.unshift(provider);
        }
    }

    // Try each provider with fallback
    for (const provider of providers) {
        try {
            console.log(`🔄 Trying AI provider: ${provider.name}...`);
            return await provider.fn();
        } catch (error) {
            console.warn(`⚠️ ${provider.name} failed:`, error);
            continue;
        }
    }

    // All providers failed, use simulated response
    console.log('💭 Using simulated response (all providers failed)');
    return getSimulatedResponse(message);
};

// Fallback simulated responses (plain text, no markdown)
const getSimulatedResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
        return "💰 Here are 3 ways you could save more:\n\n• Meal prep on Sundays - Your food delivery could be cut by 60%\n\n• Bundle subscriptions - Consider rotating streaming services monthly\n\n• Use cashback apps - You could earn around $30/month back";
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
        return "📊 Looking at typical spending patterns:\n\n• Food & Dining: 35% (consider reducing)\n• Shopping: 25% (on target)\n• Entertainment: 15% (good!)\n• Transport: 12% (efficient)\n\nWant me to suggest an optimized budget?";
    }

    if (lowerMessage.includes('subscription') || lowerMessage.includes('recurring')) {
        return "🔄 Pro tip for subscriptions: Try the 'subscription audit' method!\n\nCancel everything for a month and only resubscribe to what you truly miss. Most people find they only need 2-3 services, not 6+. This alone could save you $50-100 per month!";
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
        return "🎯 Setting financial goals? Try the SMART method:\n\n• Specific - Exactly what you want\n• Measurable - Track your progress\n• Achievable - Be realistic\n• Relevant - Matters to you\n• Time-bound - Set a deadline\n\nWhat's your biggest financial goal right now?";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hey there! 👋 I'm your AI financial buddy! I'm here to help you make smarter money moves.\n\nI can help with:\n• 💰 Savings tips\n• 📊 Spending analysis\n• 🔄 Subscription reviews\n• 🎯 Goal tracking\n\nWhat's on your mind?";
    }

    return "👋 I'm your AI financial buddy! I can help you with:\n\n• 💰 Savings tips - Ask 'How can I save more?'\n• 📊 Spending analysis - Ask 'Analyze my spending'\n• 🔄 Subscriptions - Ask 'Review my subscriptions'\n• 🎯 Goals - Ask 'How do I reach my goals?'\n\nWhat would you like to know?";
};

// Helper to parse JSON from AI response
const parseAIJSON = (text: string): any => {
    console.log('🤖 AI Raw Response:', text);
    try {
        // 1. Remove Markdown code blocks
        let cleanText = text.replace(/```json\n?|```/g, '').trim();

        // 2. Extract the JSON object if there's extra text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        // 3. Basic cleanup (only trim whitespace)
        cleanText = cleanText.trim();

        console.log('🧹 Cleaned JSON Candidate:', cleanText);

        try {
            return JSON.parse(cleanText);
        } catch (initialError) {
            console.warn('Standard Parse Failed. Attempting repair...');
            // Attempt to fix unquoted keys
            let repaired = cleanText.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

            // FIX: Missing commas between key-value pairs (common AI issue)
            // Looks for: "value" (newline) "key":
            repaired = repaired.replace(/("\s*)\n(\s*")/g, '$1,\n$2');

            console.log('🔧 Repaired JSON:', repaired);
            return JSON.parse(repaired);
        }
    } catch (e) {
        console.error('❌ Failed to parse AI JSON:', e);
        return null;
    }
};

// =====================================================
// ENHANCED ANALYSIS FUNCTIONS WITH ACCURATE ALGORITHMS
// =====================================================

/**
 * Helper: Get month key from date string (YYYY-MM)
 */
const getMonthKey = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Helper: Group transactions by month
 */
const groupByMonth = (transactions: Transaction[]): Map<string, Transaction[]> => {
    const grouped = new Map<string, Transaction[]>();
    transactions.forEach(t => {
        const key = getMonthKey(t.date);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t);
    });
    return grouped;
};

/**
 * Helper: Calculate monthly totals for expenses
 */
const calculateMonthlyTotals = (transactions: Transaction[]): Map<string, number> => {
    const grouped = groupByMonth(transactions.filter(t => t.type === 'expense'));
    const totals = new Map<string, number>();

    grouped.forEach((txs, month) => {
        const total = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        totals.set(month, total);
    });

    return totals;
};

/**
 * Helper: Calculate trend using linear regression
 */
const calculateTrend = (values: number[]): { slope: number; direction: 'up' | 'down' | 'stable' } => {
    if (values.length < 2) return { slope: 0, direction: 'stable' };

    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of 0,1,2,...,n-1
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xxSum = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);

    // Use percentage threshold for stability determination
    const avgValue = ySum / n;
    const slopePercent = (slope / avgValue) * 100;

    let direction: 'up' | 'down' | 'stable';
    if (slopePercent > 5) direction = 'up';
    else if (slopePercent < -5) direction = 'down';
    else direction = 'stable';

    return { slope, direction };
};

/**
 * Helper: Calculate confidence based on data variance
 */
const calculateConfidence = (values: number[]): number => {
    if (values.length < 2) return 0.3; // Low confidence with minimal data

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Higher variance = lower confidence
    // CV of 0 = 95% confidence, CV of 1+ = 40% confidence
    const confidence = Math.max(0.4, Math.min(0.95, 1 - coefficientOfVariation * 0.5));

    // Bonus for having more months of data
    const dataBonus = Math.min(0.1, values.length * 0.02);

    return Math.min(0.95, confidence + dataBonus);
};

// Analyze spending with real AI + accurate calculations
export const analyzeSpending = async (transactions: Transaction[]): Promise<{
    summary: string;
    insights: string[];
    warnings: string[];
    opportunities: string[];
}> => {
    if (!transactions.length) {
        return {
            summary: "No transactions found to analyze. Start adding expenses to get AI insights!",
            insights: [],
            warnings: [],
            opportunities: []
        };
    }

    // Get current month's transactions only for primary analysis
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

    const monthlyTotals = calculateMonthlyTotals(transactions);
    const currentMonthTotal = monthlyTotals.get(currentMonthKey) || 0;
    const lastMonthTotal = monthlyTotals.get(lastMonthKey) || 0;

    // Calculate category breakdown for current month
    const currentMonthTxs = transactions.filter(t => getMonthKey(t.date) === currentMonthKey && t.type === 'expense');
    const categoryTotals = new Map<string, number>();
    currentMonthTxs.forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + Math.abs(t.amount));
    });

    // Sort categories by amount
    const sortedCategories = Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Calculate month-over-month change
    const monthChange = lastMonthTotal > 0
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : '0';

    // Build context for AI
    const contextStr = `
Current Month Spending: $${currentMonthTotal.toFixed(2)}
Last Month Spending: $${lastMonthTotal.toFixed(2)}
Month-over-Month Change: ${monthChange}%
Top Categories This Month:
${sortedCategories.map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`).join('\n')}
Total Transactions Analyzed: ${transactions.length}
`;

    const prompt = `Analyze this user's spending data and provide financial insights. Be direct, helpful, and slightly informal/modern in tone.

SPENDING DATA:
${contextStr}

Return STRICT JSON (valid double quotes, commas between fields):
{
    "summary": "A single string containing a punchy 2-sentence summary with 1-2 emojis (no internal objects, just text)",
    "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "warnings": ["Warning about high spending areas or concerning patterns"],
    "opportunities": ["Saving opportunity 1", "Saving opportunity 2"]
}`;

    const response = await getAIResponse(prompt);
    const parsed = parseAIJSON(response);

    return parsed || {
        summary: `You've spent $${currentMonthTotal.toFixed(0)} this month (${monthChange}% vs last month). ${sortedCategories[0] ? `Top category: ${sortedCategories[0][0]}` : ''}`,
        insights: [`Your spending is ${parseFloat(monthChange) > 0 ? 'up' : 'down'} ${Math.abs(parseFloat(monthChange))}% from last month`],
        warnings: parseFloat(monthChange) > 20 ? ['Spending increased significantly this month'] : [],
        opportunities: ['Track daily to stay on budget']
    };
};

// Optimize budget with real AI + calculated suggestions
export const optimizeBudget = async (
    income: number,
    currentSpending: { category: string; amount: number }[]
): Promise<{
    suggested: { category: string; amount: number; adjustment: number; reason: string }[];
    totalSavings: number;
    methods: string[];
}> => {
    // Calculate actual income if not provided
    const effectiveIncome = income > 0 ? income : currentSpending.reduce((sum, c) => sum + c.amount, 0) * 1.2;

    // Apply 50/30/20 rule as baseline
    const needsCategories = ['Food', 'Groceries', 'Transport', 'Utilities', 'Rent', 'Healthcare'];
    const wantsCategories = ['Shopping', 'Entertainment', 'Dining', 'Subscriptions', 'Personal'];

    const spendingStr = currentSpending.map(c =>
        `${c.category}: $${c.amount} (${needsCategories.some(n => c.category.includes(n)) ? 'needs' : 'wants'})`
    ).join('\n');

    const prompt = `Create an optimized budget based on this spending. Monthly Income: $${effectiveIncome}.
Current Spending:
${spendingStr}

Apply the 50/30/20 rule (50% needs, 30% wants, 20% savings) but adjust for this user's priorities.
Be realistic but look for genuine savings opportunities.
Return STRICT JSON (valid double quotes, commas between fields):
{
    "suggested": [
        {"category": "Category Name", "amount": 123, "adjustment": -50, "reason": "Short reason why"}
    ],
    "totalSavings": 123,
    "methods": ["Actionable saving method 1", "Actionable saving method 2"]
}`;

    const response = await getAIResponse(prompt);
    const parsed = parseAIJSON(response);

    if (parsed) return parsed;

    // Fallback: Calculate basic optimizations
    const totalSpending = currentSpending.reduce((sum, c) => sum + c.amount, 0);
    const targetSpending = effectiveIncome * 0.8; // Leave 20% for savings
    const reductionFactor = targetSpending / totalSpending;

    const suggested = currentSpending.map(c => ({
        category: c.category,
        amount: Math.round(c.amount * reductionFactor),
        adjustment: Math.round(c.amount * reductionFactor - c.amount),
        reason: reductionFactor < 1 ? 'Proportional reduction to hit savings goal' : 'Maintaining current level'
    }));

    return {
        suggested,
        totalSavings: Math.max(0, totalSpending - targetSpending),
        methods: ['50/30/20 Rule', 'Zero-based budgeting']
    };
};

// Predict future spending with ACCURATE time-series analysis
export const predictSpending = async (historicalData: Transaction[]): Promise<{
    nextMonth: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    breakdown: { category: string; predicted: number }[];
}> => {
    if (!historicalData.length) return {
        nextMonth: 0, trend: 'stable', confidence: 0, breakdown: []
    };

    const expenses = historicalData.filter(t => t.type === 'expense');
    if (!expenses.length) return {
        nextMonth: 0, trend: 'stable', confidence: 0, breakdown: []
    };

    // Calculate monthly totals
    const monthlyTotals = calculateMonthlyTotals(expenses);
    const sortedMonths = Array.from(monthlyTotals.keys()).sort();
    const monthlyValues = sortedMonths.map(m => monthlyTotals.get(m)!);

    // Calculate trend using linear regression
    const { slope, direction } = calculateTrend(monthlyValues);

    // Calculate confidence based on data variance and quantity
    const confidence = calculateConfidence(monthlyValues);

    // Predict next month using weighted moving average + trend
    let predictedTotal: number;
    if (monthlyValues.length >= 3) {
        // Weighted average (recent months weighted more)
        const weights = monthlyValues.map((_, i) => i + 1);
        const weightSum = weights.reduce((a, b) => a + b, 0);
        const weightedSum = monthlyValues.reduce((sum, val, i) => sum + val * weights[i], 0);
        const weightedAvg = weightedSum / weightSum;

        // Add trend adjustment
        predictedTotal = weightedAvg + slope;
    } else {
        // Simple average for limited data
        predictedTotal = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    }

    // Ensure positive prediction
    predictedTotal = Math.max(0, predictedTotal);

    // Calculate category breakdown prediction
    const categoryMonthlyTotals = new Map<string, number[]>();
    const grouped = groupByMonth(expenses);

    grouped.forEach((txs, _month) => {
        const catTotals = new Map<string, number>();
        txs.forEach(t => {
            catTotals.set(t.category, (catTotals.get(t.category) || 0) + Math.abs(t.amount));
        });
        catTotals.forEach((amount, category) => {
            if (!categoryMonthlyTotals.has(category)) categoryMonthlyTotals.set(category, []);
            categoryMonthlyTotals.get(category)!.push(amount);
        });
    });

    const breakdown = Array.from(categoryMonthlyTotals.entries())
        .map(([category, values]) => ({
            category,
            predicted: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        }))
        .sort((a, b) => b.predicted - a.predicted)
        .slice(0, 6);

    return {
        nextMonth: Math.round(predictedTotal),
        trend: direction,
        confidence: Math.round(confidence * 100) / 100,
        breakdown
    };
};

// Get current provider status
export const getProviderStatus = (): string => {
    return lastWorkingProvider || 'none';
};

export default {
    getAIResponse,
    analyzeSpending,
    optimizeBudget,
    predictSpending,
    getProviderStatus
};