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
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-rose-100"
                >
                    {/* Danger Header */}
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 text-white relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black">Reset {categoryLabel}</h2>
                                <p className="text-sm opacity-80 font-medium">This action cannot be undone</p>
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
                                <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4">
                                    <p className="text-sm text-rose-800 font-medium">
                                        ⚠️ You are about to permanently delete all your <strong>{categoryLabel.toLowerCase()}</strong> data.
                                        This action is irreversible.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <Mail size={20} className="text-slate-400" />
                                    <p className="text-sm text-slate-600">
                                        A verification code will be sent to your email
                                    </p>
                                </div>

                                {error && (
                                    <p className="text-sm text-rose-500 font-medium text-center">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={requestOTP}
                                        disabled={loading}
                                        className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
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
                                    className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 px-6 bg-slate-50 border-3 border-slate-200 rounded-2xl focus:border-rose-400 focus:outline-none transition-colors"
                                />

                                {error && (
                                    <p className="text-sm text-rose-500 font-medium text-center">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('confirm')}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmReset}
                                        disabled={loading || otp.length !== 6}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                            otp.length === 6
                                                ? "bg-rose-500 hover:bg-rose-600 text-white"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle size={40} className="text-green-500" />
                                </motion.div>
                                <h3 className="text-xl font-black text-slate-800">Data Reset Complete</h3>
                                <p className="text-sm text-slate-500">
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
