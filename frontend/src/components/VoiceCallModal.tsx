// Voice Call Modal — Elite Brutalist v2
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff, Settings, Activity, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiDataCache } from '../services/aiDataCacheService';
import api from '../services/api';
import { fetchCashlyVoiceAudio } from '../services/voiceTts';

interface VoiceCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceName: string;
    userId: string;
    userName?: string;
    onEditPreferences?: () => void;
}

const VOICE_IDS: { [key: string]: { id: string; gender: string } } = {
    'jenny': { id: 'jenny', gender: 'female' },
    'aria': { id: 'aria', gender: 'female' },
    'guy': { id: 'guy', gender: 'male' },
    'davis': { id: 'davis', gender: 'male' },
};

const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    const speechWindow = window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
};

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
    isOpen, onClose, voiceName, userId, userName = 'there', onEditPreferences
}) => {
    const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [callDuration, setCallDuration] = useState(0);
    const [micSupported, setMicSupported] = useState(() => !!getSpeechRecognition());
    const [typedMessage, setTypedMessage] = useState('');
    const [micError, setMicError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const callEndedRef = useRef(false);
    const cachedContextRef = useRef<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    useEffect(() => {
        if (callStatus === 'active') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [callStatus]);

    const speakWithWebSpeech = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const wantFemale = (VOICE_IDS[voiceName.toLowerCase()] || VOICE_IDS.jenny).gender === 'female';
            const matched = voices.find((voice) => {
                const name = voice.name.toLowerCase();
                return wantFemale
                    ? /female|zira|samantha|susan|karen|google uk english female/.test(name)
                    : /male|david|mark|daniel|google uk english male/.test(name);
            }) || voices[0];
            if (matched) utterance.voice = matched;
            utterance.onend = () => setIsAISpeaking(false);
            utterance.onerror = () => setIsAISpeaking(false);
            setIsAISpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    }, [voiceName]);

    const speakWithElevenLabs = useCallback(async (text: string) => {
        const voiceKey = voiceName.toLowerCase();
        const voiceConfig = VOICE_IDS[voiceKey] || VOICE_IDS['jenny'];
        try {
            setIsAISpeaking(true);
            const audioBlob = await fetchCashlyVoiceAudio(text, voiceConfig.id);
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => { setIsAISpeaking(false); URL.revokeObjectURL(audioUrl); };
            audio.onerror = () => { setIsAISpeaking(false); URL.revokeObjectURL(audioUrl); speakWithWebSpeech(text); };
            await audio.play();
        } catch {
            speakWithWebSpeech(text);
        }
    }, [voiceName, speakWithWebSpeech]);

    const handleUserSpeech = useCallback(async (userText: string) => {
        if (isAISpeaking || isThinking || !userText.trim() || callEndedRef.current) return;
        setTranscript(prev => [...prev, { role: 'user', text: userText }]);
        setIsThinking(true);
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const contextString = cachedContextRef.current || aiDataCache.buildContextString(await aiDataCache.getCachedData(userId));
            const response = await api.post('/ai/chat/fast', { message: userText, context: contextString }, { signal });
            const aiText = response.data.reply || "I'm sorry, I couldn't catch that. Could you repeat?";
            setIsThinking(false);
            setTranscript(prev => [...prev, { role: 'ai', text: aiText }]);
            await speakWithElevenLabs(aiText);
        } catch {
            setIsThinking(false);
            if (!callEndedRef.current) {
                setTranscript(prev => [...prev, { role: 'ai', text: "I couldn't reach Cashly just now. Try again." }]);
            }
        }
    }, [isAISpeaking, isThinking, userId, speakWithElevenLabs]);

    useEffect(() => {
        if (isOpen) {
            callEndedRef.current = false;
            setCallStatus('connecting');
            setTranscript([]);
            setCallDuration(0);
            aiDataCache.getCachedData(userId).then(data => {
                cachedContextRef.current = aiDataCache.buildContextString(data);
            });
            setTimeout(() => {
                setCallStatus('active');
                const greeting = `Hey ${userName}! I'm listening. How's your spending looking today?`;
                setTranscript([{ role: 'ai', text: greeting }]);
                speakWithElevenLabs(greeting);
            }, 1500);
        }
    }, [isOpen, userId, userName, speakWithElevenLabs]);

    useEffect(() => {
        const Recognition = getSpeechRecognition();
        setMicSupported(!!Recognition);
        if (!Recognition) {
            recognitionRef.current = null;
            return;
        }
        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
            }
            if (final.trim()) handleUserSpeech(final.trim());
        };
        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setMicError('Microphone permission is blocked.');
            }
        };
        recognition.onend = () => {
            if (!callEndedRef.current) {
                try {
                    recognition.start();
                } catch {
                    // Ignore restart race
                }
            }
        };
        recognitionRef.current = recognition;
    }, [handleUserSpeech]);

    useEffect(() => {
        const rec = recognitionRef.current;
        if (!rec) return;
        if (callStatus === 'active' && !isMuted && !isAISpeaking && !isThinking) {
            try {
                rec.start();
            } catch {
                // Ignore start collision
            }
        } else {
            try {
                rec.stop();
            } catch {
                // Ignore stop collision
            }
        }
    }, [callStatus, isMuted, isAISpeaking, isThinking]);

    const handleEndCall = () => {
        callEndedRef.current = true;
        setCallStatus('ended');
        if (abortControllerRef.current) abortControllerRef.current.abort();
        if (recognitionRef.current) recognitionRef.current.stop();
        if (audioRef.current) audioRef.current.pause();
        window.speechSynthesis?.cancel();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
                <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleEndCall} />

                <motion.div 
                    className="relative flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
                    initial={{ scale: 0.95, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ai-subtle)] text-[var(--color-ai)] border border-[var(--color-ai)]/20">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h2 className="font-sans text-base font-bold text-[var(--color-text-primary)]">Cashly Voice Co-Pilot</h2>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {callStatus === 'connecting' ? 'Connecting…' : 'Active Financial Operator'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-mono">Duration</p>
                                <p className="text-xs font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">{formatDuration(callDuration)}</p>
                            </div>
                            <button 
                                onClick={handleEndCall}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden bg-[var(--color-surface-subtle)] p-6">
                        
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative">
                                {(isAISpeaking || isThinking) && (
                                    <>
                                        <motion.div 
                                            className="absolute -inset-6 rounded-full border border-[var(--color-ai)]/20"
                                            animate={{ opacity: [0.6, 0], scale: [1, 1.4] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <motion.div 
                                            className="absolute -inset-3 rounded-full border border-[var(--color-ai)]/40"
                                            animate={{ opacity: [0.8, 0], scale: [1, 1.2] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                        />
                                    </>
                                )}
                                
                                <motion.div 
                                    className={cn(
                                        "w-28 h-28 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 shadow-md",
                                        isAISpeaking 
                                            ? "bg-gradient-to-tr from-[var(--color-ai)] to-violet-400 text-white shadow-[0_0_24px_rgba(117,71,199,0.35)]" 
                                            : isThinking 
                                                ? "bg-gradient-to-tr from-[var(--color-brand)] to-rose-400 text-white shadow-[0_0_24px_rgba(217,47,87,0.35)]"
                                                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                                    )}
                                    animate={isAISpeaking ? { 
                                        scale: [1, 1.05, 1],
                                    } : {}}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    {isThinking ? (
                                        <div className="relative flex items-center justify-center">
                                            <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <Sparkles className="absolute inset-0 m-auto text-white animate-pulse" size={18} />
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Activity 
                                                size={42} 
                                                className={cn("transition-colors", isAISpeaking ? "text-white" : "text-[var(--color-ai)]")} 
                                                strokeWidth={2.5} 
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            <h3 className="mt-4 font-sans text-lg font-bold text-[var(--color-text-primary)] capitalize">
                                {voiceName}
                            </h3>
                            
                            <div className="mt-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-3.5 py-1 text-xs text-[var(--color-text-secondary)] shadow-xs">
                                <p>
                                    {callStatus === 'connecting'
                                        ? 'Connecting…'
                                        : isAISpeaking
                                            ? 'Speaking…'
                                            : isThinking
                                                ? 'Thinking…'
                                                : !micSupported
                                                    ? 'Type a question below'
                                                    : micError
                                                        ? micError
                                                        : isMuted
                                                            ? 'Microphone Muted'
                                                            : 'Listening to your voice'}
                                </p>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div 
                            ref={transcriptRef}
                            className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 scrollbar-none"
                        >
                            {transcript.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-[var(--color-text-muted)]">
                                    <Volume2 size={32} />
                                    <p className="mt-2 text-xs">Waiting for your question...</p>
                                </div>
                            ) : (
                                transcript.map((msg, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: msg.role === 'ai' ? -8 : 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "max-w-[85%] rounded-xl p-3 text-xs leading-relaxed",
                                            msg.role === 'ai' 
                                                ? "bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] self-start" 
                                                : "ml-auto bg-[var(--color-brand)] text-white self-end shadow-xs"
                                        )}
                                    >
                                        <p className="mb-0.5 text-[10px] font-semibold opacity-80 uppercase tracking-wider">
                                            {msg.role === 'ai' ? 'Cashly Voice' : 'You'}
                                        </p>
                                        <p className="font-medium text-xs leading-normal">{msg.text}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Waveform */}
                        <div className="mt-4 flex justify-center items-center gap-1 h-8">
                            {[...Array(28)].map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    className={cn(
                                        "w-1 rounded-full",
                                        isAISpeaking ? "bg-[var(--color-ai)]" : "bg-[var(--color-border)]"
                                    )}
                                    animate={{ 
                                        height: isAISpeaking 
                                            ? [4, 24 + Math.random() * 8, 4] 
                                            : isThinking 
                                                ? [6, 14, 6]
                                                : [4, 6, 4],
                                    }} 
                                    transition={{ 
                                        duration: 0.25, 
                                        repeat: Infinity, 
                                        delay: i * 0.02,
                                    }} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                        {(!micSupported || micError) && (
                            <form
                                className="flex gap-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const text = typedMessage.trim();
                                    if (!text) return;
                                    setTypedMessage('');
                                    void handleUserSpeech(text);
                                }}
                            >
                                <input
                                    value={typedMessage}
                                    onChange={(event) => setTypedMessage(event.target.value)}
                                    placeholder="Type your question..."
                                    className="h-9 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 text-xs outline-none focus:border-[var(--color-ai)] text-[var(--color-text-primary)]"
                                />
                                <button type="submit" className="h-9 rounded-xl bg-[var(--color-ai)] px-3 text-xs font-semibold text-white">
                                    Send
                                </button>
                            </form>
                        )}
                        <div className="flex justify-center items-center gap-8 py-1">
                            <button 
                                onClick={() => micSupported && setIsMuted(!isMuted)} 
                                disabled={!micSupported}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-xs",
                                    !micSupported || isMuted 
                                        ? "bg-[var(--color-danger)] text-white border-transparent" 
                                        : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]"
                                )}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>

                            <button 
                                onClick={handleEndCall}
                                className="w-14 h-14 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95"
                            >
                                <PhoneOff size={22} />
                            </button>

                            <button 
                                onClick={onEditPreferences}
                                className="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center transition-all shadow-xs hover:border-[var(--color-text-secondary)]"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-2 text-center text-[11px] text-[var(--color-text-muted)] font-mono">
                        Cashly AI Realtime Voice Link
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceCallModal;
