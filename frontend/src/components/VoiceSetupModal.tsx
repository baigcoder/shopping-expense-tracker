// Voice Setup Modal - First-time setup for AI Accountant voice feature
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, User, Sparkles, Check, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '../services/api';

interface VoiceSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSetupComplete: (voiceId: string, voiceName: string) => void;
}

// Python AI Server TTS URL
const AI_SERVER_URL = 'http://localhost:8000';

// Voice options - 2 Female + 2 Male (using edge-tts)
const VOICE_OPTIONS = [
    { id: 'jenny', name: 'Jenny', gender: 'female', description: 'Professional & warm', emoji: '👩‍💼' },
    { id: 'aria', name: 'Aria', gender: 'female', description: 'Expressive & helpful', emoji: '👩‍🏫' },
    { id: 'guy', name: 'Guy', gender: 'male', description: 'Confident & clear', emoji: '👨‍💼' },
    { id: 'davis', name: 'Davis', gender: 'male', description: 'Calm & trustworthy', emoji: '👨‍🏫' },
];

// Sample text for voice preview
const PREVIEW_TEXT = "Hello! I'm your AI Financial Accountant. I can help you track expenses, analyze spending, and provide personalized finance tips.";

const VoiceSetupModal: React.FC<VoiceSetupModalProps> = ({ isOpen, onClose, onSetupComplete }) => {
    const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fallback to browser's Web Speech API
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
            // Stop current playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            window.speechSynthesis?.cancel();
            setIsPreviewing(false);
            return;
        }

        setIsPreviewing(true);

        try {
            // Use Python TTS (FREE edge-tts)
            const shortPreview = `Hi! I'm ${selectedVoice.name}, your AI Financial Accountant. Ready to help you manage your finances!`;

            const response = await fetch(`${AI_SERVER_URL}/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: shortPreview,
                    voice: selectedVoice.id,
                    rate: '+0%',
                    pitch: selectedVoice.gender === 'male' ? '-5Hz' : '+0Hz'
                })
            });

            if (!response.ok) {
                console.log('⚠️ Python TTS unavailable, using Web Speech API...');
                speakWithWebSpeech(shortPreview, selectedVoice.gender === 'male');
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => {
                setIsPreviewing(false);
                URL.revokeObjectURL(audioUrl);
            };
            audioRef.current.play();

        } catch (error) {
            console.error('Voice preview error:', error);
            console.log('⚠️ Falling back to Web Speech API...');
            speakWithWebSpeech("Hi! I'm your AI Financial Accountant. Ready to help!", selectedVoice.gender === 'male');
        }
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/voice/preferences', {
                voiceId: selectedVoice.id,
                voiceName: selectedVoice.name
            });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Failed to save voice preferences');
            }

            toast.success('Voice assistant configured!', {
                description: `${selectedVoice.name} is ready to help with your finances.`
            });

            onSetupComplete(selectedVoice.id, selectedVoice.name);
        } catch (error) {
            console.error('Setup error:', error);
            toast.error('Setup failed', { description: 'Please try again' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                >
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Content */}
                    <div className="relative p-6">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <motion.div
                                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Mic size={36} className="text-white" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Meet Your AI Accountant
                            </h2>
                            <p className="text-white/60 text-sm">
                                Choose a voice for your personal financial assistant
                            </p>
                        </div>

                        {step === 'select' && (
                            <>
                                {/* Voice options */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <motion.button
                                            key={voice.id}
                                            onClick={() => setSelectedVoice(voice)}
                                            className={cn(
                                                "relative p-4 rounded-2xl border-2 transition-all text-left",
                                                selectedVoice.id === voice.id
                                                    ? "bg-violet-500/20 border-violet-500 shadow-lg shadow-violet-500/20"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {selectedVoice.id === voice.id && (
                                                <motion.div
                                                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <Check size={12} className="text-white" />
                                                </motion.div>
                                            )}
                                            <span className="text-2xl mb-2 block">{voice.emoji}</span>
                                            <h3 className="font-bold text-white">{voice.name}</h3>
                                            <p className="text-xs text-white/50">{voice.description}</p>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Preview button */}
                                <motion.button
                                    onClick={handlePreviewVoice}
                                    disabled={isPreviewing && !audioRef.current}
                                    className={cn(
                                        "w-full py-3 px-4 mb-4 rounded-xl border flex items-center justify-center gap-2 transition-colors",
                                        isPreviewing
                                            ? "bg-violet-500/20 border-violet-500 text-violet-300"
                                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                    )}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    {isPreviewing ? (
                                        <>
                                            <motion.div
                                                className="flex gap-0.5"
                                            >
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1 h-4 bg-violet-400 rounded-full"
                                                        animate={{ scaleY: [0.5, 1, 0.5] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                                                    />
                                                ))}
                                            </motion.div>
                                            Playing... (click to stop)
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 size={18} />
                                            Preview {selectedVoice.name}'s voice
                                        </>
                                    )}
                                </motion.button>

                                {/* Continue button */}
                                <motion.button
                                    onClick={() => setStep('confirm')}
                                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-shadow flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Sparkles size={20} />
                                    Continue with {selectedVoice.name}
                                </motion.button>
                            </>
                        )}

                        {step === 'confirm' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Selected voice display */}
                                <div className="bg-white/5 rounded-2xl p-6 mb-6 text-center border border-white/10">
                                    <span className="text-4xl mb-3 block">{selectedVoice.emoji}</span>
                                    <h3 className="text-xl font-bold text-white mb-1">{selectedVoice.name}</h3>
                                    <p className="text-white/60 text-sm">{selectedVoice.description}</p>
                                </div>

                                {/* Features list */}
                                <div className="space-y-3 mb-6">
                                    {[
                                        'Real-time financial insights',
                                        'Budget & spending analysis',
                                        'Personalized savings tips',
                                        'Voice conversation support'
                                    ].map((feature, idx) => (
                                        <motion.div
                                            key={feature}
                                            className="flex items-center gap-3 text-white/80"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Check size={14} className="text-emerald-400" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('select')}
                                        className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <motion.button
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                        className="flex-[2] py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <motion.div
                                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                />
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={18} />
                                                Start Talking
                                            </>
                                        )}
                                    </motion.button>
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
