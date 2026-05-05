// LoginPage - Stark Gen Z Professional Terminal Authentication
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Inbox, Loader2, Lock, Mail, ShieldCheck, Sparkles, Activity, Zap, Target, Shield, Cpu, Globe, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmail, signInWithGoogle } from '../config/supabase';
import { toast } from 'sonner';
import { formatSupabaseError, isValidEmail } from '../utils/validationUtils';
import { cn } from '@/lib/utils';
import BRAND from '@/config/branding';
import { soundManager } from '@/lib/sounds';

const LoginPage = () => {
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [showPw, setShowPw]         = useState(false);
    const [isLoading, setIsLoading]   = useState(false);
    const [touched, setTouched]       = useState({ email: false, password: false });
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        soundManager.play('click');
        setTouched({ email: true, password: true });
        if (!email || !password) { toast.error('FIELDS_EMPTY'); soundManager.play('error'); return; }
        if (!isValidEmail(email)) { toast.error('INVALID_EMAIL_NODE'); soundManager.play('error'); return; }
        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            soundManager.play('success');
            toast.success('SESSION_AUTHORIZED');
            navigate('/dashboard');
        } catch (error: any) {
            soundManager.play('error');
            const msg = error?.message || '';
            if (msg.toLowerCase().includes('email not confirmed')) {
                toast.info('VERIFICATION_REQUIRED');
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
            soundManager.play('success');
            navigate('/dashboard');
        } catch (error: any) {
            soundManager.play('error');
            const msg = error?.message || error?.code || 'Google sign-in failed. Please try again.';
            toast.error(msg);
            setIsLoading(false);
        }
    };

    const emailError = touched.email && !!email && !isValidEmail(email);
    const pwError    = touched.password && !password;

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
                                <ShieldCheck size={16} strokeWidth={3} />
                                USER_LOGIN
                            </div>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">LOG_IN</h2>
                            <p className="text-sm font-black text-black/40 uppercase tracking-widest">
                                Access your secure finance node.
                            </p>
                        </header>

                        <div className="border-8 border-black p-10 bg-white shadow-[16px_16px_0px_#000000] relative">
                            <div className="absolute -top-6 -right-6 bg-[#E11D48] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                                <Lock size={24} strokeWidth={3} />
                            </div>

                            <form onSubmit={handleEmail} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Email_Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-6 text-black/20" size={24} />
                                        <input
                                            type="email"
                                            className={cn(
                                                "w-full h-18 border-4 border-black bg-white pl-16 pr-8 font-black uppercase text-sm focus:bg-black focus:text-white transition-all outline-none",
                                                emailError && "border-[#E11D48] text-[#E11D48]"
                                            )}
                                            placeholder="ENTER_YOUR_EMAIL"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, email: true }))}
                                        />
                                    </div>
                                    {emailError && <p className="text-[10px] font-black text-[#E11D48] uppercase tracking-widest ml-1">INVALID_EMAIL</p>}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Password</label>
                                        <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[#E11D48] hover:underline">
                                            FORGOT\?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-6 text-black/20" size={24} />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            className={cn(
                                                "w-full h-18 border-4 border-black bg-white pl-16 pr-20 font-black uppercase text-sm focus:bg-black focus:text-white transition-all outline-none",
                                                pwError && "border-[#E11D48] text-[#E11D48]"
                                            )}
                                            placeholder="ENTER_PASSWORD"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onBlur={() => setTouched(p => ({ ...p, password: true }))}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPw(v => !v)}
                                            className="absolute right-6 top-6 text-black/40 hover:text-black"
                                        >
                                            {showPw ? <EyeOff size={24} strokeWidth={3} /> : <Eye size={24} strokeWidth={3} />}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-18 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors shadow-[8px_8px_0px_#E11D48] disabled:opacity-50 flex items-center justify-center gap-4 group"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={24} strokeWidth={3} />
                                    ) : (
                                        <>
                                            LOG_IN_NOW
                                            <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="relative my-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-4 border-black" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-6 bg-white text-[10px] font-black uppercase tracking-[0.3em] text-black/40">OR_CONTINUE_WITH</span>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={handleGoogle} 
                                disabled={isLoading}
                                className="w-full h-16 border-4 border-black bg-white hover:bg-black hover:text-white transition-all font-black uppercase text-[10px] flex items-center justify-center gap-4"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                                </svg>
                                LOG_IN_WITH_GOOGLE
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-black/40">
                                NEW_HERE\?{' '}
                                <Link to="/signup" className="text-black hover:text-[#E11D48] underline decoration-4 underline-offset-4">
                                    CREATE_ACCOUNT
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
                            OUR<br />FEATURES
                        </h1>
                        <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em] max-w-lg leading-relaxed">
                            CASHLY is engineered for high-velocity financial auditing. Experience the mission-audit workspace designed for the next generation.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 relative z-10 my-auto">
                        <div className="border-4 border-white p-8 bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center justify-between mb-6">
                                <Inbox size={32} strokeWidth={3} className="text-[#E11D48] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-white/20">01</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest mb-3">SMART_INBOX</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                                Stop unexpected charges before they hit your ledger. All automated entries stay in staging until you authorize.
                            </p>
                        </div>

                        <div className="border-4 border-white p-8 bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center justify-between mb-6">
                                <Cpu size={32} strokeWidth={3} className="text-white group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-white/20">02</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest mb-3">AI_INSIGHTS</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                                Advanced AI analyzes your telemetry to detect anomalies, predict renewal peaks, and optimize your capital flow.
                            </p>
                        </div>

                        <div className="border-4 border-white p-8 bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center justify-between mb-6">
                                <Globe size={32} strokeWidth={3} className="text-white group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-white/20">03</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest mb-3">AUTO_SYNC</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                                Seamlessly integrate your browser extension, receipt captures, and bank nodes for a unified mission-state view.
                            </p>
                        </div>

                        <div className="border-4 border-white p-8 bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center justify-between mb-6">
                                <BarChart3 size={32} strokeWidth={3} className="text-[#E11D48] group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-white/20">04</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest mb-3">DETAILED_REPORTS</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">
                                Professional-grade analytics and pixel-perfect PDF exports for your monthly financial post-mortem and goal tracking.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                        <div className="border-4 border-white p-6 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <Zap size={24} strokeWidth={3} className="text-[#E11D48]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">SYSTEM_LATENCY: 12ms</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <Target size={24} strokeWidth={3} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">UPTIME: 99.99%</span>
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

export default LoginPage;
