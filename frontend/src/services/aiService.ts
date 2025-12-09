// AI Service - Multi-Provider with Auto-Fallback
// Priority: Groq (fastest) -> OpenAI -> Gemini -> Simulated

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

// Analyze spending with real AI
export const analyzeSpending = async (transactions: any[]): Promise<{
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

    const recentTx = transactions.slice(0, 50).map(t =>
        `${t.date}: ${t.description} - $${t.amount} (${t.category})`
    ).join('\n');

    const prompt = `Analyze these recent transactions and provide financial insights. Be direct, helpful, and slightly informal/modern in tone.
    Return STRICT JSON (valid double quotes, commas between fields):
    {
        "summary": "A single string containing a punchy 2-sentence summary with 1-2 emojis (no internal commas or separate strings)",
        "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
        "warnings": ["Warning 1", "Warning 2"],
        "opportunities": ["Opportunity 1", "Opportunity 2"]
    }

    Transactions:
    ${recentTx}`;

    const response = await getAIResponse(prompt);
    const parsed = parseAIJSON(response);

    return parsed || {
        summary: "Unable to analyze spending at this moment.",
        insights: ["Check back later"],
        warnings: [],
        opportunities: []
    };
};

// Optimize budget with real AI
export const optimizeBudget = async (
    income: number,
    currentSpending: { category: string; amount: number }[]
): Promise<{
    suggested: { category: string; amount: number; adjustment: number; reason: string }[];
    totalSavings: number;
    methods: string[];
}> => {
    const spendingStr = currentSpending.map(c => `${c.category}: ${c.amount}`).join('\n');

    const prompt = `Create an optimized budget based on this spending. Income: ${income}.
    Spending:
    ${spendingStr}

    Act as a smart financial coach. Be realistic but ambitious.
    Return STRICT JSON (valid double quotes, commas between fields):
    {
        "suggested": [
            {"category": "Category Name", "amount": 123, "adjustment": -50, "reason": "Short, punchy reason"}
        ],
        "totalSavings": 123,
        "methods": ["Strategic Method 1", "Tactical Method 2"]
    }`;

    const response = await getAIResponse(prompt);
    const parsed = parseAIJSON(response);

    return parsed || {
        suggested: [],
        totalSavings: 0,
        methods: ["50/30/20 Rule"]
    };
};

// Predict future spending with real AI
export const predictSpending = async (historicalData: any[]): Promise<{
    nextMonth: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    breakdown: { category: string; predicted: number }[];
}> => {
    if (!historicalData.length) return {
        nextMonth: 0, trend: 'stable', confidence: 0, breakdown: []
    };

    const txStr = historicalData.slice(0, 50).map(t =>
        `${t.date}: $${t.amount} (${t.category})`
    ).join('\n');

    const prompt = `Predict next month's total spending based on these past transactions.
    
    Transactions:
    ${txStr}

    Return STRICT JSON (valid double quotes, commas between fields):
    {
        "nextMonth": 1234,
        "trend": "up",
        "confidence": 0.85,
        "breakdown": [
            {"category": "Food", "predicted": 400}
        ]
    }`;

    const response = await getAIResponse(prompt);
    const parsed = parseAIJSON(response);

    return parsed || {
        nextMonth: 0,
        trend: 'stable',
        confidence: 0,
        breakdown: []
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