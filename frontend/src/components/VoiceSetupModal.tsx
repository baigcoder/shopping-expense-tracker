// Voice Setup Modal - Neo-Brutalist Interface
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, User, Sparkles, Check, Volume2, Loader2, Music, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '../services/api';

interface VoiceSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSetupComplete: (voiceId: string, voiceName: string) => void;
}

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

const VOICE_OPTIONS = [
    { id: 'jenny', name: 'Jenny', gender: 'female', description: 'Professional & warm', color: 'bg-pink-400' },
    { id: 'aria', name: 'Aria', gender: 'female', description: 'Expressive & helpful', color: 'bg-purple-400' },
    { id: 'guy', name: 'Guy', gender: 'male', description: 'Confident & clear', color: 'bg-blue-400' },
    { id: 'davis', name: 'Davis', gender: 'male', description: 'Calm & trustworthy', color: 'bg-emerald-400' },
];

const VoiceSetupModal: React.FC<VoiceSetupModalProps> = ({ isOpen, onClose, onSetupComplete }) => {
    const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speakWithWebSpeech = (text: string, isMale: boolean = false) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = isMale ? 0.9 : 1.1;
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = isMale
                ? voices.find(v => v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Male'))
                : voices.find(v => v.name.includes('Google') || v.name.includes('Microsoft'));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onend = () => setIsPreviewing(false);
            utterance.onerror = () => setIsPreviewing(false);
            window.speechSynthesis.speak(utterance);
        } else {
            setIsPreviewing(false);
            toast.error('Speech not supported in this browser');
        }
    };

    const handlePreviewVoice = async () => {
        if (isPreviewing) {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            window.speechSynthesis?.cancel();
            setIsPreviewing(false);
            return;
        }
        setIsPreviewing(true);
        try {
            const shortPreview = `Hi! I'm ${selectedVoice.name}, your AI Financial Assistant. Ready to help you manage your finances!`;
            const response = await fetch(`${AI_SERVER_URL}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: shortPreview,
                    voice: selectedVoice.id,
                    rate: '+0%',
                    pitch: selectedVoice.gender === 'male' ? '-5Hz' : '+0Hz'
                })
            });
            if (!response.ok) { speakWithWebSpeech(shortPreview, selectedVoice.gender === 'male'); return; }
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => { setIsPreviewing(false); URL.revokeObjectURL(audioUrl); };
            audioRef.current.play();
        } catch (error) { speakWithWebSpeech("Hi! I'm your AI assistant!", selectedVoice.gender === 'male'); }
    };

    const handleConfirm = async () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        window.speechSynthesis?.cancel();
        setIsPreviewing(false);
        setIsLoading(true);
        try {
            await api.post('/voice/preferences', { voiceId: selectedVoice.id, voiceName: selectedVoice.name });
            toast.success('Voice assistant configured!', { description: `${selectedVoice.name} is ready.` });
            onSetupComplete(selectedVoice.id, selectedVoice.name);
        } catch (error) {
            toast.error('Setup failed', { description: 'Please try again' });
        } finally { setIsLoading(false); }
    };

    const handleClose = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        window.speechSynthesis?.cancel();
        setIsPreviewing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={handleClose} />
                
                <motion.div 
                    className="relative w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_#000000]"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                >
                    <div className="relative p-8">
                        <button onClick={handleClose} className="absolute top-4 right-4 p-2 border-4 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_#000000] active:shadow-[0px_0px_0px_#000000] active:translate-x-1 active:translate-y-1">
                            <X size={24} strokeWidth={3} />
                        </button>

                        <div className="text-center mb-10">
                            <motion.div 
                                className="w-20 h-20 mx-auto mb-6 border-4 border-black bg-yellow-400 flex items-center justify-center shadow-[6px_6px_0px_#000000]"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Mic size={40} className="text-black" strokeWidth={3} />
                            </motion.div>
                            <h2 className="text-3xl font-black uppercase italic text-black mb-2">MEET YOUR AI</h2>
                            <p className="text-black font-bold opacity-60 uppercase tracking-widest text-sm">Choose a voice for your mission</p>
                        </div>

                        {step === 'select' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <motion.button
                                            key={voice.id}
                                            onClick={() => setSelectedVoice(voice)}
                                            className={cn(
                                                "relative p-5 border-4 transition-all text-left group overflow-hidden flex flex-col min-h-[172px] w-full bg-white text-black",
                                                selectedVoice.id === voice.id
                                                    ? "border-black shadow-[6px_6px_0px_#000000] bg-blue-50 -translate-y-1"
                                                    : "border-black shadow-none hover:shadow-[4px_4px_0px_#000000] hover:-translate-y-1"
                                            )}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {selectedVoice.id === voice.id && (
                                                <div className="absolute top-3 right-3 w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_#000000] z-20">
                                                    <Check size={18} className="text-white" strokeWidth={4} />
                                                </div>
                                            )}
                                            
                                            <div className={cn("w-12 h-12 border-4 border-black mb-4 flex items-center justify-center shadow-[4px_4px_0px_#000000] shrink-0", voice.color)}>
                                                <User size={24} className="text-black" strokeWidth={3} />
                                            </div>
                                            
                                            <div className="flex flex-col flex-grow justify-start">
                                                <h3 className="font-black text-xl uppercase mb-1">{voice.name}</h3>
                                                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 leading-relaxed min-h-[32px]">{voice.description}</p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handlePreviewVoice}
                                        className={cn(
                                            "w-full py-4 px-6 border-4 border-black bg-white font-black uppercase transition-all flex items-center justify-center gap-3",
                                            isPreviewing 
                                                ? "shadow-[2px_2px_0px_#000000] translate-y-1 bg-yellow-100" 
                                                : "shadow-[6px_6px_0px_#000000] hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000]"
                                        )}
                                    >
                                        {isPreviewing ? (
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    {[...Array(4)].map((_, i) => (
                                                        <motion.div key={i} className="w-1.5 bg-black" animate={{ height: [8, 20, 8] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }} />
                                                    ))}
                                                </div>
                                                <span>PLAYING PREVIEW...</span>
                                            </div>
                                        ) : (
                                            <><Volume2 size={24} strokeWidth={3} /> PREVIEW {selectedVoice.name}</>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setStep('confirm')}
                                        className="w-full py-4 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[8px_8px_0px_#E11D48] hover:translate-y-1 hover:shadow-[4px_4px_0px_#E11D48] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={20} strokeWidth={3} /> CONTINUE WITH {selectedVoice.name}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000000] p-8 mb-10 text-center relative">
                                    <div className={cn("w-24 h-24 mx-auto mb-6 border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_#000000]", selectedVoice.color)}>
                                        <User size={48} className="text-black" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase italic text-black mb-2">{selectedVoice.name}</h3>
                                    <p className="text-black font-bold uppercase tracking-widest opacity-60">{selectedVoice.description}</p>
                                </div>

                                <div className="space-y-4 mb-10 border-4 border-black p-6 bg-gray-50 shadow-[6px_6px_0px_#000000]">
                                    {[
                                        { icon: <Activity size={20} strokeWidth={3} />, text: 'REAL-TIME FINANCIAL ANALYSIS' },
                                        { icon: <Music size={20} strokeWidth={3} />, text: 'NATURAL NEURAL ENGINE' },
                                        { icon: <Sparkles size={20} strokeWidth={3} />, text: 'PERSONALIZED STRATEGIES' }
                                    ].map((item, idx) => (
                                        <motion.div key={idx} className="flex items-center gap-4 text-black font-black uppercase" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                                            <div className="w-10 h-10 border-4 border-black bg-blue-100 flex items-center justify-center text-blue-600 shadow-[2px_2px_0px_#000000]">{item.icon}</div>
                                            <span className="text-sm">{item.text}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setStep('select')} 
                                        className="flex-1 py-4 border-4 border-black bg-white font-black uppercase shadow-[6px_6px_0px_#000000] hover:translate-y-1 hover:shadow-[2px_2px_0px_#000000] transition-all"
                                    >
                                        BACK
                                    </button>
                                    <button
                                        onClick={handleConfirm} disabled={isLoading}
                                        className="flex-[2] py-4 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[8px_8px_0px_#E11D48] hover:translate-y-1 hover:shadow-[4px_4px_0px_#E11D48] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Mic size={24} strokeWidth={3} /> INITIALIZE</>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoiceSetupModal;
