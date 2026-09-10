const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 12000);

export type GroqUseCase = 'chat' | 'fastChat' | 'analysis' | 'forecast' | 'risk' | 'voice' | 'document';

const GROQ_MODELS: Record<GroqUseCase, string> = {
    fastChat: 'llama-3.1-8b-instant',
    voice: 'llama-3.1-8b-instant',
    chat: 'llama-3.3-70b-versatile',
    analysis: 'llama-3.3-70b-versatile',
    forecast: 'llama-3.3-70b-versatile',
    risk: 'llama-3.3-70b-versatile',
    document: 'llama-3.3-70b-versatile',
};

const USE_CASE_ENV: Record<GroqUseCase, string> = {
    chat: 'GROQ_CHAT_MODEL',
    fastChat: 'GROQ_FAST_MODEL',
    analysis: 'GROQ_ANALYSIS_MODEL',
    forecast: 'GROQ_FORECAST_MODEL',
    risk: 'GROQ_RISK_MODEL',
    voice: 'GROQ_VOICE_MODEL',
    document: 'GROQ_DOCUMENT_MODEL',
};

export interface GroqChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqCompletionOptions {
    useCase?: GroqUseCase;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
    user?: string;
}

let groqDisabledReason: string | null = null;
const blacklistedModels = new Map<string, number>();

export function getGroqApiKey(): string {
    return (process.env.GROQ_API_KEY || '').trim();
}

export function isGroqConfigured(): boolean {
    const key = getGroqApiKey();
    return !groqDisabledReason
        && key.startsWith('gsk_')
        && key.length > 20
        && !key.includes('your_groq');
}

export function getGroqConfigurationError(): string | null {
    if (groqDisabledReason) return groqDisabledReason;
    const key = getGroqApiKey();
    if (!key) return 'GROQ_API_KEY is not configured';
    if (!key.startsWith('gsk_') || key.length <= 20 || key.includes('your_groq')) {
        return 'GROQ_API_KEY is still a placeholder';
    }
    return null;
}

export function getGroqModel(useCase: GroqUseCase = 'chat'): string {
    return process.env[USE_CASE_ENV[useCase]] || process.env.GROQ_MODEL || GROQ_MODELS[useCase];
}

export function prefersGroqFirst(useCase?: string): boolean {
    return useCase === 'fastChat' || useCase === 'voice';
}

function timeoutForUseCase(useCase?: GroqUseCase): number {
    if (useCase === 'fastChat' || useCase === 'voice') {
        return Number(process.env.GROQ_FAST_TIMEOUT_MS || 8000);
    }
    if (useCase === 'document') {
        return Number(process.env.GROQ_DOCUMENT_TIMEOUT_MS || 20000);
    }
    return DEFAULT_TIMEOUT_MS;
}

async function groqFetch(
    model: string,
    messages: GroqChatMessage[],
    options: GroqCompletionOptions,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getGroqApiKey()}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.5,
                max_tokens: options.maxTokens ?? 500,
                response_format: options.responseFormat,
            }),
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(`Groq timed out after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export async function groqChatCompletion(
    messages: GroqChatMessage[],
    options: GroqCompletionOptions = {}
): Promise<{ content: string; model: string; provider: 'groq' }> {
    if (!isGroqConfigured()) {
        throw new Error(getGroqConfigurationError() || 'GROQ_API_KEY is not configured');
    }

    const model = getGroqModel(options.useCase || 'chat');
    const blacklistExpiry = blacklistedModels.get(model);
    if (blacklistExpiry && blacklistExpiry > Date.now()) {
        throw new Error(`Groq model ${model} is temporarily rate limited`);
    }

    const timeoutMs = timeoutForUseCase(options.useCase);
    let response = await groqFetch(model, messages, options, timeoutMs);

    if (!response.ok && response.status === 400 && options.responseFormat) {
        response = await groqFetch(model, messages, { ...options, responseFormat: undefined }, timeoutMs);
    }

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || errorText.includes('invalid_api_key')) {
            groqDisabledReason = 'GROQ_API_KEY is invalid or revoked';
        }
        if (response.status === 429) {
            blacklistedModels.set(model, Date.now() + 60_000);
        }
        throw new Error(`Groq error ${response.status}`);
    }

    const data = await response.json() as {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty Groq response');

    return { content, model: `groq:${data.model || model}`, provider: 'groq' };
}
