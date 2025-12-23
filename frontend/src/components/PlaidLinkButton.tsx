// Plaid Link Button Component
// Allows users to connect their bank accounts via Plaid
import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { motion } from 'framer-motion';
import { Landmark, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { toast } from 'react-toastify';
import styles from './PlaidLinkButton.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PlaidLinkButtonProps {
    onSuccess?: () => void;
    variant?: 'primary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const PlaidLinkButton = ({ onSuccess, variant = 'primary', size = 'md' }: PlaidLinkButtonProps) => {
    const { user } = useAuthStore();
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // Fetch link token on mount
    useEffect(() => {
        const fetchLinkToken = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch(`${API_BASE}/plaid/create-link-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id })
                });

                const data = await response.json();
                if (data.success && data.link_token) {
                    setLinkToken(data.link_token);
                }
            } catch (error) {
                console.error('Failed to get link token:', error);
            }
        };

        fetchLinkToken();
    }, [user?.id]);

    // Handle successful bank connection
    const handleSuccess: PlaidLinkOnSuccess = useCallback(async (publicToken, metadata) => {
        setLoading(true);
        setStatus('loading');

        try {
            const response = await fetch(`${API_BASE}/plaid/exchange-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    public_token: publicToken,
                    user_id: user?.id,
                    metadata: {
                        institution: metadata.institution
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                toast.success(data.message || 'Bank account connected!');
                onSuccess?.();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            setStatus('error');
            toast.error(error.message || 'Failed to connect bank');
        } finally {
            setLoading(false);
        }
    }, [user?.id, onSuccess]);

    // Handle exit
    const handleExit: PlaidLinkOnExit = useCallback((error, _metadata) => {
        if (error) {
            console.error('Plaid Link error:', error);
            toast.error('Bank connection cancelled');
        }
    }, []);

    // Initialize Plaid Link
    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: handleSuccess,
        onExit: handleExit,
    });

    const handleClick = () => {
        if (ready && linkToken) {
            open();
        } else {
            toast.error('Bank connection not ready. Please try again.');
        }
    };

    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        (loading || !ready) ? styles.disabled : ''
    ].filter(Boolean).join(' ');

    return (
        <motion.button
            className={buttonClasses}
            onClick={handleClick}
            disabled={loading || !ready || !linkToken}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {loading ? (
                <Loader2 className={styles.spinner} size={18} />
            ) : status === 'success' ? (
                <CheckCircle size={18} />
            ) : status === 'error' ? (
                <XCircle size={18} />
            ) : (
                <Landmark size={18} />
            )}
            <span>
                {loading ? 'Connecting...' :
                    status === 'success' ? 'Connected!' :
                        !ready ? 'Loading...' : 'Connect Bank'}
            </span>
        </motion.button>
    );
};

export default PlaidLinkButton;
