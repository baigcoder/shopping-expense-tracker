import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '../config/supabase';
import { toast } from 'sonner';
import { formatSupabaseError, isValidEmail } from '../utils/validationUtils';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        if (!email || !password) { toast.error('Please enter your email and password'); soundManager.play('error'); return; }
        if (!isValidEmail(email)) { toast.error('That email does not look valid'); soundManager.play('error'); return; }
        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            soundManager.play('success');
            toast.success('Signed in');
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
        <AuthLayout title="Welcome back" subtitle="Sign in to review your inbox and spending.">
            <form onSubmit={handleEmail} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#57534E]">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                        <Input
                            type="email"
                            className={cn('pl-10', emailError && 'border-[#E11D48]')}
                            placeholder="you@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, email: true }))}
                        />
                    </div>
                    {emailError && <p className="text-xs text-[#E11D48]">Enter a valid email</p>}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[#57534E]">Password</label>
                        <Link to="/forgot-password" className="text-xs font-medium text-[#E11D48] hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                        <Input
                            type={showPw ? 'text' : 'password'}
                            className={cn('pl-10 pr-11', pwError && 'border-[#E11D48]')}
                            placeholder="Your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                            aria-label={showPw ? 'Hide password' : 'Show password'}
                        >
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <Button type="submit" disabled={isLoading} className="h-11 w-full">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign in'}
                </Button>
            </form>

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E7E5E4]" /></div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-[#78716C]">or</span>
                </div>
            </div>

            <Button type="button" variant="outline" onClick={handleGoogle} disabled={isLoading} className="h-11 w-full">
                Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-[#78716C]">
                New here?{' '}
                <Link to="/signup" className="font-medium text-[#E11D48] hover:underline">Create an account</Link>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;
