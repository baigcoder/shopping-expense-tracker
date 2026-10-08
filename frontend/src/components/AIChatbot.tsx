// AIChatbot - Executable AI Co-Pilot with Action Chips
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, X, Send, Minimize2, Maximize2, RefreshCw, Phone, ArrowUpRight,
    Check, Loader2, Zap, PiggyBank, Wallet, Pause, TrendingDown
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useAIRealtime } from '../hooks/useAIRealtime';
import { cn } from '@/lib/utils';
import VoiceSetupModal from './VoiceSetupModal';
import VoiceCallModal from './VoiceCallModal';
import api from '../services/api';
import { soundManager } from '@/lib/sounds';
import styles from './AIChatbot.module.css';

// --- Action Chip System ---
type ActionChipStatus = 'idle' | 'loading' | 'done' | 'error';

interface ActionChip {
    id: string;
    type: 'budget_cap' | 'goal_fund' | 'sub_pause' | 'navigate' | 'add_transaction';
    label: string;
    icon: 'wallet' | 'piggy' | 'pause' | 'trend' | 'zap' | 'navigate';
    payload: Record<string, any>;
    status: ActionChipStatus;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actionChips?: ActionChip[];
}

const QUICK_ACTIONS = [
    { label: "Save money", message: "Give me tips to save money" },
    { label: "This month", message: "How much did I spend this month?" },
    { label: "My budget", message: "Show my budget status" },
    { label: "Subscriptions", message: "What subscriptions do I have?" },
    { label: "Goals", message: "Show my goal progress" },
    { label: "Extend runway", message: "How can I extend my runway by 5 days?" },
];

const getActionForMessage = (content: string) => {
    const lower = content.toLowerCase();
    if (lower.includes('inbox') || lower.includes('review') || lower.includes('candidate')) {
        return { label: 'Review Inbox', path: '/transaction-inbox' };
    }
    if (lower.includes('budget') || lower.includes('limit') || lower.includes('cap')) {
        return { label: 'Manage Budgets', path: '/budgets' };
    }
    if (lower.includes('subscription') || lower.includes('recurring') || lower.includes('bill')) {
        return { label: 'Inspect Commitments', path: '/subscriptions' };
    }
    if (lower.includes('goal') || lower.includes('milestone')) {
        return { label: 'Savings Goals', path: '/goals' };
    }
    if (lower.includes('forecast') || lower.includes('what-if') || lower.includes('simulation') || lower.includes('twin')) {
        return { label: 'What-If Forecast', path: '/money-twin' };
    }
    if (lower.includes('transaction') || lower.includes('spent') || lower.includes('purchase')) {
        return { label: 'View Transactions', path: '/transactions' };
    }
    return null;
};

