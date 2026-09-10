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
        } catch (error) {
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
        } catch (error) {
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
        recognition.onend = () => { if (!callEndedRef.current) try { recognition.start(); } catch {} };
        recognitionRef.current = recognition;
    }, [handleUserSpeech]);

    useEffect(() => {
        const rec = recognitionRef.current;
        if (!rec) return;
        if (callStatus === 'active' && !isMuted && !isAISpeaking && !isThinking) {
            try { rec.start(); } catch (e) {}
        } else {
            try { rec.stop(); } catch (e) {}
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
                    className="relative flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-[var(--shadow-lg)]"
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E7E5E4] bg-[#FAF8F5] p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="font-display text-lg font-semibold">Voice</h2>
                                <span className="text-xs text-[#78716C]">
                                    {callStatus === 'connecting' ? 'Connecting…' : 'Cashly is ready'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-xs text-[#78716C]">Duration</p>
                                <p className="text-sm font-medium tabular-nums">{formatDuration(callDuration)}</p>
                            </div>
                            <button 
                                onClick={handleEndCall}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#78716C] hover:bg-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#FAF8F5] p-6">
                        
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative">
                                {(isAISpeaking || isThinking) && (
                                    <>
                                        <motion.div 
                                            className="absolute -inset-8 border-[3px] border-black/20"
                                            animate={{ opacity: [0.5, 0], scale: [1, 1.4] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <motion.div 
                                            className="absolute -inset-4 border-[3px] border-[#3b82f6]/40"
                                            animate={{ opacity: [0.8, 0], scale: [1, 1.2] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                        />
                                    </>
                                )}
                                
                                <motion.div 
                                    className={cn(
                                        "w-36 h-36 flex items-center justify-center relative z-10 border-[4px] border-black transition-all duration-300",
                                        isAISpeaking 
                                            ? "bg-[#3b82f6] shadow-[12px_12px_0px_#000] rounded-none" 
                                            : isThinking 
                                                ? "bg-rose-500 shadow-[8px_8px_0px_#000] rounded-none"
                                                : "bg-white shadow-[6px_6px_0px_#000] rounded-none"
                                    )}
                                    animate={isAISpeaking ? { 
                                        scale: [1, 1.08, 1],
                                        rotate: [0, 1, -1, 0]
                                    } : {}}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    {isThinking ? (
                                        <div className="relative">
                                            <div className="w-16 h-16 border-[6px] border-black border-t-white rounded-full animate-spin" />
                                            <Sparkles className="absolute inset-0 m-auto text-white animate-pulse" size={24} />
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Activity 
                                                size={56} 
                                                className={cn("transition-colors", isAISpeaking ? "text-white" : "text-black")} 
                                                strokeWidth={3} 
                                            />
                                            {isAISpeaking && (
                                                <motion.div 
                                                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-black"
                                                    animate={{ opacity: [1, 0, 1] }}
                                                    transition={{ duration: 0.5, repeat: Infinity }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            <h3 className="mt-6 font-display text-xl font-semibold">
                                {voiceName}
                            </h3>
                            
                            <div className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm text-[#57534E] shadow-[var(--shadow-sm)]">
                                <p>
                                    {callStatus === 'connecting'
                                        ? 'Connecting…'
                                        : isAISpeaking
                                            ? 'Speaking…'
                                            : isThinking
                                                ? 'Thinking…'
                                                : !micSupported
                                                    ? 'Type a question'
                                                    : micError
                                                        ? micError
                                                        : isMuted
                                                            ? 'Muted'
                                                            : 'Listening'}
                                </p>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div 
                            ref={transcriptRef}
                            className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-[#E7E5E4] bg-white p-4 scrollbar-none"
                        >
                            {transcript.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-[#A8A29E]">
                                    <Volume2 size={36} />
                                    <p className="mt-3 text-sm">Waiting for a question</p>
                                </div>
                            ) : (
                                transcript.map((msg, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "max-w-[90%] rounded-xl p-3 text-sm",
                                            msg.role === 'ai' 
                                                ? "bg-[#F4F0EB] self-start" 
                                                : "ml-auto bg-[#E11D48] text-white self-end"
                                        )}
                                    >
                                        <p className="mb-1 text-[11px] opacity-70">
                                            {msg.role === 'ai' ? 'Cashly' : 'You'}
                                        </p>
                                        <p className="font-bold text-sm leading-tight">{msg.text}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Waveform */}
                        <div className="mt-8 flex justify-center items-center gap-1.5 h-10">
                            {[...Array(32)].map((_, i) => (
                                <motion.div 
                                    key={i} 
                                    className={cn(
                                        "w-1.5 bg-black",
                                        isAISpeaking && "bg-[#3b82f6]"
                                    )}
                                    animate={{ 
                                        height: isAISpeaking 
                                            ? [4, 32 + Math.random() * 16, 4] 
                                            : isThinking 
                                                ? [8, 16, 8]
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
                    <div className="flex flex-col gap-4 border-t border-[#E7E5E4] bg-white p-5">
                        {(!micSupported || micError) && (
                            <form
                                className="flex gap-3"
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
                                    placeholder="Type a question"
                                    className="h-11 flex-1 rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-sm outline-none focus:border-[#E11D48]"
                                />
                                <button type="submit" className="h-11 rounded-[var(--r-md)] bg-[#E11D48] px-4 text-sm font-medium text-white">
                                    Send
                                </button>
                            </form>
                        )}
                        <div className="flex justify-center items-center gap-10">
                        <button 
                            onClick={() => micSupported && setIsMuted(!isMuted)} 
                            disabled={!micSupported}
                            className={cn(
                                "w-16 h-16 flex items-center justify-center border-[3px] border-black transition-all shadow-[4px_4px_0px_#000]",
                                !micSupported || isMuted ? "bg-rose-500 text-white" : "bg-white text-black hover:bg-black hover:text-white"
                            )}
                        >
                            {isMuted ? <MicOff size={24} strokeWidth={3} /> : <Mic size={24} strokeWidth={3} />}
                        </button>

                        <button 
                            onClick={handleEndCall}
                            className="w-20 h-20 bg-rose-500 text-white border-[3px] border-black shadow-[8px_8px_0px_#000] flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                        >
                            <PhoneOff size={32} strokeWidth={3} />
                        </button>

                        <button 
                            onClick={onEditPreferences}
                            className="w-16 h-16 bg-white text-black border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center transition-all hover:bg-black hover:text-white"
                        >
                            <Settings size={24} strokeWidth={3} />
                        </button>
                    </div>
                    </div>

                    {/* Status Bar */}
                    <div className="border-t border-[#E7E5E4] bg-[#FAF8F5] px-6 py-2 text-center text-xs text-[#78716C]">
                        Cashly voice
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceCallModal;
