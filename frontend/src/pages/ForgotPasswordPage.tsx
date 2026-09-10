import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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
            toast.success('Check your email for a reset link');
        } catch (error: any) {
            toast.error(error?.message || 'Could not send a reset link');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={sent ? 'Check your email' : 'Forgot password'}
            subtitle={sent ? `Reset instructions were sent to ${email}.` : 'Enter the email on your account and we will send a reset link.'}
        >
            {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#57534E]">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
                            <Input
                                type="email"
                                className="pl-10"
                                placeholder="you@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="h-11 w-full">
                        {isLoading ? 'Sending…' : 'Send reset link'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                        <ArrowLeft size={16} />
                        Back to sign in
                    </Button>
                </form>
            ) : (
                <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                        <CheckCircle className="h-7 w-7" />
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                        Try another email
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                        Back to sign in
                    </Button>
                </div>
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
