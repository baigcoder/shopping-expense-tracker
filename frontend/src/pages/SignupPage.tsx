import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';
import { signInWithGoogle } from '../config/supabase';
import { sendSignupOTP } from '../services/otpService';
import { toast } from 'react-toastify';
import styles from './AuthPage.module.css';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !confirmPassword) {
            toast.error('Fill in all the blanks! 📝');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords don\'t match! 🔐');
            return;
        }
        if (password.length < 6) {
            toast.error('Password needs to be at least 6 characters! 💪');
            return;
        }

        setIsLoading(true);
        try {
            // Send OTP to email
            await sendSignupOTP(email, password, name);

            toast.success('Verification code sent! Check your email. 📧');

            // Navigate to OTP verification page with email
            navigate('/verify-email', {
                state: {
                    email,
                    name,
                    isOTPVerification: true
                }
            });
        } catch (error: any) {
            // Handle specific errors
            if (error?.message?.includes('already registered')) {
                toast.error('Email already registered! Try logging in. 📧');
            } else if (error?.message?.includes('wait')) {
                toast.warning(error.message);
            } else {
                toast.error(error.message || 'Signup failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Google signup failed');
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
                        Join thousands tracking<br />their spending and<br />reaching their goals.
                    </motion.p>

                    {/* Stats Preview */}
                    <motion.div
                        className={styles.statsPreview}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>10k+</span>
                            <span className={styles.statLabel}>Users</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>$2M+</span>
                            <span className={styles.statLabel}>Tracked</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>4.9⭐</span>
                            <span className={styles.statLabel}>Rating</span>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className={styles.decorCircle1}></div>
                <div className={styles.decorCircle2}></div>
            </div>

            {/* Right Panel - Signup Form */}
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
                        style={{ background: '#4ECDC4' }}
                    >
                        🚀
                    </motion.div>

                    <h1 className={styles.title}>JOIN THE VIBE! ✨</h1>
                    <p className={styles.subtitle}>Create your account and start tracking.</p>

                    <form onSubmit={handleSignup} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={20} />
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className={styles.input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

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

                        <div className={styles.inputGroup}>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    className={styles.input}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div className={styles.divider}>Or vibe with</div>

                    <button onClick={handleGoogleSignup} className={styles.googleBtn} disabled={isLoading}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="24" height="24" />
                        Continue with Google
                    </button>

                    <div className={styles.footer}>
                        <span style={{ color: '#64748b' }}>Already have an account? </span>
                        <Link to="/login" className={styles.link}>Log in</Link>
                    </div>
                </motion.div>

                {/* Floating shapes */}
                <motion.div
                    className={styles.floatingShape1}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    💫
                </motion.div>
                <div className={styles.floatingShape2}>🎯</div>
            </div>
        </div>
    );
};

export default SignupPage;
