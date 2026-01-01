// Voice Call Modal - Live voice conversation with AI Financial Accountant
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiDataCache } from '../services/aiDataCacheService';
import api from '../services/api';

interface VoiceCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceName: string;  // Voice ID: jenny, aria, guy, davis
    userId: string;
    userName?: string;
    onEditPreferences?: () => void;
}

// Python AI Server TTS URL
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

// Voice ID mapping (lowercase to ensure consistency)
const VOICE_IDS: { [key: string]: { id: string; gender: string } } = {
    'jenny': { id: 'jenny', gender: 'female' },
    'aria': { id: 'aria', gender: 'female' },
    'guy': { id: 'guy', gender: 'male' },
    'davis': { id: 'davis', gender: 'male' },
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
    const callEndedRef = useRef(false); // Track if call ended to prevent recognition restart
    const cachedContextRef = useRef<string>(''); // Pre-cached context for faster AI calls

    // Auto-scroll transcript when new messages appear
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript, interimText]);

    // Fallback to browser's Web Speech API
    const speakWithWebSpeech = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 0.9; // Slightly lower for male voice
            utterance.volume = 1.0;

            // Try to find a male voice
            const voices = window.speechSynthesis.getVoices();
            const maleVoice = voices.find(v =>
                v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Guy') || v.name.includes('Male')
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (maleVoice) {
                utterance.voice = maleVoice;
            }

            utterance.onend = () => setIsAISpeaking(false);
            utterance.onerror = () => setIsAISpeaking(false);

            setIsAISpeaking(true);
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Web Speech API not supported');
            setIsAISpeaking(false);
        }
    }, []);

    // Speak using Python edge-tts (FREE!) with selected voice
    const speakWithElevenLabs = useCallback(async (text: string) => {
        // Get voice config from voiceName prop (fallback to jenny)
        const voiceKey = voiceName.toLowerCase();
        const voiceConfig = VOICE_IDS[voiceKey] || VOICE_IDS['jenny'];
        const isMale = voiceConfig.gender === 'male';

        try {
            setIsAISpeaking(true);

            console.log(`🔊 Using Python TTS (edge-tts ${voiceConfig.id} voice)...`);

            const response = await fetch(`${AI_SERVER_URL}/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice: voiceConfig.id,
                    rate: '+0%',
                    pitch: isMale ? '-5Hz' : '+0Hz'  // Slightly deeper for male
                })
            });

            if (!response.ok) {
                console.error('Python TTS error:', response.status);
                console.log('⚠️ Falling back to Web Speech API...');
                speakWithWebSpeech(text);
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Properly cleanup previous audio to prevent pool exhaustion
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
                audioRef.current.src = '';
                audioRef.current.load(); // Release resources
                audioRef.current = null;
            }

            // Create new audio with proper cleanup handlers
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsAISpeaking(false);
                URL.revokeObjectURL(audioUrl);
                if (audioRef.current === audio) {
                    audioRef.current = null;
                }
            };
            audio.onerror = (e) => {
                console.error('Audio playback error:', e);
                setIsAISpeaking(false);
                URL.revokeObjectURL(audioUrl);
                if (audioRef.current === audio) {
                    audioRef.current = null;
                }
            };

            // Try to play with promise handling for autoplay policy
            try {
                await audio.play();
            } catch (playError) {
                console.warn('Audio autoplay blocked:', playError);
                setIsAISpeaking(false);
                URL.revokeObjectURL(audioUrl);
            }
        } catch (error) {
            console.error('TTS error:', error);
            console.log('⚠️ Falling back to Web Speech API...');
            speakWithWebSpeech(text);
        }
    }, [voiceName, speakWithWebSpeech]);

    // Ref to track ongoing fetch requests for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    // Handle user speech -> AI response with FAST endpoint and timeout
    const handleUserSpeech = useCallback(async (userText: string) => {
        if (isAISpeaking || isThinking || !userText.trim() || callEndedRef.current) {
            console.log('⏸️ Skipping speech - AI speaking, thinking, or call ended');
            return;
        }

        console.log('📝 Processing user speech:', userText);
        setTranscript(prev => [...prev, { role: 'user', text: userText }]);
        setIsThinking(true);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // 6 second timeout for faster voice response (reduced from 10s)
        const timeoutId = setTimeout(() => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        }, 6000);

        try {
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

            // Use pre-cached context for INSTANT AI responses (no fetch needed!)
            const contextString = cachedContextRef.current || aiDataCache.buildContextString(await aiDataCache.getCachedData(userId));

            if (isActionCommand) {
                // For action commands, call voice-action endpoint (handles DB operations)
                console.log('🎯 Detected action command, calling voice-action...');
                try {
                    const actionResponse = await api.post('/ai/voice-action', {
                        message: userText,
                        userName: userName
                    }, { signal });

                    const actionData = actionResponse.data;
                    console.log('🎯 Action result:', actionData);
                    if (actionData.action !== 'none') {
                        aiText = actionData.confirmation;
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError' || e.name === 'CanceledError') throw e;
                    console.log('Action endpoint failed, using fast chat...');
                }
            }

            // Use FAST endpoint with pre-cached context (no DB fetch = instant)
            if (!aiText) {
                console.log('⚡ Calling FAST AI chat with cached context...');
                try {
                    const response = await api.post('/ai/chat/fast', {
                        message: userText,
                        context: contextString
                    }, { signal });
                    aiText = response.data.reply || "Could you repeat that?";
                    console.log(`⚡ Fast response in ${response.data.responseTime}ms`);
                } catch (fastError: any) {
                    if (fastError.name === 'AbortError' || fastError.name === 'CanceledError') throw fastError;
                    // Fallback to regular chat only if fast fails
                    console.log('Fast endpoint failed, trying regular chat...');
                    const response = await api.post('/ai/chat', {
                        message: userText,
                        userName: userName
                    }, { signal });
                    aiText = response.data.reply || response.data.response || "Could you repeat that?";
                }
            }

            clearTimeout(timeoutId);

            // Check if call ended while waiting
            if (callEndedRef.current) {
                console.log('⚠️ Call ended, not speaking response');
                return;
            }

            console.log('🔊 AI says:', aiText.substring(0, 50) + '...');
            setIsThinking(false);
            setTranscript(prev => [...prev, { role: 'ai', text: aiText }]);
            await speakWithElevenLabs(aiText);

        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError' || error.name === 'CanceledError') {
                console.log('⚠️ Request aborted (timeout or call ended)');
                if (!callEndedRef.current) {
                    setIsThinking(false);
                    const timeoutMsg = "Sorry, that took too long. Could you try again?";
                    setTranscript(prev => [...prev, { role: 'ai', text: timeoutMsg }]);
                    await speakWithElevenLabs(timeoutMsg);
                }
                return;
            }

            console.error('❌ AI error:', error);
            setIsThinking(false);

            if (!callEndedRef.current) {
                const fallback = "Sorry, I couldn't connect. Please try again.";
                setTranscript(prev => [...prev, { role: 'ai', text: fallback }]);
                await speakWithElevenLabs(fallback);
            }
        } finally {
            abortControllerRef.current = null;
        }
    }, [isAISpeaking, isThinking, userId, userName, speakWithElevenLabs]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            callEndedRef.current = false; // Reset so recognition can work
            setCallStatus('connecting');
            setTranscript([]);
            setIsAISpeaking(false);
            setIsMuted(false);
            setIsMinimized(false);
            setIsThinking(false);
        }
    }, [isOpen]);

    // Initialize call with greeting - FAST
    useEffect(() => {
        if (isOpen && callStatus === 'connecting') {
            // Pre-cache context immediately when call starts
            aiDataCache.getCachedData(userId).then(data => {
                cachedContextRef.current = aiDataCache.buildContextString(data);
                console.log('⚡ Context pre-cached for fast responses');
            });

            const timer = setTimeout(async () => {
                setCallStatus('active');

                const financialData = await aiDataCache.getCachedData(userId);
                const txCount = financialData?.transactions?.length || 0;

                // Get proper display name
                const displayName = userName && userName !== 'there' ? `Sir ${userName}` : '';
                // Shorter, faster greeting
                const greeting = displayName
                    ? `Hello ${displayName}! I'm ready to help with your finances. What would you like to know?`
                    : `Hello! I'm ${voiceName}, your AI assistant. How can I help?`;
                setTranscript([{ role: 'ai', text: greeting }]);
                speakWithElevenLabs(greeting);
            }, 800); // Reduced from 1500ms to 800ms

            return () => clearTimeout(timer);
        }
    }, [isOpen, callStatus, voiceName, userId, userName, speakWithElevenLabs]);

    // Ref to hold handleUserSpeech so we don't recreate recognition on every change
    const handleUserSpeechRef = useRef(handleUserSpeech);
    handleUserSpeechRef.current = handleUserSpeech;

    // Speech recognition setup - only once
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            // Accumulator for building complete sentences on mobile
            let accumulatedText = '';
            let silenceTimer: NodeJS.Timeout | null = null;
            const SILENCE_DELAY = 1000; // Wait 1s of silence before sending (faster response)

            const sendAccumulatedText = () => {
                if (accumulatedText.trim() && !callEndedRef.current) {
                    console.log('🎤 Final accumulated speech:', accumulatedText.trim());
                    handleUserSpeechRef.current(accumulatedText.trim());
                    accumulatedText = '';
                    setInterimText('');
                }
            };

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

                // Accumulate final text (mobile often sends one word at a time)
                if (final.trim()) {
                    accumulatedText += ' ' + final;
                    accumulatedText = accumulatedText.trim();
                    console.log('🎤 Accumulated so far:', accumulatedText);

                    // Clear any existing silence timer
                    if (silenceTimer) clearTimeout(silenceTimer);

                    // Set a timer to send after silence (user stopped speaking)
                    silenceTimer = setTimeout(sendAccumulatedText, SILENCE_DELAY);
                }

                // Show interim + accumulated as preview
                const previewText = accumulatedText + (interim ? ' ' + interim : '');
                setInterimText(previewText.trim());
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                // On mobile, 'no-speech' is common - just restart quickly
                if (event.error !== 'aborted' && !callEndedRef.current) {
                    setTimeout(() => {
                        if (!callEndedRef.current) {
                            try { recognition.start(); } catch (e) { }
                        }
                    }, 100); // Fast restart for mobile
                }
            };

            recognition.onend = () => {
                // Send any accumulated text before restarting
                if (silenceTimer) {
                    clearTimeout(silenceTimer);
                    sendAccumulatedText();
                }

                // Auto-restart immediately for continuous listening (mobile stops often)
                if (!callEndedRef.current) {
                    setTimeout(() => {
                        if (!callEndedRef.current) {
                            try { recognition.start(); } catch (e) { }
                        }
                    }, 50); // Very fast restart for mobile
                }
            };

            recognitionRef.current = recognition;

            return () => {
                if (silenceTimer) clearTimeout(silenceTimer);
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
        callEndedRef.current = true; // Prevent recognition from restarting
        setCallStatus('ended');
        setIsThinking(false);
        setIsAISpeaking(false);

        // Abort any ongoing API requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop Web Speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Stop speech recognition immediately
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
                recognitionRef.current.stop();
            } catch (e) { }
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

        // Close modal immediately (no farewell delay for faster exit)
        onClose();
    };

    if (!isOpen) return null;

    // Mini UI mode - floating pill at bottom
    if (isMinimized) {
        return (
            <motion.div
                className="fixed bottom-[205px] right-4 z-[9999] lg:bottom-20"
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
