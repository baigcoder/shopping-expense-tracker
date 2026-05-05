// SignupPage - Stark Gen Z Professional Terminal Enrollment
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Eye, EyeOff, Inbox, Loader2, Lock, Mail, Settings, ShieldCheck, Sparkles, User, Target, Activity, Zap, Cpu, Globe, BarChart3, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithGoogle, signUpWithEmail } from '../config/supabase';
import { toast } from 'sonner';
import { formatSupabaseError, isValidEmail } from '../utils/validationUtils';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';
import { soundManager } from '@/lib/sounds';

const FEATURES = [
    { icon: Inbox,       label: 'SMART_INBOX', desc: 'Authorize every transaction before it hits your ledger.' },
    { icon: Cpu,         label: 'AI_INSIGHTS', desc: 'Secure AI processing for deep financial intelligence.' },
    { icon: Globe,       label: 'AUTO_SYNC', desc: 'Real-time synchronization across all your access nodes.' },
    { icon: BarChart3,   label: 'DETAILED_REPORTS', desc: 'Pixel-perfect reports for professional-grade auditing.' },
];

const SignupPage = () => {
    const [name, setName]                   = useState('');
    const [email, setEmail]                 = useState('');
    const [password, setPassword]           = useState('');
    const [confirm, setConfirm]             = useState('');
    const [showPw, setShowPw]               = useState(false);
    const [isLoading, setIsLoading]         = useState(false);
    const [touched, setTouched]             = useState({ name:false, email:false, password:false, confirm:false });
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
        setTouched({ name:true, email:true, password:true, confirm:true });
        if (!name || !email || !password || !confirm) { toast.error('FIELDS_EMPTY'); soundManager.play('error'); return; }
        if (!isValidEmail(email)) { toast.error('INVALID_EMAIL_NODE'); soundManager.play('error'); return; }
        if (password.length < 6) { toast.error('KEY_TOO_SHORT'); soundManager.play('error'); return; }
        if (password !== confirm) { toast.error('PASSPHRASE_MISMATCH'); soundManager.play('error'); return; }
        setIsLoading(true);
        try {
            await signUpWithEmail(email, password, name);
            soundManager.play('success');
            toast.success('IDENTITY_CREATED // CHECK_EMAIL');
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
            soundManager.play('success');
            navigate('/dashboard');
        } catch (error: any) {
            soundManager.play('error');
            const msg = error?.message || error?.code || 'Google sign-in failed. Please try again.';
            toast.error(msg);
            setIsLoading(false);
        }
    };

    const nameError    = touched.name    && !name;
    const emailError   = touched.email   && !!email && !isValidEmail(email);
    const pwError      = touched.password && !!password && password.length < 6;
    const confirmError = touched.confirm  && password !== confirm;

    return (
        <div className="h-screen overflow-y-auto lg:overflow-hidden bg-white text-black font-bold selection:bg-black selection:text-white">
            <div className="mx-auto grid h-full lg:grid-cols-[0.9fr_1.1fr]">

                {/* ── LEFT PANEL (TERMINAL FORM) ── */}
                <div className="flex flex-col items-center justify-center p-8 md:p-16 lg:p-12 xl:p-20 bg-white relative border-r-8 border-black h-full overflow-y-auto scrollbar-hide">
                    <div className="absolute top-0 left-0 p-8">
                        <Link to="/" className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-black text-white border-4 border-black flex items-center justify-center font-black text-xl italic tracking-tighter group-hover:bg-[#E11D48] transition-colors">
                                C
                            </div>
                            <span className="text-2xl font-black italic tracking-tighter uppercase">{BRAND.name}</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-[440px] space-y-10"
                    >
                        <header className="space-y-4">
                            <div className="inline-flex items-center gap-3 border-4 border-black px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                <Target size={16} strokeWidth={3} />
                                CREATE_ACCOUNT
                            </div>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">SIGN_UP</h2>
                            <p className="text-sm font-black text-black/40 uppercase tracking-widest">
                                Establish your secure access credentials.
                            </p>
                        </header>

                        <div className="border-8 border-black p-10 bg-white shadow-[16px_16px_0px_#000000] relative">
                            <div className="absolute -top-6 -right-6 bg-[#E11D48] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                                <ShieldCheck size={24} strokeWidth={3} />
                            </div>

                            <form onSubmit={handleSignup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Full_Name</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                        <input
                                            className={cn(
                                                "w-full h-14 border-4 border-black bg-white pl-16 pr-8 font-black uppercase text-xs focus:bg-black focus:text-white transition-all outline-none",
                                                nameError && "border-[#E11D48]"
                                            )}
                                            placeholder="ENTER_YOUR_NAME"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, name: true }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Email_Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                        <input
                                            type="email"
                                            className={cn(
                                                "w-full h-14 border-4 border-black bg-white pl-16 pr-8 font-black uppercase text-xs focus:bg-black focus:text-white transition-all outline-none",
                                                emailError && "border-[#E11D48]"
                                            )}
                                            placeholder="ENTER_YOUR_EMAIL"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, email: true }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            className={cn(
                                                "w-full h-14 border-4 border-black bg-white pl-16 pr-16 font-black uppercase text-xs focus:bg-black focus:text-white transition-all outline-none",
                                                pwError && "border-[#E11D48]"
                                            )}
                                            placeholder="CREATE_PASSWORD"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPw(v => !v)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                                        >
                                            {showPw ? <EyeOff size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2 px-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={cn(
                                                "h-1.5 flex-1 border-2 border-black",
                                                i <= score ? (score === 4 ? "bg-[#E11D48]" : "bg-black") : "bg-white"
                                            )} />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Confirm_Password</label>
                                    <div className="relative">
                                        <Shield size={20} strokeWidth={3} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            className={cn(
                                                "w-full h-14 border-4 border-black bg-white pl-16 pr-8 font-black uppercase text-xs focus:bg-black focus:text-white transition-all outline-none",
                                                confirmError && "border-[#E11D48]"
                                            )}
                                            placeholder="CONFIRM_PASSWORD"
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-16 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors shadow-[8px_8px_0px_#E11D48] disabled:opacity-50 flex items-center justify-center gap-4 group mt-4"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                    ) : (
                                        <>
                                            SIGN_UP_NOW
                                            <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-4 border-black" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-6 bg-white text-[10px] font-black uppercase tracking-[0.3em] text-black/40">EXTERNAL_NODES</span>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={handleGoogle} 
                                disabled={isLoading}
                                className="w-full h-14 border-4 border-black bg-white hover:bg-black hover:text-white transition-all font-black uppercase text-[10px] flex items-center justify-center gap-4"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                                </svg>
                                SIGN_UP_WITH_GOOGLE
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-black/40">
                                ALREADY_REGISTERED\?{' '}
                                <Link to="/login" className="text-black hover:text-[#E11D48] underline decoration-4 underline-offset-4">
                                    LOG_IN
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT PANEL (FEATURE SHOWCASE) ── */}
                <div className="hidden lg:flex flex-col bg-black text-white p-12 xl:p-20 relative h-full overflow-y-auto scrollbar-hide">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    </div>

                    <div className="relative z-10 mb-12">
                        <div className="inline-block bg-[#E11D48] text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest mb-6 border-2 border-[#E11D48]">
                            KEY_HIGHLIGHTS
                        </div>
                        <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-10">
                            JOIN<br />CASHLY
                        </h1>
                        <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em] max-w-lg leading-relaxed">
                            Join the next generation of financial auditing. Deploy your private instance and take control of your telemetry today.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10 my-auto">
                        {FEATURES.map(({ icon: Icon, label, desc }, i) => (
                            <div key={label} className="border-4 border-white p-8 bg-white/5 hover:bg-white/10 transition-colors group">
                                <div className="flex items-center justify-between mb-6">
                                    <Icon size={32} strokeWidth={3} className={i % 2 === 0 ? "text-[#E11D48]" : "text-white"} />
                                    <span className="text-[10px] font-black text-white/20">0{i+1}</span>
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest mb-3">{label}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                        <div className="border-4 border-white p-6 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <Activity size={24} strokeWidth={3} className="text-[#E11D48]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">NETWORK: STABLE</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <Shield size={24} strokeWidth={3} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">SECURE_ENCRYPTION</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10 text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                        CASHLY_SECURE_AUTH_SYSTEM
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