// Parse AI response text into actionable chips
function extractActionChips(content: string, userId?: string): ActionChip[] {
    const chips: ActionChip[] = [];
    const lower = content.toLowerCase();

    // Budget cap suggestions
    const budgetCapPatterns = [
        /cap\s+(\w[\w\s&]*?)\s+(?:budget\s+)?(?:at|to)\s+(?:rs\.?|₹|inr)\s*([\d,]+)/gi,
        /reduce\s+(\w[\w\s&]*?)\s+(?:budget|spending)\s+(?:to|by)\s+(?:rs\.?|₹|inr)\s*([\d,]+)/gi,
        /set\s+(\w[\w\s&]*?)\s+(?:limit|budget|cap)\s+(?:at|to)\s+(?:rs\.?|₹|inr)\s*([\d,]+)/gi,
        /limit\s+(\w[\w\s&]*?)\s+(?:to|at)\s+(?:rs\.?|₹|inr)\s*([\d,]+)/gi,
    ];

    for (const pattern of budgetCapPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const category = match[1].trim().replace(/\s+/g, ' ');
            const amount = parseInt(match[2].replace(/,/g, ''));
            if (amount > 0 && category.length > 1) {
                const chipId = `budget-${category}-${amount}`;
                if (!chips.find(c => c.id === chipId)) {
                    chips.push({
                        id: chipId,
                        type: 'budget_cap',
                        label: `Cap ${category} at ₹${amount.toLocaleString()}`,
                        icon: 'wallet',
                        payload: { category, amount, userId },
                        status: 'idle',
                    });
                }
            }
        }
    }

    // Goal funding suggestions
    const goalFundPatterns = [
        /(?:route|transfer|move|allocate)\s+(?:rs\.?|₹|inr)\s*([\d,]+)\s+(?:to|towards?|into)\s+(\w[\w\s]*(?:fund|goal|savings))/gi,
        /(?:add|put|save)\s+(?:rs\.?|₹|inr)\s*([\d,]+)\s+(?:to|towards?|into|in)\s+(\w[\w\s]*(?:fund|goal|savings))/gi,
    ];

    for (const pattern of goalFundPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const amount = parseInt(match[1].replace(/,/g, ''));
            const goalName = match[2].trim();
            if (amount > 0 && goalName.length > 2) {
                const chipId = `goal-${goalName}-${amount}`;
                if (!chips.find(c => c.id === chipId)) {
                    chips.push({
                        id: chipId,
                        type: 'goal_fund',
                        label: `Route ₹${amount.toLocaleString()} to ${goalName}`,
                        icon: 'piggy',
                        payload: { goalName, amount, userId },
                        status: 'idle',
                    });
                }
            }
        }
    }

    // Subscription pause suggestions
    const subPausePatterns = [
        /(?:pause|cancel|stop|freeze)\s+(\w[\w\s]*?)\s+subscription/gi,
        /(?:unsubscribe|deactivate)\s+(?:from\s+)?(\w[\w\s]*?)(?:\s+subscription)?/gi,
    ];

    for (const pattern of subPausePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const subName = match[1].trim();
            if (subName.length > 1) {
                const chipId = `sub-pause-${subName}`;
                if (!chips.find(c => c.id === chipId)) {
                    chips.push({
                        id: chipId,
                        type: 'sub_pause',
                        label: `Pause ${subName} Subscription`,
                        icon: 'pause',
                        payload: { subscriptionName: subName, userId },
                        status: 'idle',
                    });
                }
            }
        }
    }

    // Generic spending reduction suggestions
    if (lower.includes('reduce') && lower.includes('spending') && chips.length === 0) {
        const amountMatch = content.match(/(?:rs\.?|₹|inr)\s*([\d,]+)/i);
        const categoryMatch = content.match(/(?:reduce|cut)\s+(\w+)\s+spending/i);
        if (amountMatch && categoryMatch) {
            chips.push({
                id: `reduce-${categoryMatch[1]}-${amountMatch[1]}`,
                type: 'budget_cap',
                label: `Reduce ${categoryMatch[1]} by ₹${parseInt(amountMatch[1].replace(/,/g, '')).toLocaleString()}`,
                icon: 'trend',
                payload: {
                    category: categoryMatch[1],
                    reduceBy: parseInt(amountMatch[1].replace(/,/g, '')),
                    userId,
                },
                status: 'idle',
            });
        }
    }

    return chips;
}

// Execute action chip against real services
async function executeActionChip(chip: ActionChip): Promise<boolean> {
    try {
        switch (chip.type) {
            case 'budget_cap': {
                const { budgetService } = await import('../services/budgetService');
                const userId = chip.payload.userId;
                if (!userId) return false;

                const budgets = await budgetService.getAll(userId);
                const existing = budgets.find(
                    (b) => b.category.toLowerCase() === chip.payload.category.toLowerCase()
                );

                if (existing) {
                    const newAmount = chip.payload.reduceBy
                        ? Math.max(0, existing.amount - chip.payload.reduceBy)
                        : chip.payload.amount;
                    await budgetService.update(existing.id, { amount: newAmount });
                } else {
                    await budgetService.create({
                        user_id: userId,
                        category: chip.payload.category,
                        amount: chip.payload.amount || 0,
                        period: 'monthly',
                    });
                }
                return true;
            }

            case 'goal_fund': {
                const { goalService } = await import('../services/goalService');
                const userId = chip.payload.userId;
                if (!userId) return false;

                const goals = await goalService.getAll(userId);
                const existing = goals.find(
                    (g) => g.name.toLowerCase().includes(chip.payload.goalName.toLowerCase())
                );

                if (existing) {
                    await goalService.addFunds(existing.id, chip.payload.amount);
                }
                return !!existing;
            }

            case 'sub_pause': {
                const { subscriptionService } = await import('../services/subscriptionService');
                const userId = chip.payload.userId;
                if (!userId) return false;

                const subs = await subscriptionService.getAll(userId);
                const existing = subs.find(
                    (s) => s.name.toLowerCase().includes(chip.payload.subscriptionName.toLowerCase())
                );

                if (existing) {
                    await subscriptionService.update(existing.id, { is_active: false });
                }
                return !!existing;
            }

            default:
                return false;
        }
    } catch (err) {
        console.error('Action chip execution failed:', err);
        return false;
    }
}

