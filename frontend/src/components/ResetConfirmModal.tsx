// Reset Confirm Modal - Premium OTP-verified data reset
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, CheckCircle, Mail, Shield, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResetConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: 'transactions' | 'goals' | 'subscriptions' | 'bills' | 'cards' | 'all';
    categoryLabel: string;
    onResetComplete?: () => void;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
    isOpen,
    onClose,
    category,
    categoryLabel,
    onResetComplete
}) => {
    const [step, setStep] = useState<'confirm' | 'otp' | 'success'>('confirm');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getAuthToken = async () => {
        try {
            // Try getting from Supabase client directly
            const { supabase } = await import('../config/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                return session.access_token;
            }

            // Fallback to localStorage
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                return parsed?.state?.session?.access_token;
            }
        } catch {
            return null;
        }
        return null;
    };

    const requestOTP = async () => {
        setLoading(true);
        setError('');

        try {
            const token = await getAuthToken();
            if (!token) {
                setError('Please sign in again');
                return;
            }

            const response = await fetch('/api/reset/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ category })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setStep('otp');
            toast.success('Verification code sent to your email');
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = await getAuthToken();
            if (!token) {
                setError('Please sign in again');
                return;
            }

            const response = await fetch('/api/reset/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset data');
            }

            setStep('success');
            toast.success(`${categoryLabel} data has been reset`);

            setTimeout(() => {
                onResetComplete?.();
                handleClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('confirm');
        setOtp('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0_#E11D48] overflow-hidden"
                >
                    {/* Danger Header */}
                    <div className="bg-black p-6 text-white relative border-b-4 border-[#E11D48]">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 border-2 border-white hover:bg-[#E11D48] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 bg-[#E11D48] border-2 border-white">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-wide">Reset {categoryLabel}</h2>
                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">This action cannot be undone</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {step === 'confirm' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-[#FFF1F2] border-[3px] border-black p-4 shadow-[4px_4px_0_#E11D48]">
                                    <p className="text-sm text-black font-bold uppercase tracking-wide">
                                        ⚠️ You are about to permanently delete all your <strong>{categoryLabel.toLowerCase()}</strong> data.
                                        This action is irreversible.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#09090B]">
                                    <Mail size={20} className="text-[#E11D48]" />
                                    <p className="text-sm text-zinc-700 font-bold uppercase tracking-wide">
                                        A verification code will be sent to your email
                                    </p>
                                </div>

                                {error && (
                                    <p className="text-sm text-[#E11D48] font-black uppercase text-center">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-3 px-4 bg-white border-2 border-black font-black uppercase text-xs tracking-widest text-black hover:bg-zinc-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={requestOTP}
                                        disabled={loading}
                                        className="flex-1 py-3 px-4 bg-[#E11D48] border-2 border-black shadow-[3px_3px_0_#09090B] font-black uppercase text-xs tracking-widest text-white hover:bg-[#BE123C] transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Shield size={18} />
                                                Send Code
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'otp' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <p className="text-slate-600 text-sm">
                                        Enter the 6-digit code sent to your email
                                    </p>
                                </div>

                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 px-6 bg-white border-[3px] border-black focus:border-[#E11D48] focus:shadow-[4px_4px_0_#E11D48] focus:outline-none transition-all"
                                />

                                {error && (
                                    <p className="text-sm text-[#E11D48] font-black uppercase text-center">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('confirm')}
                                        className="flex-1 py-3 px-4 bg-white border-2 border-black font-black uppercase text-xs tracking-widest text-black hover:bg-zinc-100 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmReset}
                                        disabled={loading || otp.length !== 6}
                                        className={cn(
                                            "flex-1 py-3 px-4 border-2 border-black font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2",
                                            otp.length === 6
                                                ? "bg-[#E11D48] text-white shadow-[3px_3px_0_#09090B] hover:bg-[#BE123C]"
                                                : "bg-zinc-100 text-zinc-400 border-zinc-300 cursor-not-allowed"
                                        )}
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                Delete Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-20 h-20 bg-black border-2 border-black shadow-[6px_6px_0_#E11D48] flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle size={40} className="text-[#E11D48]" />
                                </motion.div>
                                <h3 className="text-xl font-black uppercase tracking-wide text-black">Data Reset Complete</h3>
                                <p className="text-sm text-zinc-500 font-medium">
                                    Your {categoryLabel.toLowerCase()} data has been permanently deleted.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ResetConfirmModal;
