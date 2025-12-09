import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { verifyOTP, resendOTP } from '../services/otpService';
import { toast } from 'react-toastify';
import styles from './AuthPage.module.css';

const VerifyEmailPage = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get email from navigation state or localStorage
        const stateEmail = location.state?.email;
        const stateName = location.state?.name;
        const storedEmail = localStorage.getItem('pending_verification_email');
        const storedName = localStorage.getItem('pending_verification_name');

        if (stateEmail) {
            setEmail(stateEmail);
            localStorage.setItem('pending_verification_email', stateEmail);
        } else if (storedEmail) {
            setEmail(storedEmail);
        }

        if (stateName) {
            setName(stateName);
            localStorage.setItem('pending_verification_name', stateName);
        } else if (storedName) {
            setName(storedName);
        }

        // Focus first input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }, [location]);

    useEffect(() => {
        // Countdown timer for resend cooldown
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Handle OTP input change
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Only take last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleVerify(newOtp.join(''));
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp);

            // Focus the appropriate input
            const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
            if (nextEmptyIndex !== -1) {
                inputRefs.current[nextEmptyIndex]?.focus();
            } else {
                // All filled, auto-submit
                handleVerify(newOtp.join(''));
            }
        }
    };

    const handleVerify = async (otpCode?: string) => {
        const codeToVerify = otpCode || otp.join('');

        if (codeToVerify.length !== 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }

        if (!email) {
            toast.error('Email not found. Please signup again.');
            navigate('/signup');
            return;
        }

        setIsVerifying(true);
        try {
            await verifyOTP(email, codeToVerify);

            // Clear stored data
            localStorage.removeItem('pending_verification_email');
            localStorage.removeItem('pending_verification_name');

            setIsVerified(true);
            toast.success('Email verified! You can now login. 🎉');
        } catch (error: any) {
            toast.error(error.message || 'Invalid verification code');
            // Reset OTP fields
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        if (!email || resendCooldown > 0) return;

        setIsResending(true);
        try {
            await resendOTP(email);
            toast.success('New verification code sent! 📧');
            setResendCooldown(60); // 60 second cooldown
            // Reset OTP fields
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            if (error.retryAfter) {
                setResendCooldown(error.retryAfter);
            }
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    // If email was just verified, show success state
    if (isVerified) {
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
                            Your email is verified!<br />You're all set to start<br />tracking your spending.
                        </motion.p>

                        {/* Celebration Stats */}
                        <motion.div
                            className={styles.statsPreview}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>✅</span>
                                <span className={styles.statLabel}>Verified</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>🚀</span>
                                <span className={styles.statLabel}>Ready</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>💰</span>
                                <span className={styles.statLabel}>Track</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Decorative Elements */}
                    <div className={styles.decorCircle1}></div>
                    <div className={styles.decorCircle2}></div>
                </div>

                {/* Right Panel - Success Card */}
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
                            style={{ background: '#4ade80' }}
                        >
                            🎉
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                            style={{
                                width: 100,
                                height: 100,
                                background: '#dcfce7',
                                borderRadius: '50%',
                                margin: '0 auto 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '3px solid #000',
                                boxShadow: '4px 4px 0px #000'
                            }}
                        >
                            <CheckCircle size={48} color="#22c55e" />
                        </motion.div>

                        <h1 className={styles.title}>EMAIL VERIFIED! ✨</h1>
                        <p className={styles.subtitle}>
                            Your email has been confirmed. You're ready to start vibing!
                        </p>

                        <Link
                            to="/login"
                            className={styles.submitBtn}
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                textDecoration: 'none',
                                marginTop: '1.5rem'
                            }}
                        >
                            CONTINUE TO LOGIN 🚀
                        </Link>
                    </motion.div>

                    {/* Floating shapes */}
                    <motion.div
                        className={styles.floatingShape1}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        🌟
                    </motion.div>
                    <div className={styles.floatingShape2}>🎊</div>
                </div>
            </div>
        );
    }

    // OTP Entry state
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
                        Almost there! Just enter<br />the code we sent to<br />verify your email.
                    </motion.p>

                    {/* Steps Preview */}
                    <motion.div
                        className={styles.statsPreview}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>✓</span>
                            <span className={styles.statLabel}>Sign Up</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>📧</span>
                            <span className={styles.statLabel}>Verify</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>🎯</span>
                            <span className={styles.statLabel}>Track</span>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className={styles.decorCircle1}></div>
                <div className={styles.decorCircle2}></div>
            </div>

            {/* Right Panel - OTP Card */}
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
                        🔐
                    </motion.div>

                    {/* Shield Icon */}
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{
                            width: 80,
                            height: 80,
                            background: 'linear-gradient(135deg, #e0f2fe, #fae8ff)',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid #000',
                            boxShadow: '4px 4px 0px #000'
                        }}
                    >
                        <ShieldCheck size={36} color="#000" />
                    </motion.div>

                    <h1 className={styles.title}>ENTER CODE! 🔢</h1>
                    <p className={styles.subtitle}>
                        We sent a 6-digit code to:
                    </p>

                    {email && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                background: '#f0fdf4',
                                border: '2px solid #000',
                                borderRadius: 12,
                                padding: '0.6rem 1rem',
                                marginBottom: '1.5rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                fontSize: '0.9rem',
                                boxShadow: '3px 3px 0px #000'
                            }}
                        >
                            {email}
                        </motion.div>
                    )}

                    {/* OTP Input Fields */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}
                        onPaste={handlePaste}
                    >
                        {otp.map((digit, index) => (
                            <motion.input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    width: '48px',
                                    height: '56px',
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    textAlign: 'center',
                                    border: '2px solid #000',
                                    borderRadius: '12px',
                                    background: digit ? '#f0fdf4' : '#fff',
                                    fontFamily: 'monospace',
                                    boxShadow: digit ? '3px 3px 0px #000' : 'none',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                disabled={isVerifying}
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify()}
                        className={styles.submitBtn}
                        disabled={isVerifying || otp.some(d => !d)}
                        style={{ width: '100%', marginBottom: '1rem' }}
                    >
                        {isVerifying ? (
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            'VERIFY EMAIL'
                        )}
                    </button>

                    {/* Resend Link */}
                    <p style={{
                        color: '#64748b',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        Didn't receive the code?
                    </p>

                    <button
                        onClick={handleResendOTP}
                        className={styles.googleBtn}
                        disabled={isResending || resendCooldown > 0}
                        style={{ width: '100%', marginBottom: '1rem' }}
                    >
                        {isResending ? (
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <RefreshCw size={20} />
                        )}
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend Code'
                        }
                    </button>

                    <p style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        fontStyle: 'italic'
                    }}>
                        💡 Check your spam folder if you don't see it!
                    </p>

                    {/* Back to signup */}
                    <div className={styles.footer}>
                        <Link to="/signup" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={16} />
                            Back to Signup
                        </Link>
                    </div>
                </motion.div>

                {/* Floating shapes */}
                <motion.div
                    className={styles.floatingShape1}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    ✉️
                </motion.div>
                <div className={styles.floatingShape2}>🔑</div>
            </div>

            {/* Custom CSS for spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default VerifyEmailPage;
