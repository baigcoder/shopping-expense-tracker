// AIChatbot - Stark Gen Z Neural Link Interface
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, X, Send, Bot, User, Sparkles, Loader2,
    Zap, Minimize2, Maximize2, RefreshCw, Brain, Phone, ShieldCheck, Terminal, Cpu
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import { useAIRealtime } from '../hooks/useAIRealtime';
import { cn } from '@/lib/utils';
import VoiceSetupModal from './VoiceSetupModal';
import VoiceCallModal from './VoiceCallModal';
import api from '../services/api';
import { soundManager } from '@/lib/sounds';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_ACTIONS = [
    { label: "💰 SAVE_MONEY", message: "Give me tips to save money" },
    { label: "📊 MY_SPENDING", message: "How much did I spend this month?" },
    { label: "📈 MY_BUDGET", message: "Show my budget status" },
    { label: "📱 SUBSCRIPTIONS", message: "What subscriptions do I have?" },
    { label: "🎯 MY_GOALS", message: "Show my goal progress" },
    { label: "🔥 SPENDING_REVIEW", message: "Roast my spending habits" },
];

const AIChatbot = () => {
    const { user } = useAuthStore();
    const { isChatOpen, setChatOpen, toggleChat } = useUIStore();
    const [isMinimized, setIsMinimized] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: "Welcome! I am Cashly AI. Your financial data is synced and ready. How can I help you today?",
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
                content: `ANOMALY_DETECTED: ${anomaly.message}`,
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
            content: text.toUpperCase(),
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
                content: response.toUpperCase(),
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
            {/* ── FLOATING TRIGGER (DESKTOP) ── */}
            <motion.button
                className={cn(
                    "fixed bottom-8 right-8 z-[9990]",
                    "w-14 h-14 bg-black text-white border-3 border-black",
                    "shadow-[6px_6px_0px_#E11D48] flex items-center justify-center",
                    "hover:shadow-[3px_3px_0px_#E11D48] hover:translate-x-[3px] hover:translate-y-[3px]",
                    "active:scale-95 transition-all hidden lg:flex"
                )}
                onClick={() => { toggleChat(); soundManager.play('click'); }}
            >
                <AnimatePresence mode="wait">
                    {isChatOpen ? (
                        <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                            <X size={24} strokeWidth={4} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} className="relative">
                            <Cpu size={28} strokeWidth={3} />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E11D48] border-2 border-black" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* ── FLOATING TRIGGER (MOBILE) ── */}
            <motion.button
                className={cn(
                    "fixed bottom-24 right-6 z-[9990]",
                    "w-12 h-12 bg-black text-white border-3 border-black",
                    "shadow-[4px_4px_0px_#E11D48] flex items-center justify-center lg:hidden"
                )}
                onClick={() => { toggleChat(); soundManager.play('click'); }}
            >
                {isChatOpen ? <X size={20} strokeWidth={4} /> : <Cpu size={22} strokeWidth={3} />}
            </motion.button>

            {/* ── CHAT WINDOW ── */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        className={cn(
                            "fixed z-[9991] bg-white border-4 border-black flex flex-col overflow-hidden",
                            isMinimized
                                ? "bottom-32 right-8 w-80 h-20"
                                : "bottom-0 right-0 w-full h-[90vh] lg:bottom-32 lg:right-8 lg:w-[450px] lg:h-[650px] lg:shadow-[16px_16px_0px_#000000]"
                        )}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-black text-white border-b-4 border-black">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black italic border-2 border-white">
                                    AI
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest">CASHLY_AI_ASSISTANT</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[#E11D48] animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">NEURAL_LINK_ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleVoiceClick} className="p-2 bg-white text-black border-2 border-white hover:bg-[#E11D48] hover:text-white transition-colors flex items-center gap-2 font-black text-[10px] uppercase shadow-[2px_2px_0px_#E11D48] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                                    <Phone size={18} strokeWidth={3} />
                                </button>
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/20 transition-colors">
                                    {isMinimized ? <Maximize2 size={18} strokeWidth={3} /> : <Minimize2 size={18} strokeWidth={3} />}
                                </button>
                                <button onClick={handleClearChat} className="p-2 hover:bg-white/20 transition-colors">
                                    <RefreshCw size={18} strokeWidth={3} />
                                </button>
                                <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-[#E11D48] transition-colors">
                                    <X size={20} strokeWidth={4} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white" style={{ backgroundImage: 'radial-gradient(#00000011 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 border-4 border-black flex items-center justify-center shrink-0",
                                                msg.role === 'assistant' ? "bg-black text-white" : "bg-white text-black"
                                            )}>
                                                {msg.role === 'assistant' ? <Terminal size={20} /> : <User size={20} />}
                                            </div>
                                            <div className={cn(
                                                "max-w-[80%] p-4 border-4 border-black font-black uppercase text-xs tracking-tight leading-relaxed",
                                                msg.role === 'user'
                                                    ? "bg-black text-white shadow-[6px_6px_0px_#E11D48]"
                                                    : "bg-white text-black shadow-[6px_6px_0px_#000000]"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 border-4 border-black bg-black text-white flex items-center justify-center">
                                                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                            </div>
                                            <div className="p-4 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex gap-2">
                                                <div className="w-2 h-2 bg-black animate-bounce" />
                                                <div className="w-2 h-2 bg-black animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-2 h-2 bg-black animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Actions */}
                                {messages.length <= 2 && (
                                    <div className="px-6 py-4 border-t-4 border-black bg-white">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40">QUICK_SUGGESTIONS:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={() => handleSend(action.message)}
                                                    className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-[10px] font-black transition-colors uppercase tracking-widest"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input */}
                                <div className="p-6 border-t-4 border-black bg-black">
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="SEND_COMMAND..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            disabled={isLoading}
                                            className="flex-1 h-14 bg-white border-4 border-white px-6 font-black uppercase text-xs tracking-widest focus:bg-white focus:text-black transition-all outline-none placeholder:text-black/30"
                                        />
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim() || isLoading}
                                            className="w-14 h-14 bg-[#E11D48] text-white border-4 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                                        >
                                            <Send size={24} strokeWidth={3} />
                                        </button>
                                    </div>
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
