import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Send, Sparkles, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

const AITestPage = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');

    const handleTest = async () => {
        if (!prompt.trim()) return;
        setLoading(true);

        // Simulate AI response
        setTimeout(() => {
            setResponse(`AI Response to "${prompt}":\n\nThis is a test response from the AI system. In production, this would connect to your AI service (DeepSeek, OpenAI, etc.) and return intelligent insights about your spending patterns.`);
            setLoading(false);
            toast.success('AI response generated!');
        }, 2000);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Brain className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight font-display">AI Testing Lab</h1>
                <p className="text-muted-foreground">Test AI capabilities and responses</p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
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
                            <>Loading...</>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Test AI
                            </>
                        )}
                    </Button>

                    {response && (
                        <div className="mt-6 p-4 rounded-lg bg-muted border space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                AI Response
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{response}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                        <h3>Available AI Features</h3>
                        <ul>
                            <li>Spending pattern analysis</li>
                            <li>Budget recommendations</li>
                            <li>Savings goal suggestions</li>
                            <li>Transaction categorization</li>
                            <li>Financial insights and tips</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AITestPage;
