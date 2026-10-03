import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User, Check, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../config/supabase';
import { sendSignupOTP } from '../services/otpService';
import { toast } from 'sonner';
import { formatSupabaseError, isValidEmail } from '../utils/validationUtils';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GoogleIcon = () => (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
    </svg>
);

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    const hasMinLength = password.length >= 6;
    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');
        setTouched({ name: true, email: true, password: true, confirm: true });
        if (!name || !email || !password || !confirm) { 
            toast.error('Please fill in every field'); 
            soundManager.play('error'); 
            return; 
        }
        if (!isValidEmail(email)) { 
            toast.error('That email does not look valid'); 
            soundManager.play('error'); 
            return; 
        }
        if (password.length < 6) { 
            toast.error('Use at least 6 characters for your password'); 
            soundManager.play('error'); 
            return; 
        }
        if (password !== confirm) { 
            toast.error('Passwords do not match'); 
            soundManager.play('error'); 
            return; 
        }
        setIsLoading(true);
        try {
            await sendSignupOTP(email, password, name);
            soundManager.play('success');
            toast.success('We sent a confirmation code to your email');
            navigate('/verify-email', { state: { email } });
        } catch (error) {
            soundManager.play('error');
            toast.error(formatSupabaseError(error));
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        soundManager.play('click');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            soundManager.play('error');
            console.error('[Cashly Signup] Google sign-in error:', error);
            toast.error(error?.message || error?.code || 'Google sign-in failed. Please try again.');
            setIsLoading(false);
        }
    };

    const nameError = touched.name && !name;
    const emailError = touched.email && !!email && !isValidEmail(email);
    const pwError = touched.password && !!password && password.length < 6;
    const confirmError = touched.confirm && password !== confirm;

    return (
        <AuthLayout 
            title="Create your account" 
            subtitle="Start capturing and reviewing your spending in minutes. No bank passwords required."
        >
            <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-ink)]">
                        Your Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <Input
                            className={cn('h-11 pl-10 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]', nameError && 'border-[var(--color-danger)]')}
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, name: true }))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-ink)]">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <Input
                            type="email"
                            className={cn('h-11 pl-10 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]', emailError && 'border-[var(--color-danger)]')}
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, email: true }))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    {emailError && <p className="text-xs font-medium text-[var(--color-danger)]">Please enter a valid email</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-ink)]">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <Input
                            type={showPw ? 'text' : 'password'}
                            className={cn('h-11 pl-10 pr-11 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]', pwError && 'border-[var(--color-danger)]')}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                            disabled={isLoading}
                            required
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPw(v => !v)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#78716C] hover:text-[#1C1917]"
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Dynamic Password Check Requirements */}
                    {password && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#78716C] pt-1">
                            <span className={cn('flex items-center gap-1', hasMinLength ? 'text-[#059669] font-medium' : 'text-[#A8A29E]')}>
                                <Check className="h-3 w-3" /> 6+ chars
                            </span>
                            <span className={cn('flex items-center gap-1', hasUpper ? 'text-[#059669] font-medium' : 'text-[#A8A29E]')}>
                                <Check className="h-3 w-3" /> Uppercase
                            </span>
                            <span className={cn('flex items-center gap-1', hasNumber ? 'text-[#059669] font-medium' : 'text-[#A8A29E]')}>
                                <Check className="h-3 w-3" /> Number
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-ink)]">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <Input
                            type={showPw ? 'text' : 'password'}
                            className={cn('h-11 pl-10 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]', confirmError && 'border-[var(--color-danger)]')}
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    {confirmError && <p className="text-xs font-medium text-[var(--color-danger)]">Passwords do not match</p>}
                </div>

                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="mt-2 h-12 w-full rounded-full bg-[var(--color-brand)] text-sm font-bold text-white shadow-md hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 transition-all"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account…
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--color-border)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--color-surface)] px-3 font-medium text-[var(--color-muted)]">or continue with</span>
                </div>
            </div>

            <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogle} 
                disabled={isLoading} 
                className="h-11 w-full border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
            >
                <GoogleIcon />
                Continue with Google
            </Button>

            <p className="mt-6 border-t border-[var(--color-border)] pt-4 text-center text-xs text-[var(--color-muted)]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[var(--color-brand)] hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
};

export default SignupPage;
