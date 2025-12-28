import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Send, Sparkles, MessageSquare, Loader2, Zap } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getAIResponse } from '../services/aiService';
import { useAuthStore } from '../store/useStore';
import { motion } from 'framer-motion';

const AITestPage = () => {
    const { user } = useAuthStore();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [streamingText, setStreamingText] = useState('');

    // Simulate streaming effect
    const streamText = async (text: string) => {
        setStreamingText('');
        const words = text.split(' ');

        for (let i = 0; i < words.length; i++) {
            await new Promise(r => setTimeout(r, 30)); // 30ms per word
            setStreamingText(prev => prev + (i > 0 ? ' ' : '') + words[i]);
        }

        setResponse(text);
        setStreamingText('');
    };

    const handleTest = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResponse('');
        setStreamingText('');

        try {
            // Use real AI service
            const aiResponse = await getAIResponse(prompt, user?.id);

            // Stream the response word by word
            await streamText(aiResponse);

            toast.success('AI response generated!');
        } catch (error) {
            console.error('AI error:', error);
            setResponse('Failed to get AI response. Please try again.');
            toast.error('AI request failed');
        } finally {
            setLoading(false);
        }
    };

    const quickPrompts = [
        "Analyze my spending this month",
        "What subscriptions am I paying for?",
        "How can I save more money?",
        "Show my budget status",
        "Roast my spending habits",
        "What's my biggest expense?"
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Brain className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight font-display">AI Testing Lab</h1>
                <p className="text-muted-foreground">Test Cashly AI with real financial context</p>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <Zap className="h-4 w-4" />
                    <span>Connected to live data</span>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    {/* Quick Prompts */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickPrompts.map((qp) => (
                            <button
                                key={qp}
                                onClick={() => setPrompt(qp)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 hover:bg-primary hover:text-white transition-colors"
                            >
                                {qp}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            AI Prompt
                        </label>
                        <textarea
                            className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ask the AI anything about your spending patterns, budgets, or financial advice..."
                        />
                    </div>

                    <Button onClick={handleTest} disabled={loading || !prompt.trim()} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Test AI
                            </>
                        )}
                    </Button>

                    {/* Streaming response */}
                    {(streamingText || response) && (
                        <motion.div
                            className="mt-6 p-4 rounded-lg bg-muted border space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                AI Response
                                {streamingText && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                                {streamingText || response}
                                {streamingText && <span className="animate-pulse">▊</span>}
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                        <h3>Available AI Features</h3>
                        <ul>
                            <li>✅ Real spending pattern analysis</li>
                            <li>✅ Live budget recommendations</li>
                            <li>✅ Subscription tracking insights</li>
                            <li>✅ Goal progress updates</li>
                            <li>✅ Personalized financial tips</li>
                            <li>✅ Streaming responses</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AITestPage;

