// Linked Bank Accounts Card Component
// Shows connected bank accounts with sync and disconnect options
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, RefreshCw, Trash2, Clock,
    Loader2, Building2
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import PlaidLinkButton from './PlaidLinkButton';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LinkedAccount {
    id: string;
    institution_name: string;
    account_name: string;
    account_type: string;
    account_mask: string;
    current_balance: number;
    available_balance: number;
    currency: string;
    last_synced: string;
}

const LinkedAccountsCard = () => {
    const { user } = useAuthStore();
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    const fetchAccounts = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch(`${API_BASE}/plaid/accounts?user_id=${user.id}`);
            const data = await response.json();
            if (data.success) {
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [user?.id]);

    const handleSync = async (accountId: string) => {
        setSyncing(accountId);
        try {
            const response = await fetch(`${API_BASE}/plaid/sync-transactions/${accountId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                fetchAccounts();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Sync failed');
        } finally {
            setSyncing(null);
        }
    };

    const handleDisconnect = async (accountId: string, bankName: string) => {
        if (!confirm(`Disconnect ${bankName}? This won't delete imported transactions.`)) return;

        try {
            const response = await fetch(`${API_BASE}/plaid/disconnect/${accountId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Account disconnected');
                setAccounts(prev => prev.filter(a => a.id !== accountId));
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to disconnect');
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency
        }).format(amount);
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
                <span className="ml-3 text-sm text-slate-500">Loading accounts...</span>
            </div>
        );
    }

    return (
        <div className="p-5">
            {accounts.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No bank accounts connected</h3>
                    <p className="text-sm text-slate-500 mb-5">Connect your bank to automatically import transactions</p>
                    <PlaidLinkButton
                        variant="primary"
                        size="md"
                        onSuccess={fetchAccounts}
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Connect More Button */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-600">
                            {accounts.length} account{accounts.length !== 1 ? 's' : ''} linked
                        </span>
                        <PlaidLinkButton
                            variant="outline"
                            size="sm"
                            onSuccess={fetchAccounts}
                        />
                    </div>

                    {/* Accounts List */}
                    <AnimatePresence>
                        {accounts.map((account, i) => (
                            <motion.div
                                key={account.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-800">{account.institution_name}</h4>
                                        <span className="text-xs text-slate-500">
                                            {account.account_name} ••{account.account_mask}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-slate-800">
                                            {formatCurrency(account.current_balance, account.currency)}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Clock className="h-3 w-3" /> {timeAgo(account.last_synced)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-teal-600 hover:bg-teal-50"
                                            onClick={() => handleSync(account.id)}
                                            disabled={syncing === account.id}
                                            title="Sync transactions"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${syncing === account.id ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                            onClick={() => handleDisconnect(account.id, account.institution_name)}
                                            title="Disconnect"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default LinkedAccountsCard;
