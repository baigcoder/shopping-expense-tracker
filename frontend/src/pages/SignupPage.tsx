import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, User, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { signUpWithEmail, signInWithGoogle } from '../config/supabase';
import { toast } from 'react-toastify';
import { isValidEmail, formatSupabaseError } from '../utils/validationUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';
import { soundManager } from '@/lib/sounds';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false
    });

    const navigate = useNavigate();

    // Ensure light mode on mount and save preference
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);


    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');

        setTouched({
            name: true,
            email: true,
            password: true,
            confirmPassword: true
        });

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            soundManager.play('error');
            return;
        }

        if (!isValidEmail(email)) {
            toast.error('Please enter a valid email address');
            soundManager.play('error');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            soundManager.play('error');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            soundManager.play('error');
            return;
        }

        setIsLoading(true);
        try {
            await signUpWithEmail(email, password, name);
            soundManager.play('success');
            toast.success('Account created! Please check your email to verify. 📧');
            navigate('/verify-email', { state: { email } });
        } catch (error: any) {
            soundManager.play('error');
            toast.error(formatSupabaseError(error));
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        soundManager.play('click');
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            soundManager.play('error');
            toast.error(error instanceof Error ? error.message : 'Google signup failed');
            setIsLoading(false);
        }
    };

    const nameError = touched.name && !name;
    const emailError = touched.email && email && !isValidEmail(email);
    const passwordError = touched.password && password && password.length < 6;
    const confirmError = touched.confirmPassword && password !== confirmPassword;

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
                            Join {BRAND.name} Today
                        </h1>
                        <p className="text-lg opacity-90 max-w-sm mb-8">
                            Start your journey to smarter spending in under a minute.
                        </p>

                        {/* Features List */}
                        <div className="text-left max-w-xs mx-auto space-y-3">
                            {[
                                'Automatic expense tracking',
                                'AI-powered insights',
                                'Unlimited budgets & goals',
                                'Free forever plan'
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <CheckCircle className="h-4 w-4 text-white/90 flex-shrink-0" />
                                    <span className="text-white/90">{feature}</span>
                                </motion.div>
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
                    className="w-full max-sm"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-4">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <span className="font-display text-xl font-bold">{BRAND.name}</span>
                        </Link>
                    </div>


                    {/* Form Card */}
                    <div className="bg-card border rounded-2xl shadow-lg p-5 sm:p-6">
                        <div className="mb-4">
                            <h2 className="font-display text-xl font-bold tracking-tight">Create account</h2>
                            <p className="text-muted-foreground text-sm mt-1">Start tracking your expenses today</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-3">
                            {/* Name Field */}
                            <div className="space-y-1">
                                <label htmlFor="name" className="text-xs font-medium">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className={cn("pl-9 h-10 text-sm", nameError && "border-destructive")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={() => setTouched({ ...touched, name: true })}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

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
                                <label htmlFor="password" className="text-xs font-medium">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 6 characters"
                                        className={cn("pl-9 pr-9 h-10 text-sm", passwordError && "border-destructive")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={() => setTouched({ ...touched, password: true })}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1">
                                <label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm password"
                                        className={cn("pl-9 h-10 text-sm", confirmError && "border-destructive")}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-white mt-2"
                                disabled={isLoading}
                            >

                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Signup */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-sm"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-4 w-4 mr-2" />
                            Google
                        </Button>

                        {/* Footer */}
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SignupPage;
