import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from '../config/supabase';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(email);
            setSent(true);
            toast.success('Check your email for a recovery link');
        } catch (error: any) {
            toast.error(error?.message || 'Could not send a recovery link');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={sent ? 'Check your inbox' : 'Reset your password'}
            subtitle={
                sent
                    ? `We sent password reset instructions to ${email}.`
                    : 'Enter the email address associated with your Cashly workspace.'
            }
        >
            {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                            Account Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                            <Input
                                type="email"
                                className="h-11 pl-10 text-sm border-[var(--color-border)] focus-visible:ring-[var(--color-brand)]"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="h-11 w-full bg-[var(--color-brand)] text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending recovery link…
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send recovery link
                            </>
                        )}
                    </Button>

                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-xs font-medium text-[#57534E] hover:text-[#1C1917]" 
                        onClick={() => navigate('/login')}
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                        Back to sign in
                    </Button>
                </form>
            ) : (
                <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>

                    <p className="text-xs text-[#57534E] leading-relaxed">
                        Didn't receive the email? Check your spam folder or try another address.
                    </p>

                    <div className="space-y-2">
                        <Button 
                            variant="outline" 
                            className="h-11 w-full border-[#E7E5E4] bg-white text-xs font-semibold text-[#1C1917] hover:bg-[#FAF8F5]" 
                            onClick={() => setSent(false)}
                        >
                            Try another email
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-xs font-medium text-[#78716C] hover:text-[#1C1917]" 
                            onClick={() => navigate('/login')}
                        >
                            Back to sign in
                        </Button>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
