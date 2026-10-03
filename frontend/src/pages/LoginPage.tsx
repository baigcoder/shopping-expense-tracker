import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '../config/supabase';
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

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState({ email: false, password: false });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    useEffect(() => {
        const authError = (location.state as { authError?: string } | null)?.authError;
        if (!authError) return;
        toast.error(authError);
        navigate('/login', { replace: true, state: null });
    }, [location.state, navigate]);

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');
        setTouched({ email: true, password: true });
        if (!email || !password) { 
            toast.error('Please enter your email and password'); 
            soundManager.play('error'); 
            return; 
        }
        if (!isValidEmail(email)) { 
            toast.error('That email does not look valid'); 
            soundManager.play('error'); 
            return; 
        }
        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            soundManager.play('success');
            toast.success('Signed in successfully');
            navigate('/dashboard');
        } catch (error: any) {
            soundManager.play('error');
            const msg = error?.message || '';
            if (msg.toLowerCase().includes('email not confirmed')) {
                toast.info('Please verify your email first');
                navigate('/verify-email', { state: { email } });
            } else {
                toast.error(formatSupabaseError(error));
            }
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
            console.error('[Cashly Login] Google sign-in error:', error);
            toast.error(error?.message || error?.code || 'Google sign-in failed. Please try again.');
            setIsLoading(false);
        }
    };

    const emailError = touched.email && !!email && !isValidEmail(email);
    const pwError = touched.password && !password;

    return (
        <AuthLayout 
            title="Welcome back" 
            subtitle="Sign in to your Cashly workspace to review your inbox and financial pulse."
        >
            <form onSubmit={handleEmail} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-ink)]">
                            Password
                        </label>
                        <Link to="/forgot-password" className="text-xs font-medium text-[var(--color-brand)] hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                        <Input
                            type={showPw ? 'text' : 'password'}
                            className={cn('h-11 pl-10 pr-11 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]', pwError && 'border-[var(--color-danger)]')}
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                            disabled={isLoading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="h-12 w-full rounded-full bg-[var(--color-brand)] text-sm font-bold text-white shadow-md hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 transition-all"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        <>
                            Sign in
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E7E5E4]" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 font-medium text-[#78716C]">or continue with</span>
                </div>
            </div>

            <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogle} 
                disabled={isLoading} 
                className="h-11 w-full border-[#E7E5E4] bg-white text-sm font-medium text-[#1C1917] hover:bg-[#FAF8F5]"
            >
                <GoogleIcon />
                Continue with Google
            </Button>

            <div className="mt-6 border-t border-[#E7E5E4] pt-4 text-center text-xs text-[#78716C]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-[var(--color-brand)] hover:underline">
                    Create a free account
                </Link>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