// --- Action Chip UI Component ---
function ActionChipButton({
    chip,
    onExecute,
}: {
    chip: ActionChip;
    onExecute: (chipId: string) => void;
}) {
    const iconMap = {
        wallet: Wallet,
        piggy: PiggyBank,
        pause: Pause,
        trend: TrendingDown,
        zap: Zap,
        navigate: ArrowUpRight,
    };

    const Icon = iconMap[chip.icon] || Zap;

    return (
        <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => chip.status === 'idle' && onExecute(chip.id)}
            disabled={chip.status !== 'idle'}
            className={cn(
                'mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all border',
                chip.status === 'idle' &&
                    'bg-[var(--color-brand-soft)] border-[var(--color-brand)]/30 text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] cursor-pointer shadow-xs',
                chip.status === 'loading' &&
                    'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] cursor-wait',
                chip.status === 'done' &&
                    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 cursor-default',
                chip.status === 'error' &&
                    'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 cursor-default'
            )}
        >
            {chip.status === 'loading' ? (
                <Loader2 size={12} className="animate-spin" />
            ) : chip.status === 'done' ? (
                <Check size={12} />
            ) : (
                <Icon size={12} />
            )}
            <span>{chip.status === 'done' ? `✓ ${chip.label}` : chip.label}</span>
        </motion.button>
    );
}

