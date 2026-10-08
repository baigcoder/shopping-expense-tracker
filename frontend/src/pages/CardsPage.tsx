import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, CreditCard, Trash2,
    Landmark, Building2, Snowflake, Star,
    Pencil, Target,
    Briefcase, Banknote, RefreshCw, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCardStore, useModalStore, useAuthStore, Card } from '../store/useStore';
import bankAccountService, { BankAccount } from '../services/bankAccountService';
import { formatCurrency } from '../services/currencyService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const ACCOUNT_TYPE_CONFIG = {
    checking: { label: 'Checking', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    savings: { label: 'Savings', icon: Landmark, color: 'text-emerald-600 bg-emerald-50' },
    credit: { label: 'Credit Card', icon: CreditCard, color: 'text-rose-600 bg-rose-50' },
    investment: { label: 'Investment', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
    cash: { label: 'Cash / Other', icon: Banknote, color: 'text-amber-600 bg-amber-50' }
};

export const CardsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'accounts' ? 'accounts' : 'cards';

    const [activeTab, setActiveTab] = useState<'cards' | 'accounts'>(initialTab);
    const { cards, initializeCards, removeCard, updateCard, isLoading: cardsLoading } = useCardStore();
    const { openAddCard } = useModalStore();
    const { user } = useAuthStore();
    const sound = useSound();

    // Accounts state
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    const [accountForm, setAccountForm] = useState({
        name: '',
        bank_name: '',
        account_type: 'checking' as BankAccount['account_type'],
        balance: '',
    });
    const [accountSubmitting, setAccountSubmitting] = useState(false);

    // Selected Card inspection modal
    const [viewingCard, setViewingCard] = useState<Card | null>(null);
    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [editedLimit, setEditedLimit] = useState('');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'accounts' || tab === 'cards') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'cards' | 'accounts') => {
        setActiveTab(tab);
        setSearchParams(tab === 'cards' ? {} : { tab });
    };

    // Load Cards & Accounts
    const fetchAccounts = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await bankAccountService.getAll(user.id);
            setAccounts(data);
        } catch {
            console.error('Failed to load accounts');
        } finally {
            setAccountsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            initializeCards(user.id);
            fetchAccounts();
        }
    }, [user?.id, initializeCards, fetchAccounts]);

    const handleRefresh = async () => {
        setRefreshing(true);
        if (user?.id) {
            initializeCards(user.id);
            await fetchAccounts();
        }
        toast.success('Instruments synchronized');
    };

    // Toggle card freeze
    const handleToggleFreeze = async (card: Card) => {
        const newFrozen = !card.is_frozen;
        await updateCard(card.id, { is_frozen: newFrozen });
        if (viewingCard?.id === card.id) {
            setViewingCard({ ...viewingCard, is_frozen: newFrozen });
        }
        toast.success(newFrozen ? `${card.nickname || 'Card'} frozen` : `${card.nickname || 'Card'} unfrozen`);
        sound.playClick();
    };

    // Set Default Card
    const handleSetDefault = async (card: Card) => {
        for (const c of cards) {
            if (c.is_default && c.id !== card.id) {
                await updateCard(c.id, { is_default: false });
            }
        }
        await updateCard(card.id, { is_default: true });
        if (viewingCard?.id === card.id) {
            setViewingCard({ ...viewingCard, is_default: true });
        }
        toast.success(`${card.nickname || 'Card'} set as primary payment card`);
        sound.playSuccess();
    };

    // Delete Card
    const handleDeleteCard = async (cardId: string, cardName: string) => {
        if (!confirm(`Delete payment card "${cardName}"?`)) return;
        await removeCard(cardId);
        if (viewingCard?.id === cardId) setViewingCard(null);
        toast.success('Card removed');
        sound.playClick();
    };

    // Update Spending Limit
    const handleSaveLimit = async () => {
        if (!viewingCard) return;
        const limit = parseFloat(editedLimit);
        if (isNaN(limit) || limit < 0) {
            toast.error('Please enter a valid spending limit');
            return;
        }
        await updateCard(viewingCard.id, { spending_limit: limit });
        setViewingCard({ ...viewingCard, spending_limit: limit });
        setIsEditingLimit(false);
        toast.success('Card spending limit updated');
    };

    // Bank Account Handlers
    const handleOpenAddAccount = () => {
        setEditingAccount(null);
        setAccountForm({
            name: '',
            bank_name: '',
            account_type: 'checking',
            balance: '',
        });
        setShowAccountModal(true);
    };

    const handleOpenEditAccount = (acc: BankAccount) => {
        setEditingAccount(acc);
        setAccountForm({
            name: acc.name,
            bank_name: acc.bank_name,
            account_type: acc.account_type,
            balance: acc.balance.toString(),
        });
        setShowAccountModal(true);
    };

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !accountForm.name) return;
        setAccountSubmitting(true);
        try {
            const balanceNum = parseFloat(accountForm.balance) || 0;
            const data = {
                user_id: user.id,
                name: accountForm.name,
                bank_name: accountForm.bank_name || 'Bank',
                account_type: accountForm.account_type,
                balance: balanceNum,
                currency: 'USD',
                color: '#E11D48',
                icon: accountForm.account_type,
                is_active: true,
                last_updated: new Date().toISOString()
            };

            if (editingAccount) {
                await bankAccountService.update(editingAccount.id, data);
                toast.success('Account updated');
            } else {
                await bankAccountService.create(data);
                toast.success('Bank account linked');
            }

            setShowAccountModal(false);
            fetchAccounts();
        } catch {
            toast.error('Failed to save bank account');
        } finally {
            setAccountSubmitting(false);
        }
    };

    const handleDeleteAccount = async (id: string, name: string) => {
        if (!confirm(`Remove account "${name}"?`)) return;
        const success = await bankAccountService.delete(id);
        if (success) {
            toast.success('Account removed');
            fetchAccounts();
        } else {
            toast.error('Failed to delete account');
        }
    };

    // Net worth summary
    const netWorthData = useMemo(() => {
        return bankAccountService.calculateNetWorth(accounts);
    }, [accounts]);

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)] text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Capital Infrastructure
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[var(--color-ink)] tracking-tight">
                        Instruments & Channels
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1.5 max-w-xl font-normal leading-relaxed">
                        Physical payment cards, spending limits, and connected bank capital feeds synchronized with the browser capture engine.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-xs h-9 px-4 text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[var(--color-brand)]', refreshing && 'animate-spin')} />
                        Sync Feeds
                    </Button>
                    {activeTab === 'cards' ? (
                        <Button
                            size="sm"
                            onClick={openAddCard}
                            className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-xs h-9 px-4 shadow-sm transition-all"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Payment Card
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={handleOpenAddAccount}
                            className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-xs h-9 px-4 shadow-sm transition-all"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Link Bank Account
                        </Button>
                    )}
                </div>
            </div>

            {/* Instrument Editorial Pill Tabs */}
            <div className="flex items-center justify-between pb-2">
                <div className="inline-flex p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xs">
                    <button
                        onClick={() => handleTabChange('cards')}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
                            activeTab === 'cards'
                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        )}
                    >
                        <CreditCard className={cn('h-3.5 w-3.5', activeTab === 'cards' ? 'text-[var(--color-brand)]' : '')} />
                        <span>Payment Cards ({cards.length})</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('accounts')}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
                            activeTab === 'accounts'
                                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        )}
                    >
                        <Landmark className={cn('h-3.5 w-3.5', activeTab === 'accounts' ? 'text-[var(--color-brand)]' : '')} />
                        <span>Bank Accounts ({accounts.length})</span>
                    </button>
                </div>
            </div>

            {/* Content: Cards Tab */}
            {activeTab === 'cards' && (
                <div className="space-y-6">
                    {cardsLoading && cards.length === 0 ? (
                        <div className="p-12 text-center text-xs text-[var(--color-muted)] animate-pulse">
                            Loading payment instruments...
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                            <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto text-[var(--color-brand)]">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-[var(--color-ink)]">
                                    No payment cards linked
                                </h3>
                                <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto mt-1">
                                    Link your cards to automatically match checkout receipts from the companion extension.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Button
                                    size="sm"
                                    onClick={openAddCard}
                                    className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-semibold px-4 h-9"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add Your First Card
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cards.map((card) => {
                                const limit = card.spending_limit || 0;
                                const spent = card.total_spent || 0;
                                const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => {
                                            setViewingCard(card);
                                            setEditedLimit(card.spending_limit?.toString() || '');
                                        }}
                                        className="cursor-pointer group p-6 rounded-2xl bg-[#111111] text-white border border-[#222222] shadow-sm hover:border-[var(--color-brand)] transition-all space-y-5 relative overflow-hidden"
                                    >
                                        {/* Card Visual Mini Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#222222] text-[var(--color-brand)] flex items-center justify-center font-bold text-xs font-mono border border-white/10">
                                                    {(card.type || 'card').slice(0, 4).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white">
                                                        {card.nickname || `${(card.type || 'Card').toUpperCase()} •••• ${card.last4 || '••••'}`}
                                                    </div>
                                                    <div className="text-[11px] text-white/50 font-mono">
                                                        •••• {card.last4 || '••••'} {card.expiry ? `| Exp ${card.expiry}` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {card.is_default && (
                                                    <Badge variant="default" className="text-[9px] bg-[#EE5024] text-white font-mono uppercase">
                                                        Primary
                                                    </Badge>
                                                )}
                                                {card.is_frozen && (
                                                    <Badge variant="destructive" className="text-[9px] font-mono uppercase">
                                                        Frozen
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Spending Limit Progress */}
                                        <div className="space-y-1.5 pt-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--color-text-muted)]">Current Month Spent</span>
                                                <span className="tabular-nums font-mono font-semibold text-[var(--color-text-primary)]">
                                                    {formatCurrency(spent)} {limit > 0 ? `/ ${formatCurrency(limit)}` : ''}
                                                </span>
                                            </div>
                                            {limit > 0 && (
                                                <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all',
                                                            progress >= 100 ? 'bg-[var(--color-danger)]' : progress >= 80 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-positive)]'
                                                        )}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
                                            <span>Click to inspect & control</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Content: Accounts Tab */}
            {activeTab === 'accounts' && (
                <div className="space-y-6">
                    {/* Net Worth Summary Bento */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                                <span>Liquid Assets</span>
                                <Building2 className="h-4 w-4 text-[var(--color-positive)]" />
                            </div>
                            <div className="text-2xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-positive)]">
                                {accountsLoading ? '—' : formatCurrency(netWorthData.assets)}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                                Checking, savings & deposits
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                                <span>Liabilities & Balances</span>
                                <CreditCard className="h-4 w-4 text-[var(--color-danger)]" />
                            </div>
                            <div className="text-2xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-danger)]">
                                {accountsLoading ? '—' : formatCurrency(netWorthData.liabilities)}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                                Outstanding credit balances
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                                <span>Total Net Worth</span>
                                <Target className="h-4 w-4 text-[var(--color-brand)]" />
                            </div>
                            <div className={cn(
                                "text-2xl font-bold tracking-tight tabular-nums font-mono",
                                netWorthData.netWorth >= 0 ? "text-[var(--color-text-primary)]" : "text-[var(--color-danger)]"
                            )}>
                                {accountsLoading ? '—' : formatCurrency(netWorthData.netWorth)}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                                Across all active accounts
                            </div>
                        </div>
                    </div>

                    {/* Accounts List */}
                    {accountsLoading ? (
                        <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                            Synchronizing bank accounts...
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-12 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3">
                            <div className="h-12 w-12 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                    No bank accounts connected
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
                                    Link your checking, savings, and credit accounts to track your net worth.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Button
                                    size="sm"
                                    onClick={handleOpenAddAccount}
                                    className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Link Account
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden divide-y divide-[var(--color-border-subtle)]">
                            {accounts.map((acc) => {
                                const config = ACCOUNT_TYPE_CONFIG[acc.account_type] || ACCOUNT_TYPE_CONFIG.checking;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={acc.id}
                                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-subtle)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                        {acc.name}
                                                    </span>
                                                    <Badge variant="secondary" className="text-[10px] font-mono">
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                    {acc.bank_name} • Last updated {new Date(acc.last_updated).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-base font-bold tabular-nums font-mono",
                                                    acc.account_type === 'credit' ? "text-[var(--color-danger)]" : "text-[var(--color-text-primary)]"
                                                )}>
                                                    {formatCurrency(acc.balance)}
                                                </div>
                                                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-mono">
                                                    {acc.account_type === 'credit' ? 'Outstanding' : 'Available'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEditAccount(acc)}
                                                    className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                                    className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Inspect Card Details Dialog */}
            <Dialog open={!!viewingCard} onOpenChange={(open) => !open && setViewingCard(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center justify-between">
                            <span>{viewingCard?.nickname || `${(viewingCard?.type || 'Card').toUpperCase()} •••• ${viewingCard?.last4}`}</span>
                            {viewingCard?.is_default && (
                                <Badge variant="default" className="text-[10px] bg-[var(--color-brand)] font-mono">Primary Card</Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Manage spending limits, freeze status, and security rules.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingCard && (
                        <div className="space-y-4 pt-2">
                            {/* Card Attributes */}
                            <div className="p-4 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-muted)]">Card Brand</span>
                                    <span className="font-semibold uppercase">{viewingCard.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-muted)]">Card Number</span>
                                    <span className="font-mono font-semibold">•••• •••• •••• {viewingCard.last4}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-muted)]">Expiration</span>
                                    <span className="font-semibold font-mono">{viewingCard.expiry}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                                    <span className="text-[var(--color-text-muted)]">Monthly Spending</span>
                                    <span className="font-bold tabular-nums font-mono text-[var(--color-text-primary)]">{formatCurrency(viewingCard.total_spent || 0)}</span>
                                </div>
                            </div>

                            {/* Monthly Spending Limit */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Monthly Spending Ceiling</Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingLimit(!isEditingLimit)}
                                        className="text-[11px] text-[var(--color-brand)] font-medium hover:underline"
                                    >
                                        {isEditingLimit ? 'Cancel' : 'Edit Limit'}
                                    </button>
                                </div>

                                {isEditingLimit ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={editedLimit}
                                            onChange={e => setEditedLimit(e.target.value)}
                                            placeholder="1000"
                                            className="rounded-xl h-9 text-xs bg-[var(--color-surface-subtle)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleSaveLimit}
                                            className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs h-9"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] text-xs font-semibold font-mono tabular-nums text-[var(--color-text-primary)]">
                                        {viewingCard.spending_limit ? formatCurrency(viewingCard.spending_limit) : 'No limit set (Uncapped)'}
                                    </div>
                                )}
                            </div>

                            {/* Card Control Actions */}
                            <div className="pt-2 flex flex-col gap-2">
                                {!viewingCard.is_default && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetDefault(viewingCard)}
                                        className="w-full rounded-xl text-xs h-9 justify-center border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]"
                                    >
                                        <Star className="h-3.5 w-3.5 mr-1.5 text-[var(--color-warning)]" />
                                        Make Primary Payment Card
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleFreeze(viewingCard)}
                                    className={cn(
                                        'w-full rounded-xl text-xs h-9 justify-center border-[var(--color-border)]',
                                        viewingCard.is_frozen 
                                            ? 'text-[var(--color-positive)] border-[var(--color-positive)]/30 hover:bg-[var(--color-positive-subtle)]' 
                                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]'
                                    )}
                                >
                                    <Snowflake className="h-3.5 w-3.5 mr-1.5" />
                                    {viewingCard.is_frozen ? 'Unfreeze Card' : 'Freeze Card Temporarily'}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCard(viewingCard.id, viewingCard.nickname || viewingCard.last4)}
                                    className="w-full text-xs h-8 text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete Card
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add / Edit Bank Account Modal */}
            <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editingAccount ? 'Edit Bank Account' : 'Link Bank Account'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--cashly-text-muted)]">
                            Track your liquid checking, savings, or liabilities in Cashly.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveAccount} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Account Label</Label>
                            <Input
                                placeholder="e.g. Primary Checking, High Yield Savings"
                                value={accountForm.name}
                                onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Financial Institution</Label>
                            <Input
                                placeholder="e.g. Chase, Bank of America, Ally"
                                value={accountForm.bank_name}
                                onChange={e => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Account Type</Label>
                                <Select
                                    value={accountForm.account_type}
                                    onValueChange={(val: any) => setAccountForm(prev => ({ ...prev, account_type: val }))}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="checking">Checking</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                        <SelectItem value="credit">Credit Card</SelectItem>
                                        <SelectItem value="investment">Investment</SelectItem>
                                        <SelectItem value="cash">Cash / Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Current Balance ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="2500.00"
                                    value={accountForm.balance}
                                    onChange={e => setAccountForm(prev => ({ ...prev, balance: e.target.value }))}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAccountModal(false)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={accountSubmitting}
                                className="rounded-xl bg-[var(--cashly-brand)] hover:bg-[var(--cashly-brand-hover)] text-white text-xs"
                            >
                                {accountSubmitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Link Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CardsPage;
