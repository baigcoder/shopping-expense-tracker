import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { signInWithGoogle } from '../config/supabase';
import { sendSignupOTP } from '../services/otpService';
import { toast } from 'sonner';
import { formatSupabaseError, isValidEmail } from '../utils/validationUtils';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    const score = useMemo(() => [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length, [password]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');
        setTouched({ name: true, email: true, password: true, confirm: true });
        if (!name || !email || !password || !confirm) { toast.error('Please fill in every field'); soundManager.play('error'); return; }
        if (!isValidEmail(email)) { toast.error('That email does not look valid'); soundManager.play('error'); return; }
        if (password.length < 6) { toast.error('Use at least 6 characters'); soundManager.play('error'); return; }
        if (password !== confirm) { toast.error('Passwords do not match'); soundManager.play('error'); return; }
        setIsLoading(true);
        try {
            await sendSignupOTP(email, password, name);
            soundManager.play('success');
            toast.success('We sent a code to your email');
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
        <AuthLayout title="Create your account" subtitle="A few details, then you can start reviewing charges.">
            <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#57534E]">Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                        <Input
                            className={cn('pl-10', nameError && 'border-[#E11D48]')}
                            placeholder="Your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, name: true }))}
                        />
                    </div>
                </div>
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
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#57534E]">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                        <Input
                            type={showPw ? 'text' : 'password'}
                            className={cn('pl-10 pr-11', pwError && 'border-[#E11D48]')}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <div className="flex gap-1.5 px-0.5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={cn('h-1 flex-1 rounded-full', i <= score ? 'bg-[#E11D48]' : 'bg-[#E7E5E4]')} />
                        ))}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#57534E]">Confirm password</label>
                    <Input
                        type={showPw ? 'text' : 'password'}
                        className={cn(confirmError && 'border-[#E11D48]')}
                        placeholder="Repeat password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                    />
                </div>
                <Button type="submit" disabled={isLoading} className="mt-1 h-11 w-full">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create account'}
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
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-[#E11D48] hover:underline">Sign in</Link>
            </p>
        </AuthLayout>
    );
};

export default SignupPage;
