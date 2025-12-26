import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmail, signInWithGoogle } from '../config/supabase';
import { toast } from 'react-toastify';
import { isValidEmail, formatSupabaseError } from '../utils/validationUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';
import { soundManager } from '@/lib/sounds';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState({
        email: false,
        password: false
    });

    const navigate = useNavigate();

    // Ensure light mode on mount and save preference
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);


    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');

        setTouched({
            email: true,
            password: true
        });

        if (!email || !password) {
            toast.error('Please fill in all fields');
            soundManager.play('error');
            return;
        }

        if (!isValidEmail(email)) {
            toast.error('Please enter a valid email address');
            soundManager.play('error');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            soundManager.play('success');
            toast.success('Welcome back! 🚀');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error: any) {
            soundManager.play('error');
            const errorMessage = error?.message || '';

            if (errorMessage.toLowerCase().includes('email not confirmed') ||
                errorMessage.toLowerCase().includes('not confirmed') ||
                errorMessage.toLowerCase().includes('confirm your email')) {
                toast.info('Please verify your email first! 📧');
                navigate('/verify-email', { state: { email } });
            } else {
                toast.error(formatSupabaseError(error));
            }
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        soundManager.play('click');
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            soundManager.play('error');
            toast.error(error instanceof Error ? error.message : 'Google login failed');
            setIsLoading(false);
        }
    };

    const emailError = touched.email && email && !isValidEmail(email);
    const passwordError = touched.password && !password;

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                </div>


                <div className="relative z-10 flex flex-col justify-center items-center w-full p-10 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 mx-auto text-3xl">
                            💸
                        </div>
                        <h1 className="font-display text-3xl font-bold mb-3">
                            Welcome Back
                        </h1>
                        <p className="text-lg opacity-90 max-w-sm mb-8">
                            {BRAND.tagline}. Pick up right where you left off.
                        </p>

                        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                            {[
                                { value: '50K+', label: 'Users', icon: Wallet },
                                { value: '$4.2M', label: 'Saved', icon: TrendingUp },
                            ].map((stat, i) => (
                                <div key={i} className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                                    <stat.icon className="h-5 w-5 mx-auto mb-2 opacity-80" />
                                    <div className="font-display text-xl font-bold">{stat.value}</div>
                                    <div className="text-xs opacity-80">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-background">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-6">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <span className="font-display text-xl font-bold">{BRAND.name}</span>
                        </Link>
                    </div>


                    {/* Form Card */}
                    <div className="bg-card border rounded-2xl shadow-lg p-5 sm:p-6">
                        <div className="mb-5">
                            <h2 className="font-display text-xl font-bold tracking-tight">Sign in</h2>
                            <p className="text-muted-foreground text-sm mt-1">Enter your credentials to continue</p>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-xs font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className={cn("pl-9 h-10 text-sm", emailError && "border-destructive")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => setTouched({ ...touched, email: true })}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-xs font-medium">Password</label>
                                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                                        Forgot password?
                                    </Link>

                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        className={cn("pl-9 pr-9 h-10 text-sm", passwordError && "border-destructive")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={() => setTouched({ ...touched, password: true })}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-white"
                                disabled={isLoading}
                            >

                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Login */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-sm"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </Button>

                        {/* Footer */}
                        <p className="text-center text-xs text-muted-foreground mt-5">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Sign up free
                            </Link>
                        </p>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
