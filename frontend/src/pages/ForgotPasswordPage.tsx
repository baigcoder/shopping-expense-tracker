import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, ShieldQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        toast.success('RESET_LINK_SENT');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-8 font-bold selection:bg-black selection:text-white">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
            
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md border-8 border-black bg-white p-12 shadow-[16px_16px_0px_#000000] relative z-10"
            >
                {!sent ? (
                    <>
                        <header className="mb-12 space-y-4">
                            <div className="inline-flex items-center gap-3 border-4 border-black px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                <ShieldQuestion size={16} strokeWidth={3} />
                                ACCOUNT_RECOVERY
                            </div>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">FORGOT_PASSWORD\?</h2>
                            <p className="text-xs font-black text-black/40 uppercase tracking-widest leading-relaxed">
                                Enter your identity node address to receive recovery instructions.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Email_Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-6 text-black/20" size={24} />
                                    <input
                                        type="email"
                                        className="w-full h-18 border-4 border-black bg-white pl-16 pr-8 font-black uppercase text-sm focus:bg-black focus:text-white transition-all outline-none"
                                        placeholder="ENTER_YOUR_EMAIL"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button 
                                    type="submit" 
                                    className="w-full h-20 bg-black text-white font-black uppercase tracking-widest text-sm hover:bg-[#E11D48] transition-colors border-4 border-black shadow-[8px_8px_0px_#E11D48] hover:shadow-none hover:translate-x-2 hover:translate-y-2"
                                >
                                    SEND_RESET_LINK
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full h-16 border-4 border-black bg-white text-black font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={18} strokeWidth={3} />
                                    BACK_TO_LOGIN
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center space-y-10">
                        <div className="w-24 h-24 border-8 border-black flex items-center justify-center mx-auto bg-[#10b981] text-white">
                            <CheckCircle className="h-12 w-12" strokeWidth={4} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">EMAIL_SENT</h2>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 leading-relaxed">
                                Recovery instructions sent to:<br />
                                <strong className="text-black">{email}</strong>
                            </p>
                        </div>
                        <div className="space-y-4 pt-4 border-t-4 border-black/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
                                Didn't receive the node signal?
                            </p>
                            <button 
                                onClick={() => setSent(false)}
                                className="w-full h-16 border-4 border-black bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
                            >
                                TRY_ANOTHER_EMAIL
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
