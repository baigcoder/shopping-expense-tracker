import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithEmail, signInWithGoogle } from '../config/supabase';
import { toast } from 'react-toastify';
import styles from './AuthPage.module.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Missed a spot! Fill in everything. 🙄');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            toast.success('We in! 🚀 Redirecting...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error: any) {
            const errorMessage = error?.message || '';

            // Check for email not confirmed error
            if (errorMessage.toLowerCase().includes('email not confirmed') ||
                errorMessage.toLowerCase().includes('not confirmed') ||
                errorMessage.toLowerCase().includes('confirm your email')) {
                toast.info('Please verify your email first! 📧');
                navigate('/verify-email', { state: { email } });
            } else if (errorMessage.toLowerCase().includes('invalid login credentials')) {
                toast.error('Wrong email or password! Try again. 🔐');
            } else {
                toast.error(error instanceof Error ? error.message : 'Login failed');
            }
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Google login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.splitContainer}>
            {/* Left Panel - Branding */}
            <div className={styles.leftPanel}>
                <div className={styles.brandContent}>
                    <motion.div
                        className={styles.logoContainer}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    >
                        <img src="/logo.png" alt="Vibe Tracker" className={styles.logo} />
                    </motion.div>

                    <motion.h1
                        className={styles.brandTitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Vibe Tracker
                    </motion.h1>

                    <motion.p
                        className={styles.brandTagline}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Track your spending,<br />manage cards, and view<br />analytics in one beautiful dashboard.
                    </motion.p>

                    {/* Floating Card Preview */}
                    <motion.div
                        className={styles.cardPreview}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, type: "spring" }}
                    >
                        <div className={styles.previewCard}>
                            <span className={styles.cardType}>VISA</span>
                            <span className={styles.cardAmount}>$$$</span>
                            <div className={styles.cardNumber}>**** **** **** 1234</div>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className={styles.decorCircle1}></div>
                <div className={styles.decorCircle2}></div>
            </div>

            {/* Right Panel - Login Form */}
            <div className={styles.rightPanel}>
                <motion.div
                    className={styles.authCard}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                >
                    {/* Floating Emoji */}
                    <motion.div
                        className={styles.floatingEmoji}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ✨
                    </motion.div>

                    <h1 className={styles.title}>WELCOME BACK! 👋</h1>
                    <p className={styles.subtitle}>Let's get this bread. Login to continue.</p>

                    <form onSubmit={handleEmailLogin} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={20} />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    className={styles.input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'LET ME IN'}
                        </button>
                    </form>

                    <div className={styles.divider}>Or vibe with</div>

                    <button onClick={handleGoogleLogin} className={styles.googleBtn} disabled={isLoading}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="24" height="24" />
                        Continue with Google
                    </button>

                    <div className={styles.footer}>
                        <span style={{ color: '#64748b' }}>New here? </span>
                        <Link to="/signup" className={styles.link}> Create account</Link>
                    </div>
                </motion.div>

                {/* Floating shapes */}
                <motion.div
                    className={styles.floatingShape1}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    🌙
                </motion.div>
                <div className={styles.floatingShape2}>🔥</div>
            </div>
        </div>
    );
};

export default LoginPage;
