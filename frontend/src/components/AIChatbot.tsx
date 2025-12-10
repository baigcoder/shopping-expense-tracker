// AI Financial Assistant Chatbot
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Zap } from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import styles from './AIChatbot.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_ACTIONS = [
    { label: "💰 Save $$", message: "Tips to save money?" },
    { label: "📈 Roast My Spending", message: "Roast my spending habits based on recent trends" },
    { label: "💳 Subscriptions", message: "What subscriptions do I have?" },
    { label: "🚀 Goal Hype", message: "Hype me up for my financial goals!" },
];

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: "Yo! 🤖 I'm your Vibe-Bot. Ask me about your cash, goals, or just rant about inflation. I got you.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            const response = await getAIResponse(text);
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
                content: "My bad, brain freeze 🥶. Try asking again?",
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

    return (
        <>
            {/* Floating Button */}
            <motion.button
                className={styles.floatingBtn}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isOpen ? 180 : 0 }}
            >
                {isOpen ? <X size={24} strokeWidth={3} /> : <MessageSquare size={24} strokeWidth={3} />}
                {!isOpen && <span className={styles.badge}>NEW</span>}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatWindow}
                        initial={{ opacity: 0, y: 50, scale: 0.9, rotate: 5 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.headerInfo}>
                                <div className={styles.botAvatar}>
                                    <Bot size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3>Fin-Bot 3000</h3>
                                    <span className={styles.status}>
                                        <span className={styles.statusDot}></span>
                                        LOCKED IN
                                    </span>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className={styles.messagesContainer}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    className={`${styles.message} ${styles[msg.role]}`}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                >
                                    <div className={styles.messageAvatar}>
                                        {msg.role === 'assistant' ? <Zap size={18} fill="#000" /> : <User size={18} />}
                                    </div>
                                    <div className={styles.messageContent}>
                                        <div className={styles.messageText}>
                                            {msg.content.split('\n').map((line, i) => (
                                                <span key={i}>
                                                    {line}
                                                    {i < msg.content.split('\n').length - 1 && <br />}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    className={`${styles.message} ${styles.assistant}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className={styles.messageAvatar}>
                                        <Loader2 size={18} className={styles.spinner} />
                                    </div>
                                    <div className={styles.typingIndicator}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length <= 2 && (
                            <div className={styles.quickActions}>
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.label}
                                        className={styles.quickAction}
                                        onClick={() => handleSend(action.message)}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                placeholder="Type something..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                            >
                                {isLoading ? <Loader2 size={24} className={styles.spinner} /> : <Send size={24} strokeWidth={3} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatbot;
