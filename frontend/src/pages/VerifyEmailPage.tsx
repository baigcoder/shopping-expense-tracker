import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
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
                toast.success('A new code is on its way');
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
            <AuthLayout title="Email verified" subtitle="Your account is ready. Sign in to open Cashly.">
                <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle className="h-7 w-7" />
                    </div>
                    <Button className="h-11 w-full" onClick={() => navigate('/login')}>
                        Go to sign in
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Check your email" subtitle={`Enter the 6-digit code we sent to ${email}.`}>
            <div className="space-y-5">
                <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
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
                                'h-12 w-10 rounded-[var(--r-md)] border border-[#E7E5E4] bg-white text-center font-display text-lg font-semibold text-[#1C1917] outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 sm:w-11'
                            )}
                            disabled={status === 'verifying'}
                            autoFocus={i === 0}
                        />
                    ))}
                </div>

                {status === 'error' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#E11D48]">
                        <AlertCircle size={14} />
                        {errorMessage || 'Verification failed'}
                    </div>
                )}

                <Button
                    onClick={handleVerify}
                    disabled={status === 'verifying' || otp.join('').length !== OTP_LENGTH}
                    className="h-11 w-full"
                >
                    {status === 'verifying' ? <Loader2 className="animate-spin" size={18} /> : 'Verify email'}
                </Button>

                <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={resending || status === 'verifying'}
                    className="h-11 w-full"
                >
                    {resending ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    Resend code
                </Button>

                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="mx-auto flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917]"
                >
                    <ArrowLeft size={14} />
                    Back to sign in
                </button>
            </div>
        </AuthLayout>
    );
};

export default VerifyEmailPage;