// --- Main Component ---
const AIChatbot = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { isChatOpen, setChatOpen, toggleChat } = useUIStore();
    const [isMinimized, setIsMinimized] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: "Hi — Cashly is ready. Ask about your spending, inbox, or budgets. I can take actions for you too.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showVoiceSetup, setShowVoiceSetup] = useState(false);
    const [showVoiceCall, setShowVoiceCall] = useState(false);
    const [voicePrefs, setVoicePrefs] = useState<{ isSetup: boolean; voiceName: string } | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (user?.id && isChatOpen) {
            import('../services/aiService').then(({ clearAIContext }) => clearAIContext());
            import('../services/aiDataCacheService').then(({ aiDataCache }) => {
                aiDataCache.getCachedData(user.id);
                aiDataCache.setupRealtime(user.id);
            });
        }
        return () => {
            import('../services/aiDataCacheService').then(({ aiDataCache }) => aiDataCache.cleanup());
        };
    }, [user?.id, isChatOpen]);

    useAIRealtime({
        onContextInvalidated: () => console.log('🧠 AI context auto-refreshed'),
        onAnomalyDetected: (anomaly) => {
            const chips = extractActionChips(anomaly.message, user?.id);
            const anomalyMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Something unusual: ${anomaly.message}`,
                timestamp: new Date(),
                actionChips: chips.length > 0 ? chips : undefined,
            };
            setMessages(prev => [...prev, anomalyMessage]);
        }
    });

    useEffect(() => {
        const fetchVoicePrefs = async () => {
            if (!user?.id || !isChatOpen) return;
            try {
                const response = await api.get('/voice/preferences');
                if (response.status === 200) {
                    setVoicePrefs({ isSetup: response.data.isSetup, voiceName: response.data.voiceName });
                }
            } catch {
                // Silently ignore if voice prefs unavailable
            }
        };
        fetchVoicePrefs();
    }, [user?.id, isChatOpen]);

    const handleVoiceClick = () => {
        soundManager.play('click');
        if (voicePrefs?.isSetup) {
            setShowVoiceCall(true);
        } else {
            setShowVoiceSetup(true);
        }
    };

    // Execute an action chip
    const handleExecuteChip = useCallback(async (messageId: string, chipId: string) => {
        // Mark chip as loading
        setMessages(prev =>
            prev.map(msg =>
                msg.id === messageId
                    ? {
                          ...msg,
                          actionChips: msg.actionChips?.map(c =>
                              c.id === chipId ? { ...c, status: 'loading' as ActionChipStatus } : c
                          ),
                      }
                    : msg
            )
        );

        soundManager.play('click');

        // Find the chip
        const msg = messages.find(m => m.id === messageId);
        const chip = msg?.actionChips?.find(c => c.id === chipId);
        if (!chip) return;

        const success = await executeActionChip(chip);

        // Update chip status
        setMessages(prev =>
            prev.map(m =>
                m.id === messageId
                    ? {
                          ...m,
                          actionChips: m.actionChips?.map(c =>
                              c.id === chipId
                                  ? { ...c, status: (success ? 'done' : 'error') as ActionChipStatus }
                                  : c
                          ),
                      }
                    : m
            )
        );

        if (success) {
            soundManager.play('success');
        } else {
            soundManager.play('error');
        }
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;
        soundManager.play('click');

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { getAIResponse } = await import('../services/aiService');
            const response = await getAIResponse(text, user?.id);

            // Extract action chips from the response
            const chips = extractActionChips(response, user?.id);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                actionChips: chips.length > 0 ? chips : undefined,
            };
            setMessages(prev => [...prev, botMessage]);
            soundManager.play('success');
        } catch {
            soundManager.play('error');
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't get a response right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = async () => {
        soundManager.play('click');
        // Clear backend chat history (Redis memory)
        try {
            await api.post('/ai/chat/clear');
        } catch {
            console.warn('Could not clear backend chat history');
        }
        setMessages([{
            id: '0',
            role: 'assistant',
            content: "Chat cleared. I'm ready to help — ask me anything about your finances!",
            timestamp: new Date()
        }]);
    };

    return (
        <>
            <motion.button
                className={styles.fab}
                onClick={() => { toggleChat(); soundManager.play('click'); }}
                aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
                whileTap={{ scale: 0.95 }}
            >
                {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
            </motion.button>

            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        className={cn(
                            styles.panel,
                            isMinimized
                                ? 'bottom-32 right-8 h-20 w-80'
                                : 'bottom-0 right-0 h-[90vh] w-full lg:bottom-28 lg:right-8 lg:h-[620px] lg:w-[420px]'
                        )}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className={styles.header}>
                            <div className="flex items-center gap-3">
                                <div className={styles.brandMark}>C</div>
                                <div>
                                    <h3 className="font-display text-sm font-semibold">Cashly Co-Pilot</h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active Agent
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={handleVoiceClick} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white" aria-label="Voice">
                                    <Phone size={16} />
                                </button>
                                <button onClick={() => setIsMinimized(!isMinimized)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white">
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button onClick={handleClearChat} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white" aria-label="Clear chat">
                                    <RefreshCw size={16} />
                                </button>
                                <button onClick={() => setChatOpen(false)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white" aria-label="Close">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                <div className={styles.messages}>
                                    {messages.map((msg) => {
                                        const action = msg.role === 'assistant' ? getActionForMessage(msg.content) : null;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn(styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant)}
                                            >
                                                <div>{msg.content}</div>

                                                {/* Executable Action Chips */}
                                                {msg.actionChips && msg.actionChips.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50 space-y-1">
                                                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)] mb-1">
                                                            Quick Actions
                                                        </div>
                                                        {msg.actionChips.map((chip) => (
                                                            <ActionChipButton
                                                                key={chip.id}
                                                                chip={chip}
                                                                onExecute={(chipId) => handleExecuteChip(msg.id, chipId)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Navigation action (existing) */}
                                                {action && !msg.actionChips?.length && (
                                                    <button
                                                        onClick={() => {
                                                            navigate(action.path);
                                                            setChatOpen(false);
                                                        }}
                                                        className="mt-2 px-2.5 py-1 rounded-lg bg-white/90 border border-stone-200 text-stone-800 text-[11px] font-semibold flex items-center gap-1 hover:bg-white hover:text-[var(--cashly-brand)] shadow-2xs transition-all"
                                                    >
                                                        <span>[{action.label}]</span>
                                                        <ArrowUpRight size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {isLoading && (
                                        <div className={cn(styles.bubble, styles.bubbleAssistant)}>
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-[var(--color-brand)]" />
                                                <span>Analyzing your finances…</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {messages.length <= 2 && (
                                    <div className={styles.chips}>
                                        {QUICK_ACTIONS.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={() => handleSend(action.message)}
                                                className={styles.chip}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.composer}>
                                    <input
                                        type="text"
                                        placeholder="Ask me or tell me what to do…"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        disabled={isLoading}
                                        className={styles.input}
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isLoading}
                                        className={styles.send}
                                        aria-label="Send"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <VoiceSetupModal isOpen={showVoiceSetup} onClose={() => setShowVoiceSetup(false)} onSetupComplete={(id, name) => { setVoicePrefs({ isSetup: true, voiceName: name }); setShowVoiceSetup(false); setShowVoiceCall(true); }} />
            <VoiceCallModal isOpen={showVoiceCall} onClose={() => setShowVoiceCall(false)} voiceName={voicePrefs?.voiceName || 'Rachel'} userId={user?.id || ''} userName={user?.name?.split(' ')[0] || 'there'} onEditPreferences={() => { setShowVoiceCall(false); setVoicePrefs({ isSetup: false, voiceName: voicePrefs?.voiceName || 'Rachel' }); setShowVoiceSetup(true); }} />
        </>
    );
};

export default AIChatbot;
