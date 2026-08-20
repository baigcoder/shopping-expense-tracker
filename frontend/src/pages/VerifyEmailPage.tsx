import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, Mail, Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { verifyOTP, resendOTP } from '../services/otpService';
import { soundManager } from '@/lib/sounds';

const OTP_LENGTH = 6;

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = (location.state as any)?.email || '';
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [status, setStatus] = useState<'idle' | 'verifying' | 'VERIFIED_SUCCESSFULLY' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        const next = [...otp];
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i];
        }
        setOtp(next);
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== OTP_LENGTH) {
            toast.error('Enter the full 6-digit code');
            return;
        }
        soundManager.play('click');
        setStatus('verifying');
        setErrorMessage('');
        try {
            const result = await verifyOTP(email, code);
            if (result.success) {
                soundManager.play('success');
                setStatus('VERIFIED_SUCCESSFULLY');
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Verification failed');
                soundManager.play('error');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Verification failed');
            soundManager.play('error');
            setOtp(Array(OTP_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (!email || resending) return;
        setResending(true);
        try {
            const result = await resendOTP(email);
            if (result.success) {
                toast.success('NEW_CODE_SENT');
                setOtp(Array(OTP_LENGTH).fill(''));
                setStatus('idle');
                setErrorMessage('');
                inputRefs.current[0]?.focus();
            } else {
                toast.error(result.error || 'Failed to resend');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (status === 'VERIFIED_SUCCESSFULLY') {
        return (
            <div className="min-h-dvh bg-white flex items-center justify-center p-4 sm:p-8 font-bold selection:bg-black selection:text-white overflow-x-hidden lg:overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md border-4 sm:border-8 border-black bg-white p-6 sm:p-10 shadow-[6px_6px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] relative z-10"
                >
                    <div className="text-center space-y-10">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 sm:border-8 border-black flex items-center justify-center mx-auto bg-[#10b981] text-white">
                            <CheckCircle className="h-12 w-12" strokeWidth={4} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter break-words">VERIFIED_SUCCESSFULLY</h2>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">
                                Your identity node has been authorized. Full access granted.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full min-h-14 sm:h-16 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-[#10b981] transition-colors border-4 border-black shadow-[5px_5px_0px_#10b981] sm:shadow-[6px_6px_0px_#10b981] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                        >
                            GO_TO_LOGIN
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-white flex items-center justify-center p-4 sm:p-8 font-bold selection:bg-black selection:text-white overflow-x-hidden lg:overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md border-4 sm:border-8 border-black bg-white p-6 sm:p-10 shadow-[6px_6px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] relative z-10"
            >
                <div className="text-center space-y-7">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 sm:border-8 border-black flex items-center justify-center mx-auto bg-black text-white">
                        <Mail className="h-12 w-12" strokeWidth={4} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter break-words">VERIFY_EMAIL</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 break-words px-2">
                            Enter the 6-digit code sent to {email}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-3" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-9 h-12 min-[360px]:w-10 sm:w-12 sm:h-14 border-4 border-black text-center font-black text-lg sm:text-xl focus:bg-black focus:text-white transition-all outline-none"
                                disabled={status === 'verifying'}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center justify-center gap-2 text-[#E11D48] text-[10px] font-black uppercase tracking-widest">
                            <AlertCircle size={14} strokeWidth={3} />
                            {errorMessage || 'VERIFICATION_FAILED'}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={status === 'verifying' || otp.join('').length !== OTP_LENGTH}
                        className="w-full h-16 bg-black text-white font-black uppercase text-xs sm:text-sm hover:bg-[#E11D48] transition-colors shadow-[5px_5px_0px_#E11D48] sm:shadow-[8px_8px_0px_#E11D48] disabled:opacity-50 flex items-center justify-center gap-3 group"
                    >
                        {status === 'verifying' ? (
                            <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                        ) : (
                            <>
                                VERIFY_IDENTITY
                                <CheckCircle size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={resending || status === 'verifying'}
                        className="w-full h-14 border-4 border-black bg-white text-black font-black uppercase text-[10px] hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {resending ? (
                            <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                        ) : (
                            <RefreshCw size={16} strokeWidth={3} />
                        )}
                        RESEND_CODE
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={14} strokeWidth={3} />
                        BACK_TO_LOGIN
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
