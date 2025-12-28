// Cashly AI Financial Assistant Chatbot
// Redesigned with Cashly emerald/violet theme and enhanced user context
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Bot, User, Sparkles, Loader2,
    Zap, Minimize2, Maximize2, RefreshCw, Brain, Phone
} from 'lucide-react';
import { getAIResponse, clearAIContext } from '../services/aiService';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useAIRealtime } from '../hooks/useAIRealtime';
import { cn } from '@/lib/utils';
import VoiceSetupModal from './VoiceSetupModal';
import VoiceCallModal from './VoiceCallModal';
import api from '../services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_ACTIONS = [
    { label: "💰 Save Tips", message: "Give me tips to save money" },
    { label: "📊 My Spending", message: "How much did I spend this month?" },
    { label: "📈 Budget Status", message: "Show my budget status" },
    { label: "📱 Subscriptions", message: "What subscriptions do I have?" },
    { label: "🎯 Goal Progress", message: "Show my goal progress" },
    { label: "🔥 Roast Me", message: "Roast my spending habits" },
];

const AIChatbot = () => {
    const { user } = useAuthStore();
    const { isChatOpen, setChatOpen, toggleChat } = useUIStore();
    const [isMinimized, setIsMinimized] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: "Hey! 👋 I'm Cashly AI, your personal finance assistant. I know your spending, budgets, subscriptions, and goals. Ask me anything about your money!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice AI states
    const [showVoiceSetup, setShowVoiceSetup] = useState(false);
    const [showVoiceCall, setShowVoiceCall] = useState(false);
    const [voicePrefs, setVoicePrefs] = useState<{ isSetup: boolean; voiceName: string } | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize AI data cache with realtime sync when user logs in
    useEffect(() => {
        if (user?.id) {
            clearAIContext();

            // Setup cache with realtime updates
            import('../services/aiDataCacheService').then(({ aiDataCache }) => {
                // Preload cache in background
                aiDataCache.getCachedData(user.id).then(() => {
                    console.log('✅ AI Cache preloaded');
                });

                // Setup realtime sync
                aiDataCache.setupRealtime(user.id);
            });
        }

        return () => {
            // Cleanup on unmount
            import('../services/aiDataCacheService').then(({ aiDataCache }) => {
                aiDataCache.cleanup();
            });
        };
    }, [user?.id]);

    // AI Realtime - Auto-invalidate context when any data changes
    useAIRealtime({
        onContextInvalidated: () => {
            console.log('🧠 AI context auto-refreshed via realtime');
        },
        onAnomalyDetected: (anomaly) => {
            // Add AI message about the anomaly
            const anomalyMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `${anomaly.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, anomalyMessage]);
        }
    });

    // Fetch voice preferences on mount
    useEffect(() => {
        const fetchVoicePrefs = async () => {
            if (!user?.id) return;
            try {
                const response = await api.get('/voice/preferences');
                if (response.status === 200) {
                    const data = response.data;
                    setVoicePrefs({ isSetup: data.isSetup, voiceName: data.voiceName });
                }
            } catch (err) {
                console.log('Voice prefs not loaded');
            }
        };
        fetchVoicePrefs();
    }, [user?.id]);

    // Handle voice button click
    const handleVoiceClick = () => {
        if (voicePrefs?.isSetup) {
            setShowVoiceCall(true);
        } else {
            setShowVoiceSetup(true);
        }
    };

    // Handle voice setup complete
    const handleVoiceSetupComplete = (voiceId: string, voiceName: string) => {
        setVoicePrefs({ isSetup: true, voiceName });
        setShowVoiceSetup(false);
        setShowVoiceCall(true);
    };

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

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
            const response = await getAIResponse(text, user?.id);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Oops, something went wrong! 😅 Try asking again?",
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

    const handleClearChat = () => {
        setMessages([{
            id: '0',
            role: 'assistant',
            content: "Chat cleared! 🧹 Ready for fresh questions about your finances.",
            timestamp: new Date()
        }]);
    };

    return (
        <>
            {/* Floating Button - Desktop */}
            <motion.button
                className={cn(
                    "fixed bottom-6 right-6 z-[9990]",
                    "w-14 h-14 rounded-2xl",
                    "bg-gradient-to-br from-primary to-blue-700",
                    "text-white border-2 border-white/20",
                    "shadow-lg shadow-primary/20",
                    "flex items-center justify-center",
                    "cursor-pointer transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/30",
                    "hover:scale-105 hover:-translate-y-1",
                    "active:scale-95",
                    "hidden lg:flex" // Desktop only
                )}
                onClick={toggleChat}
                whileHover={{ rotate: isChatOpen ? 0 : 10 }}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    {isChatOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={24} strokeWidth={2.5} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            className="relative"
                        >
                            <Brain size={26} strokeWidth={2} />
                            <motion.span
                                className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Floating Button - Mobile (smaller) */}
            <motion.button
                className={cn(
                    "fixed bottom-20 right-4 z-[9990]",
                    "w-11 h-11 rounded-xl",
                    "bg-gradient-to-br from-primary to-blue-700",
                    "text-white border border-white/20",
                    "shadow-lg shadow-primary/30",
                    "flex items-center justify-center",
                    "cursor-pointer transition-all duration-300",
                    "active:scale-95",
                    "lg:hidden" // Mobile/tablet only
                )}
                onClick={toggleChat}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    {isChatOpen ? (
                        <motion.div
                            key="close-mobile"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={18} strokeWidth={2.5} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open-mobile"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            className="relative"
                        >
                            <Sparkles size={18} strokeWidth={2} />
                            <motion.span
                                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>


            {/* Chat Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        className={cn(
                            "fixed z-[9991]",
                            isMinimized
                                ? "bottom-24 right-4 lg:right-6 w-72 lg:w-80 h-16"
                                : "bottom-0 right-0 w-full h-[85vh] lg:bottom-24 lg:right-6 lg:w-[380px] lg:h-[520px] lg:max-h-[calc(100vh-140px)] lg:rounded-2xl",
                            "bg-primary",
                            !isMinimized && "rounded-t-3xl lg:rounded-2xl",
                            "border border-white/20",
                            "shadow-2xl shadow-indigo-900/40",
                            "flex flex-col overflow-hidden"
                        )}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-sm border-bottom border-white/10">

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl border border-white/10">
                                    💸
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">Cashly AI</h3>
                                    <span className="flex items-center gap-1.5 text-xs text-white  font-bold tracking-tight">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                        Ready to help
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Voice Call Button */}
                                <motion.button
                                    onClick={handleVoiceClick}
                                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-violet-500/20 transition-colors relative"
                                    title="Talk to AI Accountant"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Phone size={16} />
                                    {!voicePrefs?.isSetup && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                                    )}
                                </motion.button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                    title="Clear chat"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={() => setChatOpen(false)}
                                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-primary/95">
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            className={cn(
                                                "flex gap-3",
                                                msg.role === 'user' ? "flex-row-reverse" : ""
                                            )}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                msg.role === 'assistant'
                                                    ? "bg-white/10 text-white border border-white/10"
                                                    : "bg-white text-primary"
                                            )}>

                                                {msg.role === 'assistant' ? "💸" : <User size={16} />}
                                            </div>
                                            <div className={cn(
                                                "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-300",
                                                msg.role === 'user'
                                                    ? "bg-white text-primary rounded-tr-sm shadow-xl hover:shadow-2xl border border-white"
                                                    : "bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-tl-sm shadow-md hover:bg-white/15"
                                            )}>

                                                {msg.content.split('\n').map((line, i) => (
                                                    <span key={i} className="block">
                                                        {line}
                                                        {i < msg.content.split('\n').length - 1 && line && <br />}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <motion.div
                                            className="flex gap-3"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm border border-white/10">
                                                💸

                                            </div>
                                            <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-sm shadow-sm">
                                                <div className="flex gap-1.5">
                                                    <motion.span
                                                        className="w-2 h-2 bg-white rounded-full"
                                                        animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                                                    />
                                                    <motion.span
                                                        className="w-2 h-2 bg-white/70 rounded-full"
                                                        animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
                                                    />
                                                    <motion.span
                                                        className="w-2 h-2 bg-white/40 rounded-full"
                                                        animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                                                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Actions */}
                                {messages.length <= 2 && (
                                    <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                                        <p className="text-xs text-white/50 mb-2 font-semibold">Quick questions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_ACTIONS.slice(0, 4).map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => handleSend(action.message)}
                                                    disabled={isLoading}
                                                    className={cn(
                                                        "px-3 py-1.5 text-xs font-medium rounded-full",
                                                        "bg-white/5 text-white/90",
                                                        "border border-white/10",
                                                        "hover:bg-white/10 hover:text-white hover:border-white/20",

                                                        "transition-colors disabled:opacity-50"
                                                    )}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input */}
                                <div className="p-4 border-t border-white/10 bg-white/5">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Ask about your finances..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            disabled={isLoading}
                                            className={cn(
                                                "flex-1 px-4 py-3 rounded-xl text-sm",
                                                "bg-white/10 text-white",
                                                "border border-white/20",
                                                "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40",

                                                "placeholder:text-white/40",
                                                "disabled:opacity-50"
                                            )}
                                        />
                                        <motion.button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim() || isLoading}
                                            className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                                "bg-white text-primary",
                                                "shadow-lg shadow-black/20",
                                                "hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
                                                "hover:bg-blue-50 active:scale-95",
                                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                                            )}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {isLoading ? (
                                                <Loader2 size={24} className="animate-spin text-primary" />
                                            ) : (
                                                <Send size={22} className="text-primary fill-primary" />
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice Modals */}
            <VoiceSetupModal
                isOpen={showVoiceSetup}
                onClose={() => setShowVoiceSetup(false)}
                onSetupComplete={handleVoiceSetupComplete}
            />
            <VoiceCallModal
                isOpen={showVoiceCall}
                onClose={() => setShowVoiceCall(false)}
                voiceName={voicePrefs?.voiceName || 'Rachel'}
                userId={user?.id || ''}
                userName={user?.name?.split(' ')[0] || 'there'}
                onEditPreferences={() => {
                    setShowVoiceCall(false);
                    setVoicePrefs({ isSetup: false, voiceName: voicePrefs?.voiceName || 'Rachel' });
                    setShowVoiceSetup(true);
                }}
            />
        </>
    );
};

export default AIChatbot;
