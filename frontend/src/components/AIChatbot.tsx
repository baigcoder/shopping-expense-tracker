// AIChatbot - Stark Gen Z Neural Link Interface
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Minimize2, Maximize2, RefreshCw, Phone
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useAIRealtime } from '../hooks/useAIRealtime';
import { cn } from '@/lib/utils';
import VoiceSetupModal from './VoiceSetupModal';
import VoiceCallModal from './VoiceCallModal';
import api from '../services/api';
import { soundManager } from '@/lib/sounds';
import styles from './AIChatbot.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_ACTIONS = [
    { label: "Save money", message: "Give me tips to save money" },
    { label: "This month", message: "How much did I spend this month?" },
    { label: "My budget", message: "Show my budget status" },
    { label: "Subscriptions", message: "What subscriptions do I have?" },
    { label: "Goals", message: "Show my goal progress" },
    { label: "Spending review", message: "Review my spending habits" },
];

const AIChatbot = () => {
    const { user } = useAuthStore();
    const { isChatOpen, setChatOpen, toggleChat } = useUIStore();
    const [isMinimized, setIsMinimized] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: "Hi — Cashly is ready. Ask about your spending, inbox, or budgets.",
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
            const anomalyMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Something unusual: ${anomaly.message}`,
                timestamp: new Date()
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
            } catch (err: any) {}
        };
        fetchVoicePrefs();
    }, [user?.id, isChatOpen]);

    const handleVoiceClick = () => {
        soundManager.play('click');
        voicePrefs?.isSetup ? setShowVoiceCall(true) : setShowVoiceSetup(true);
    };

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
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            soundManager.play('success');
        } catch (error) {
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
        } catch (e) {
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
                className={cn(styles.fab, styles.fabDesktop, 'hidden lg:flex')}
                onClick={() => { toggleChat(); soundManager.play('click'); }}
                aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            >
                {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
            </motion.button>

            <motion.button
                className={cn(styles.fab, styles.fabMobile, 'lg:hidden')}
                onClick={() => { toggleChat(); soundManager.play('click'); }}
                aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            >
                {isChatOpen ? <X size={18} /> : <MessageSquare size={18} />}
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
                                    <h3 className="font-display text-sm font-semibold">Cashly</h3>
                                    <p className="text-xs text-[var(--text-muted)]">Cashly is ready</p>
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
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant)}
                                        >
                                            {msg.content}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className={cn(styles.bubble, styles.bubbleAssistant)}>Thinking…</div>
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
                                        placeholder="Ask about your spending"
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
