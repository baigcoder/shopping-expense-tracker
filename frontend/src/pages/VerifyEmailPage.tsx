import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const token = searchParams.get('token');

        // Simulate verification
        setTimeout(() => {
            if (token) {
                setStatus('success');
                toast.success('Email verified successfully!');
            } else {
                setStatus('error');
            }
        }, 2000);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    {status === 'loading' && (
                        <div className="text-center py-8">
                            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Verifying Your Email</h2>
                            <p className="text-muted-foreground">Please wait...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                            <p className="text-muted-foreground mb-6">
                                Your email has been successfully verified. You can now access all features.
                            </p>
                            <Button onClick={() => navigate('/dashboard')} className="w-full">
                                Go to Dashboard
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                            <p className="text-muted-foreground mb-6">
                                The verification link is invalid or has expired.
                            </p>
                            <div className="space-y-2">
                                <Button className="w-full">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Resend Verification Email
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                                    Back to Login
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;
