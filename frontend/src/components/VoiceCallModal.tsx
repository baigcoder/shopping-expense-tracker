// Voice Call Modal — Elite Brutalist v2
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, PhoneOff, Settings, Activity, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiDataCache } from '../services/aiDataCacheService';
import api from '../services/api';

interface VoiceCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    voiceName: string;
    userId: string;
    userName?: string;
    onEditPreferences?: () => void;
}

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

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
    const [transcript, setTranscript] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [callDuration, setCallDuration] = useState(0);

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
            const maleVoice = voices.find(v => v.name.includes('David') || v.name.includes('Mark')) || voices[0];
            if (maleVoice) utterance.voice = maleVoice;
            utterance.onend = () => setIsAISpeaking(false);
            utterance.onerror = () => setIsAISpeaking(false);
            setIsAISpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const speakWithElevenLabs = useCallback(async (text: string) => {
        const voiceKey = voiceName.toLowerCase();
        const voiceConfig = VOICE_IDS[voiceKey] || VOICE_IDS['jenny'];
        try {
            setIsAISpeaking(true);
            const response = await fetch(`${AI_SERVER_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: voiceConfig.id })
            });
            if (!response.ok) { speakWithWebSpeech(text); return; }
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => { setIsAISpeaking(false); URL.revokeObjectURL(audioUrl); };
            audio.onerror = () => { setIsAISpeaking(false); URL.revokeObjectURL(audioUrl); };
            await audio.play();
        } catch (error) { speakWithWebSpeech(text); }
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
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window)) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event: any) => {
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                }
                if (final.trim()) handleUserSpeech(final.trim());
            };
            recognition.onend = () => { if (!callEndedRef.current) try { recognition.start(); } catch (e) {} };
            recognitionRef.current = recognition;
        }
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
                    className="relative w-full max-w-xl bg-white border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[85vh]"
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="relative p-6 flex justify-between items-center border-b-[3px] border-black bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#3b82f6]">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">AI Voice Assistant</h2>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {callStatus === 'connecting' ? 'Connecting...' : 'Neural Link Active'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right pr-4 border-r-2 border-black">
                                <p className="text-[10px] text-black/40 uppercase font-black tracking-widest">Duration</p>
                                <p className="text-sm font-black text-black">{formatDuration(callDuration)}</p>
                            </div>
                            <button 
                                onClick={handleEndCall}
                                className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_#000]"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="relative flex-1 flex flex-col p-8 overflow-hidden bg-[#F8FAFC]">
                        
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

                            <h3 className="mt-8 text-2xl font-black text-black uppercase tracking-tight italic">
                                {voiceName}
                            </h3>
                            
                            <div className="mt-4 px-6 py-2 bg-black border-2 border-black shadow-[4px_4px_0px_#3b82f6]">
                                <p className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                                    {callStatus === 'connecting' ? 'Booting System...' : isAISpeaking ? 'Transmitting...' : isThinking ? 'Calculating...' : 'Listening...'}
                                </p>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div 
                            ref={transcriptRef}
                            className="flex-1 mt-8 border-[3px] border-black bg-white p-6 overflow-y-auto space-y-6 shadow-inner scrollbar-none"
                        >
                            {transcript.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10">
                                    <Volume2 size={64} strokeWidth={3} />
                                    <p className="mt-4 text-sm font-black uppercase tracking-[0.3em]">Neural Input Awaited</p>
                                </div>
                            ) : (
                                transcript.map((msg, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "max-w-[90%] p-4 border-[3px] border-black relative",
                                            msg.role === 'ai' 
                                                ? "bg-white self-start shadow-[6px_6px_0px_#3b82f6]" 
                                                : "bg-[#000000] text-white self-end shadow-[6px_6px_0px_#3b82f6] ml-auto"
                                        )}
                                    >
                                        <p className="text-[9px] font-black uppercase tracking-widest mb-2 border-b border-current pb-1">
                                            {msg.role === 'ai' ? 'Neural Feedback' : 'User Signal'}
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
                    <div className="p-8 bg-white border-t-[3px] border-black flex justify-center items-center gap-10">
                        <button 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={cn(
                                "w-16 h-16 flex items-center justify-center border-[3px] border-black transition-all shadow-[4px_4px_0px_#000]",
                                isMuted ? "bg-rose-500 text-white" : "bg-white text-black hover:bg-black hover:text-white"
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

                    {/* Status Bar */}
                    <div className="py-2 px-6 bg-black text-center border-t-[3px] border-black">
                        <p className="text-[8px] font-black uppercase text-white tracking-[0.5em]">
                            Cashly Neural Interface — v6.0.4 — Secured
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceCallModal;
