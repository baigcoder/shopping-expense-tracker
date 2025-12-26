// Voice Call Modal - Live voice conversation with AI Accountant
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiDataCache } from '../services/aiDataCacheService';

interface VoiceCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceName: string;
    userId: string;
    userName?: string;
    onEditPreferences?: () => void;
}

const ELEVENLABS_API_KEY = 'sk_3ae9dbc346577d9a2272ce718a0e052468eac0f3fcaef7db';

const VOICE_IDS: { [key: string]: string } = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Emily': 'MF3mGyEYCl7XYWbV9V6O',
    'Josh': 'TxGEqnHWrfWFTfGW9XjX',
};

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
    isOpen, onClose, voiceName, userId, userName = 'there', onEditPreferences
}) => {
    const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [interimText, setInterimText] = useState('');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript when new messages appear
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript, interimText]);

    // Speak using ElevenLabs
    const speakWithElevenLabs = useCallback(async (text: string) => {
        const voiceId = VOICE_IDS[voiceName] || VOICE_IDS['Rachel'];

        try {
            setIsAISpeaking(true);

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=4&output_format=mp3_44100_64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_flash_v2_5',
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                })
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => {
                setIsAISpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
            audioRef.current.play();
        } catch (error) {
            console.error('ElevenLabs error:', error);
            setIsAISpeaking(false);
        }
    }, [voiceName]);

    // Handle user speech -> AI response
    const handleUserSpeech = useCallback(async (userText: string) => {
        if (isAISpeaking || isThinking || !userText.trim()) {
            console.log('⏸️ Skipping speech - AI speaking or thinking');
            return;
        }

        console.log('📝 Processing user speech:', userText);
        setTranscript(prev => [...prev, { role: 'user', text: userText }]);
        setIsThinking(true);

        try {
            // Get user ID for AI request
            const token = localStorage.getItem('sb-ynmvjnsdygimhjxcjvzp-auth-token');
            const parsed = token ? JSON.parse(token) : null;
            const supabaseUserId = parsed?.user?.id;

            const textLower = userText.toLowerCase();
            // Check if this is an action command
            const isActionCommand =
                textLower.includes('add') ||
                textLower.includes('create') ||
                textLower.includes('set') ||
                textLower.includes('save') ||
                textLower.includes('remind') ||
                textLower.includes('goal') ||
                textLower.includes('budget') ||
                textLower.includes('spent') ||
                textLower.includes('expense');

            let aiText = '';

            if (isActionCommand) {
                // Try voice-action endpoint for commands
                console.log('🎯 Detected action command, calling voice-action...');
                const actionResponse = await fetch('http://localhost:5000/api/ai/voice-action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': supabaseUserId || userId
                    },
                    body: JSON.stringify({
                        message: userText,
                        userName: userName
                    })
                });

                if (actionResponse.ok) {
                    const actionData = await actionResponse.json();
                    console.log('🎯 Action result:', actionData);

                    if (actionData.action !== 'none' && actionData.success) {
                        aiText = actionData.confirmation;
                    } else {
                        // Fall back to chat for non-action or failed action
                        aiText = actionData.confirmation || '';
                    }
                }
            }

            // If no action response, use regular chat
            if (!aiText) {
                console.log('🤖 Calling AI chat...');
                const response = await fetch('http://localhost:5000/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': supabaseUserId || userId
                    },
                    body: JSON.stringify({
                        message: userText,
                        userName: userName
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    aiText = data.reply || data.response || "Could you repeat that?";
                } else {
                    throw new Error(`API returned ${response.status}`);
                }
            }

            console.log('🔊 AI says:', aiText.substring(0, 50) + '...');
            setIsThinking(false);
            setTranscript(prev => [...prev, { role: 'ai', text: aiText }]);
            await speakWithElevenLabs(aiText);

        } catch (error) {
            console.error('❌ AI error:', error);
            setIsThinking(false);
            const fallback = "Sorry, I'm having trouble connecting. Please try again.";
            setTranscript(prev => [...prev, { role: 'ai', text: fallback }]);
            await speakWithElevenLabs(fallback);
        }
    }, [isAISpeaking, isThinking, speakWithElevenLabs]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCallStatus('connecting');
            setTranscript([]);
            setIsAISpeaking(false);
            setIsMuted(false);
            setIsMinimized(false);
            setIsThinking(false);
        }
    }, [isOpen]);

    // Initialize call with greeting
    useEffect(() => {
        if (isOpen && callStatus === 'connecting') {
            const timer = setTimeout(async () => {
                setCallStatus('active');

                const financialData = await aiDataCache.getCachedData(userId);
                const txCount = financialData?.transactions?.length || 0;

                // Get proper display name
                const displayName = userName && userName !== 'there' ? `Sir ${userName}` : '';
                const greeting = displayName
                    ? `Hello ${displayName}! I'm ${voiceName}, your AI financial assistant. I can see you have ${txCount} transactions on record. How may I assist you with your finances today?`
                    : `Hello! I'm ${voiceName}, your AI financial assistant. How can I help you today?`;
                setTranscript([{ role: 'ai', text: greeting }]);
                speakWithElevenLabs(greeting);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isOpen, callStatus, voiceName, userId, userName, speakWithElevenLabs]);

    // Ref to hold handleUserSpeech so we don't recreate recognition on every change
    const handleUserSpeechRef = useRef(handleUserSpeech);
    handleUserSpeechRef.current = handleUserSpeech;

    // Speech recognition setup - only once
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptText = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcriptText;
                    } else {
                        interim += transcriptText;
                    }
                }

                setInterimText(interim);

                if (final.trim()) {
                    console.log('🎤 Final speech:', final.trim());
                    handleUserSpeechRef.current(final.trim());
                    setInterimText('');
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    // Restart on errors other than no-speech
                    setTimeout(() => {
                        try { recognition.start(); } catch (e) { }
                    }, 500);
                }
            };

            recognition.onend = () => {
                // Auto-restart - check current state via DOM
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, 200);
            };

            recognitionRef.current = recognition;

            return () => {
                try { recognition.stop(); } catch (e) { }
            };
        }
    }, []); // Only run once

    // Start/stop recognition based on state
    useEffect(() => {
        const rec = recognitionRef.current;
        if (!rec) return;

        if (callStatus === 'active' && !isMuted && !isAISpeaking && !isThinking) {
            console.log('🎤 Starting speech recognition');
            try { rec.start(); } catch (e) { } // May already be started
        } else {
            console.log('🎤 Stopping speech recognition');
            try { rec.stop(); } catch (e) { }
        }
    }, [callStatus, isMuted, isAISpeaking, isThinking]);

    const handleEndCall = () => {
        // Stop everything immediately
        setCallStatus('ended');

        // Stop speech recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
            recognitionRef.current = null;
        }

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch (e) { }
            audioContextRef.current = null;
        }

        // Add farewell to transcript (visible but not spoken for quick exit)
        const farewellName = userName && userName !== 'there' ? `, Sir ${userName}` : '';
        setTranscript(prev => [...prev, {
            role: 'ai',
            text: `Goodbye${farewellName}! It was great helping you today. 👋`
        }]);

        // Close modal after brief delay to show farewell
        setTimeout(onClose, 800);
    };

    if (!isOpen) return null;

    // Mini UI mode - floating pill at bottom
    if (isMinimized) {
        return (
            <motion.div
                className="fixed bottom-20 right-6 z-[9999]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-xl shadow-violet-500/30">
                    {/* Avatar */}
                    <motion.div
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg"
                        animate={isAISpeaking ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.6, repeat: isAISpeaking ? Infinity : 0 }}
                    >
                        👩‍💼
                    </motion.div>

                    {/* Status */}
                    <div className="mr-2">
                        <p className="text-xs font-medium">{voiceName}</p>
                        <p className="text-[10px] opacity-75">
                            {isAISpeaking ? 'Speaking...' : 'Listening...'}
                        </p>
                    </div>

                    {/* Waveform mini */}
                    <div className="flex gap-0.5 mr-2">
                        {[0, 1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 bg-white/80 rounded-full"
                                animate={{
                                    height: isAISpeaking ? [6, 16, 6] : [4, 8, 4]
                                }}
                                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                            />
                        ))}
                    </div>

                    {/* Controls */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"
                        )}
                    >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    <button
                        onClick={() => setIsMinimized(false)}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                    >
                        <Maximize2 size={16} />
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="p-2 rounded-full bg-red-500 hover:bg-red-600"
                    >
                        <PhoneOff size={16} />
                    </button>
                </div>
            </motion.div>
        );
    }

    // Full UI
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl"
                    onClick={() => setIsMinimized(true)}
                />

                <motion.div
                    className="relative w-full max-w-lg"
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                >
                    {/* Header buttons */}
                    <div className="absolute -top-12 right-0 flex gap-2">
                        {onEditPreferences && (
                            <button
                                onClick={() => { handleEndCall(); onEditPreferences(); }}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80"
                                title="Change voice"
                            >
                                <Settings size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80"
                            title="Minimize"
                        >
                            <Minimize2 size={18} />
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="text-center mb-6">
                        <motion.div
                            className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-5xl shadow-2xl shadow-violet-500/40"
                            animate={isAISpeaking ? { scale: [1, 1.08, 1] } : {}}
                            transition={{ duration: 0.8, repeat: isAISpeaking ? Infinity : 0 }}
                        >
                            👩‍💼
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mt-3">{voiceName}</h2>
                        <p className={cn(
                            "text-sm font-medium",
                            callStatus === 'connecting' ? "text-amber-400" :
                                callStatus === 'active' ? (isThinking ? "text-blue-400" : "text-emerald-400") : "text-red-400"
                        )}>
                            {callStatus === 'connecting' && 'Connecting...'}
                            {callStatus === 'active' && (
                                isAISpeaking ? '🔊 Speaking...' :
                                    isThinking ? '💭 Thinking...' :
                                        '🎤 Listening...'
                            )}
                            {callStatus === 'ended' && 'Call ended'}
                        </p>
                    </div>

                    {/* Waveform */}
                    {callStatus === 'active' && (
                        <div className="flex justify-center gap-1 h-12 mb-4">
                            {[...Array(16)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={cn(
                                        "w-1.5 rounded-full",
                                        isAISpeaking ? "bg-violet-400" : "bg-emerald-400"
                                    )}
                                    animate={{
                                        height: isAISpeaking ? [6, 30 + Math.sin(i) * 15, 6] : [4, 12, 4]
                                    }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Transcript */}
                    <div ref={transcriptRef} className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-4 max-h-40 overflow-y-auto scroll-smooth">
                        {transcript.length === 0 ? (
                            <p className="text-white/50 text-center text-sm py-2">
                                {callStatus === 'connecting' ? 'Initializing...' : 'Conversation will appear here...'}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {transcript.map((msg, idx) => (
                                    <p key={idx} className={cn(
                                        "text-sm",
                                        msg.role === 'ai' ? "text-violet-200" : "text-emerald-200"
                                    )}>
                                        <span className="font-bold">{msg.role === 'ai' ? voiceName : 'You'}: </span>
                                        {msg.text}
                                    </p>
                                ))}
                                {interimText && (
                                    <p className="text-sm text-emerald-300/60 italic">You: {interimText}...</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        <motion.button
                            onClick={() => setIsMuted(!isMuted)}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center",
                                isMuted ? "bg-red-500/20 text-red-400 border-2 border-red-500/50" : "bg-white/10 text-white border-2 border-white/20"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </motion.button>

                        <motion.button
                            onClick={handleEndCall}
                            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <PhoneOff size={22} />
                        </motion.button>
                    </div>

                    <p className="text-center text-white/40 text-xs mt-4">
                        💡 Speak naturally - I'm listening! Click backdrop to minimize.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceCallModal;
