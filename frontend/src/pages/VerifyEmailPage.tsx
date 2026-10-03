import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';
import { verifyOTP, resendOTP } from '../services/otpService';
import { soundManager } from '@/lib/sounds';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
            toast.error('Enter the full 6-digit confirmation code');
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
                setErrorMessage(result.error || 'Verification failed. Code may be invalid or expired.');
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
                toast.success('A new 6-digit code has been dispatched');
                setOtp(Array(OTP_LENGTH).fill(''));
                setStatus('idle');
                setErrorMessage('');
                inputRefs.current[0]?.focus();
            } else {
                toast.error(result.error || 'Failed to resend confirmation code');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (status === 'VERIFIED_SUCCESSFULLY') {
        return (
            <AuthLayout title="Email verified" subtitle="Your account is active and ready.">
                <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="text-xs text-[#57534E] leading-relaxed">
                        Welcome to Cashly! Your workspace is initialized and ready to start capturing checkouts.
                    </p>
                    <Button 
                        className="h-11 w-full bg-[var(--color-brand)] text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]" 
                        onClick={() => navigate('/login')}
                    >
                        Go to sign in
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            title="Check your email" 
            subtitle={`Enter the 6-digit confirmation code dispatched to ${email}.`}
        >
            <div className="space-y-5">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
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
                            className={cn(
                                'h-13 w-10 sm:w-11 sm:h-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center font-mono text-xl font-bold text-[var(--color-ink)] outline-none transition-all focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 shadow-xs',
                                digit && 'border-[var(--color-ink)] bg-[var(--color-surface-2)]',
                                status === 'error' && 'border-[var(--color-danger)]'
                            )}
                            disabled={status === 'verifying'}
                            autoFocus={i === 0}
                        />
                    ))}
                </div>

                {status === 'error' && (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs font-medium text-red-600 dark:text-red-400">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMessage || 'Verification failed'}</span>
                    </div>
                )}

                <Button
                    onClick={handleVerify}
                    disabled={status === 'verifying' || otp.join('').length !== OTP_LENGTH}
                    className="h-11 w-full bg-[var(--color-brand)] text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
                >
                    {status === 'verifying' ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying code…
                        </>
                    ) : (
                        'Verify email'
                    )}
                </Button>

                <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || status === 'verifying'}
                        className="flex items-center gap-1.5 font-medium text-[#57534E] hover:text-[#1C1917] disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', resending && 'animate-spin')} />
                        Resend code
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-1 font-medium text-[#78716C] hover:text-[#1C1917]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to sign in
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default VerifyEmailPage;
