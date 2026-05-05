import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, Mail, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'VERIFIED_SUCCESSFULLY' | 'error'>('loading');

    useEffect(() => {
        const token = searchParams.get('token');
        setTimeout(() => {
            if (token) {
                setStatus('VERIFIED_SUCCESSFULLY');
                toast.success('EMAIL_VERIFIED');
            } else {
                setStatus('error');
            }
        }, 2000);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8 font-bold selection:bg-black selection:text-white">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md border-8 border-black bg-white p-12 shadow-[16px_16px_0px_#000000] relative z-10"
            >
                {status === 'loading' && (
                    <div className="text-center space-y-8">
                        <div className="w-24 h-24 border-8 border-black flex items-center justify-center mx-auto bg-black text-white">
                            <Loader2 className="h-12 w-12 animate-spin" strokeWidth={4} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">VERIFYING_EMAIL</h2>
                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Connecting to secure node...</p>
                        </div>
                    </div>
                )}

                {status === 'VERIFIED_SUCCESSFULLY' && (
                    <div className="text-center space-y-10">
                        <div className="w-24 h-24 border-8 border-black flex items-center justify-center mx-auto bg-[#10b981] text-white">
                            <CheckCircle className="h-12 w-12" strokeWidth={4} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">VERIFIED_SUCCESSFULLY</h2>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">
                                Your identity node has been authorized. Full access granted.
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full h-20 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-[#10b981] transition-colors border-4 border-black shadow-[8px_8px_0px_#10b981] hover:shadow-none hover:translate-x-2 hover:translate-y-2"
                        >
                            GO_TO_DASHBOARD
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center space-y-10">
                        <div className="w-24 h-24 border-8 border-black flex items-center justify-center mx-auto bg-[#E11D48] text-white">
                            <AlertCircle className="h-12 w-12" strokeWidth={4} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">VERIFICATION_FAILED</h2>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">
                                Token expired or invalid node address detected.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <button className="w-full h-16 bg-black text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border-4 border-black">
                                <Mail size={18} strokeWidth={3} />
                                RESEND_EMAIL
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full h-16 border-4 border-black bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-colors"
                            >
                                <ArrowLeft size={18} strokeWidth={3} />
                                BACK_TO_LOGIN
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmailPage;
