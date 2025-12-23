// Multi-Model AI Service - Routes to optimal model per task
// With fallback chain for reliability when rate limited

const API_URL = 'https://api.chatanywhere.tech/v1/chat/completions';
const API_KEY = 'sk-pU53O9QCANvAfNYHz6ykI4OMdeXfExDJfHulM2KICALWrnXH';

export type AITask = 'chat' | 'analysis' | 'insights' | 'pdf';

interface ModelConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    fallbackModels: string[]; // Fallback chain
}

// Model configurations with fallback chains
const MODEL_CONFIGS: Record<AITask, ModelConfig> = {
    chat: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 400,
        fallbackModels: ['gpt-3.5-turbo', 'gpt-4'] // Fallback chain
    },
    analysis: {
        model: 'gpt-4o-mini', // Changed from deepseek-r1 (rate limited)
        temperature: 0.3,
        maxTokens: 800,
        fallbackModels: ['gpt-3.5-turbo']
    },
    insights: {
        model: 'gpt-4o-mini', // Changed from deepseek-r1 (rate limited) 
        temperature: 0.5,
        maxTokens: 600,
        fallbackModels: ['gpt-3.5-turbo']
    },
    pdf: {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 1500,
        fallbackModels: ['gpt-3.5-turbo']
    }
};

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface APIResponse {
    id: string;
    model: string;
    choices: Array<{
        message: { content: string };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Cache for responses to reduce API calls
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate limit tracking
let lastCallTime = 0;
let callCount = 0;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_CALLS_PER_WINDOW = 10;

/**
 * Check if we're rate limited
 */
function isRateLimited(): boolean {
    const now = Date.now();
    if (now - lastCallTime > RATE_LIMIT_WINDOW) {
        callCount = 0;
        lastCallTime = now;
    }
    return callCount >= MAX_CALLS_PER_WINDOW;
}

/**
 * Generate cache key
 */
function getCacheKey(task: AITask, systemPrompt: string, userMessage: string): string {
    return `${task}:${systemPrompt.slice(0, 50)}:${userMessage.slice(0, 100)}`;
}

/**
 * Call the AI API with fallback chain
 */
export async function callAI(
    task: AITask,
    systemPrompt: string,
    userMessage: string
): Promise<{ response: string; model: string; tokens?: number; fromCache?: boolean }> {
    const config = MODEL_CONFIGS[task];

    // Check cache first
    const cacheKey = getCacheKey(task, systemPrompt, userMessage);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 AI Response [${task}] from cache`);
        return { response: cached.response, model: 'cache', fromCache: true };
    }

    // Check rate limit
    if (isRateLimited()) {
        console.warn(`⚠️ AI Rate limited, using local fallback for [${task}]`);
        throw new Error('Rate limited - use local fallback');
    }

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

    // Try primary model, then fallbacks
    const modelsToTry = [config.model, ...config.fallbackModels];

    for (const modelName of modelsToTry) {
        console.log(`🤖 AI Request [${task}] → Trying model: ${modelName}`);
        const startTime = Date.now();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages,
                    temperature: config.temperature,
                    max_tokens: config.maxTokens
                })
            });

            // Track call for rate limiting
            callCount++;
            lastCallTime = Date.now();

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ AI API error (${response.status}) with ${modelName}:`, errorText);

                // If rate limited (429), try next model
                if (response.status === 429) {
                    console.log(`⚠️ Model ${modelName} rate limited, trying next...`);
                    continue;
                }

                throw new Error(`API error: ${response.status}`);
            }

            const data: APIResponse = await response.json();
            const duration = Date.now() - startTime;
            const content = data.choices[0]?.message?.content || 'No response generated';

            console.log(`✅ AI Response [${task}] in ${duration}ms | Model: ${data.model} | Tokens: ${data.usage?.total_tokens || 'N/A'}`);

            // Cache successful response
            responseCache.set(cacheKey, { response: content, timestamp: Date.now() });

            return {
                response: content,
                model: data.model,
                tokens: data.usage?.total_tokens
            };
        } catch (error: any) {
            console.error(`❌ AI call failed [${task}] with ${modelName}:`, error.message);
            // Continue to next model in fallback chain
            continue;
        }
    }

    // All models failed
    console.error(`❌ All AI models failed for [${task}]`);
    throw new Error('All AI models failed - use local fallback');
}

/**
 * Safe AI call that never throws - returns null on failure
 */
export async function safeCallAI(
    task: AITask,
    systemPrompt: string,
    userMessage: string
): Promise<{ response: string; model: string } | null> {
    try {
        return await callAI(task, systemPrompt, userMessage);
    } catch (error) {
        console.log(`🔄 AI call failed gracefully for [${task}], returning null`);
        return null;
    }
}

/**
 * Clear the response cache
 */
export function clearAICache(): void {
    responseCache.clear();
    console.log('🗑️ AI response cache cleared');
}

/**
 * Get cache stats
 */
export function getAICacheStats(): { size: number; oldestEntry: number | null } {
    let oldest: number | null = null;
    responseCache.forEach((entry) => {
        if (oldest === null || entry.timestamp < oldest) {
            oldest = entry.timestamp;
        }
    });
    return { size: responseCache.size, oldestEntry: oldest };
}

/**
 * Quick test function to verify models work
 */
export async function testAllModels(): Promise<Record<AITask, { success: boolean; response?: string; error?: string; model?: string; duration?: number }>> {
    const results: Record<AITask, any> = {
        chat: { success: false },
        analysis: { success: false },
        insights: { success: false },
        pdf: { success: false }
    };

    const testCases: { task: AITask; system: string; user: string }[] = [
        {
            task: 'chat',
            system: 'You are a helpful financial assistant. Be concise.',
            user: 'Say hello in one sentence.'
        },
        {
            task: 'insights',
            system: 'You provide financial insights. Be actionable.',
            user: 'Give one tip for someone spending 50% of income on shopping.'
        }
    ];

    for (const test of testCases) {
        const startTime = Date.now();
        try {
            const result = await callAI(test.task, test.system, test.user);
            results[test.task] = {
                success: true,
                response: result.response.substring(0, 150) + (result.response.length > 150 ? '...' : ''),
                model: result.model,
                duration: Date.now() - startTime
            };
        } catch (error: any) {
            results[test.task] = {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    return results;
}

export default { callAI, safeCallAI, testAllModels, clearAICache, getAICacheStats };
