const fs = require('fs');

const filePath = 'd:/BSSE/Projects/CASHLY/shopping-expense-tracker/backend/src/routes/ai.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// Find line 583 (0-indexed: 582) which is the start of /chat/fast block
// Find line 675 which is the closing of the route handler
const startIdx = 582; // "/**" for /chat/fast
const endIdx = 674;   // "});" closing for /chat/fast

const newBlock = `/**
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
        const systemPrompt = \`You are "Cashly AI", a smart and friendly financial assistant for the Cashly expense tracking app. You give genuinely helpful, personalized financial advice based on the user's REAL spending data.

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

\${sanitizedContext}\`;

        let reply: string;
        let model = openRouterService.getModelName('fastChat');
        let aiUnavailable = false;

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
            reply = getFallbackChatReply(sanitizedMessage, {});
        }

        // Save to chat history for memory continuity
        if (aiSettings.aiMemoryEnabled) {
            await cacheService.appendChatHistory(userId, { role: 'user', content: sanitizedMessage });
            await cacheService.appendChatHistory(userId, { role: 'assistant', content: reply });
        }

        const responseTime = Date.now() - startTime;

        console.log(\`⚡ Fast AI response in \${responseTime}ms (model: \${model})\`);

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
});`;

const newLines = [
    ...lines.slice(0, startIdx),
    ...newBlock.split('\n'),
    ...lines.slice(endIdx + 1)
];

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Done. Fast chat route updated with memory support.');
console.log('Old lines:', endIdx - startIdx + 1, '-> New lines:', newBlock.split('\n').length);
