import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Repeat, Plus,
    Trash2, Clock, RefreshCw,
    Timer, Check, AlertCircle, TrendingUp,
    FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { billService, Bill } from '../services/billService';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanNavigationTabs } from '@/components/PlanNavigationTabs';

const SUBSCRIPTION_CATEGORIES = [
    'Entertainment', 'Music', 'Software', 'Gaming', 'Fitness',
    'News', 'Education', 'Cloud Storage', 'Productivity', 'Other'
];

const BILL_CATEGORIES = [
    'Utilities', 'Housing & Rent', 'Internet & Phone', 'Insurance',
    'Loan & Credit', 'Taxes', 'Healthcare', 'Subscriptions', 'Other'
];

type CommitmentTab = 'all' | 'subscriptions' | 'bills' | 'trials';

export const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as CommitmentTab) || 'all';

    const [activeTab, setActiveTab] = useState<CommitmentTab>(initialTab);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);

    // Modal state
    const [addModalType, setAddModalType] = useState<'subscription' | 'bill' | null>(null);

    // Subscription Form
    const [subForm, setSubForm] = useState({
        name: '',
        category: 'Entertainment',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
        color: '#0F766E',
        is_trial: false,
        trial_days: '7',
        start_date: new Date().toISOString().split('T')[0],
    });

    // Bill Form
    const [billForm, setBillForm] = useState({
        name: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'Utilities',
        frequency: 'monthly' as Bill['frequency'],
        reminderDays: '3',
        notes: '',
    });

    const [submitting, setSubmitting] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab') as CommitmentTab;
        if (tab && ['all', 'subscriptions', 'bills', 'trials'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: CommitmentTab) => {
        setActiveTab(tab);
        setSearchParams(tab === 'all' ? {} : { tab });
    };

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [subs, billsData] = await Promise.all([
                subscriptionService.getAll(user.id),
                billService.getAll(user.id),
            ]);
            setSubscriptions(subs);
            setBills(billsData);
        } catch (error) {
            console.error('Failed to load commitments:', error);
            toast.error('Could not load commitments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        toast.success('Commitments synchronized');
    };

    // Calculations
    const activeSubs = useMemo(() => subscriptions.filter(s => s.status !== 'cancelled' && !s.is_trial), [subscriptions]);
    const trialSubs = useMemo(() => subscriptions.filter(s => s.is_trial && s.status !== 'cancelled'), [subscriptions]);
    const unpaidBills = useMemo(() => bills.filter(b => !b.is_paid), [bills]);

    const monthlySubTotal = useMemo(() => {
        return activeSubs.reduce((sum, s) => {
            if (s.cycle === 'monthly') return sum + s.price;
            if (s.cycle === 'yearly') return sum + (s.price / 12);
            if (s.cycle === 'weekly') return sum + (s.price * 4);
            return sum;
        }, 0);
    }, [activeSubs]);

    const monthlyBillTotal = useMemo(() => {
        return bills.reduce((sum, b) => {
            if (b.frequency === 'monthly') return sum + b.amount;
            if (b.frequency === 'yearly') return sum + (b.amount / 12);
            if (b.frequency === 'quarterly') return sum + (b.amount / 3);
            if (b.frequency === 'one-time' && !b.is_paid) return sum + b.amount;
            return sum;
        }, 0);
    }, [bills]);

    const totalMonthlyCommitted = monthlySubTotal + monthlyBillTotal;
    const annualRunRate = totalMonthlyCommitted * 12;

    // Obligations due in next 7 days
    const upcomingNext7Days = useMemo(() => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

        let count = 0;
        let amount = 0;

        // Check bills
        bills.forEach(b => {
            if (b.is_paid && b.frequency === 'one-time') return;
            const nextDue = billService.getNextDueDate(b);
            if (nextDue >= startOfToday && nextDue <= in7Days) {
                count++;
                amount += b.amount;
            }
        });

        // Check subscriptions
        subscriptions.forEach(s => {
            if (s.status === 'cancelled') return;
            if (s.renew_date || s.next_payment_date) {
                const renew = new Date(s.renew_date || s.next_payment_date || '');
                if (!isNaN(renew.getTime()) && renew >= startOfToday && renew <= in7Days) {
                    count++;
                    amount += s.price;
                }
            }
        });

        return { count, amount };
    }, [bills, subscriptions]);

    // Handle Actions
    const handleToggleSubStatus = async (sub: Subscription) => {
        const nextStatus = sub.is_active ? 'cancelled' : 'active';
        try {
            await subscriptionService.update(sub.id, {
                is_active: !sub.is_active,
                status: nextStatus
            });
            toast.success(`${sub.name} is now ${nextStatus}`);
            loadData();
        } catch {
            toast.error('Failed to update subscription');
        }
    };

    const handleDeleteSub = async (id: string, name: string) => {
        if (!confirm(`Remove ${name} from your commitments?`)) return;
        try {
            await subscriptionService.delete(id);
            toast.success(`${name} removed`);
            loadData();
        } catch {
            toast.error('Failed to delete subscription');
        }
    };

    const handleMarkBillPaid = async (bill: Bill) => {
        try {
            await billService.markAsPaid(bill.id);
            toast.success(`Marked ${bill.name} as paid!`);
            loadData();
        } catch {
            toast.error('Failed to update bill');
        }
    };

    const handleDeleteBill = async (id: string, name: string) => {
        if (!confirm(`Delete bill reminder for ${name}?`)) return;
        try {
            await billService.delete(id);
            toast.success(`${name} deleted`);
            loadData();
        } catch {
            toast.error('Failed to delete bill');
        }
    };

    // Form Submissions
    const handleAddSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !subForm.name || !subForm.price) return;
        setSubmitting(true);
        try {
            const price = parseFloat(subForm.price);
            if (isNaN(price) || price < 0) throw new Error('Invalid price');

            await subscriptionService.create({
                user_id: user.id,
                name: subForm.name,
                logo: '📦',
                category: subForm.category,
                price,
                cycle: subForm.cycle,
                color: subForm.color,
                is_active: true,
                status: subForm.is_trial ? 'trial' : 'active',
                is_trial: subForm.is_trial,
                trial_days: subForm.is_trial ? parseInt(subForm.trial_days) || 7 : undefined,
                start_date: subForm.start_date,
            });

            toast.success(`Added ${subForm.name} to commitments`);
            setAddModalType(null);
            setSubForm({
                name: '',
                category: 'Entertainment',
                price: '',
                cycle: 'monthly',
                color: '#E11D48',
                is_trial: false,
                trial_days: '7',
                start_date: new Date().toISOString().split('T')[0],
            });
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to add subscription');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !billForm.name || !billForm.amount) return;
        setSubmitting(true);
        try {
            const amount = parseFloat(billForm.amount);
            if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

            await billService.create(user.id, {
                name: billForm.name,
                amount,
                due_date: billForm.dueDate,
                category: billForm.category,
                is_recurring: billForm.frequency !== 'one-time',
                frequency: billForm.frequency,
                reminder_days: parseInt(billForm.reminderDays) || 3,
                is_paid: false,
                notes: billForm.notes || undefined,
            });

            toast.success(`Added ${billForm.name} bill reminder`);
            setAddModalType(null);
            setBillForm({
                name: '',
                amount: '',
                dueDate: new Date().toISOString().split('T')[0],
                category: 'Utilities',
                frequency: 'monthly',
                reminderDays: '3',
                notes: '',
            });
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to add bill');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)] text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Locked Capital Timeline
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[var(--color-ink)] tracking-tight">
                        Commitments & Bills
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1.5 max-w-xl font-normal leading-relaxed">
                        Fixed obligations, recurring subscriptions, and cashflow caps before discretionary spend.
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
                        Sync
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setAddModalType('subscription')}
                        className="rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-xs h-9 px-4 shadow-sm transition-all"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Commitment
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <PlanNavigationTabs
                badges={{
                    commitments: activeSubs.length + unpaidBills.length,
                }}
            />

            {/* Elevated Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Monthly Committed */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                        <span>Monthly Committed</span>
                        <Repeat className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="my-2">
                        <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(totalMonthlyCommitted)}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-muted)]">
                            <span className="font-semibold text-[var(--color-ink)] font-mono">{activeSubs.length}</span> subscriptions
                            <span>·</span>
                            <span className="font-semibold text-[var(--color-ink)] font-mono">{bills.length}</span> bills
                        </div>
                    </div>
                </div>

                {/* 2. Annual Run-Rate */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-slate-700 dark:border-t-slate-300 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                        <span>Annual Obligation Run-Rate</span>
                        <TrendingUp className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(annualRunRate)}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-2">
                            Projected 12-month baseline outflow
                        </div>
                    </div>
                </div>

                {/* 3. Due in Next 7 Days */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-rose-500 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                        <span>Due in Next 7 Days</span>
                        <Clock className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="my-2">
                        <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(upcomingNext7Days.amount)}
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span>{upcomingNext7Days.count} items require settlement soon</span>
                        </div>
                    </div>
                </div>

                {/* 4. Active Free Trials */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-t-4 border-t-blue-500 shadow-xs flex flex-col justify-between min-h-[150px] transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] font-mono">
                        <span>Active Free Trials</span>
                        <Timer className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="my-2">
                        <div className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : trialSubs.length}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-2 font-medium">
                            {trialSubs.length > 0 ? (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">Tracking conversion deadlines</span>
                            ) : (
                                'No active free trial risks'
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => handleTabChange('all')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            activeTab === 'all'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        All Commitments ({subscriptions.length + bills.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('subscriptions')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            activeTab === 'subscriptions'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        Subscriptions ({subscriptions.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('bills')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            activeTab === 'bills'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        Bills & Rent ({bills.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('trials')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                            activeTab === 'trials'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        <span>Free Trials</span>
                        {trialSubs.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500 text-white font-bold font-mono">
                                {trialSubs.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddModalType('bill')}
                        className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-xs h-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Bill
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddModalType('subscription')}
                        className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-xs h-8 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Subscription
                    </Button>
                </div>
            </div>

            {/* List / Table of Commitments */}
            {loading ? (
                <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Synchronizing commitments and due dates...
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Free Trial Urgent Alerts Banner */}
                    {trialSubs.length > 0 && (activeTab === 'all' || activeTab === 'trials') && (
                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                    <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Active Free Trials Requiring Attention
                                </span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] font-bold font-mono">
                                    {trialSubs.length} Active
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {trialSubs.map(trial => (
                                    <div key={trial.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-blue-100 dark:border-blue-900/40 shadow-xs">
                                        <div>
                                            <div className="font-semibold text-xs text-[var(--color-text-primary)]">{trial.name}</div>
                                            <div className="text-[11px] text-[var(--color-text-muted)] font-mono tabular-nums">
                                                Converts to {formatCurrency(trial.price)}/{trial.cycle}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="warning" className="text-[10px]">
                                                {trial.trial_days ? `${trial.trial_days}d trial` : 'Trial'}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleSubStatus(trial)}
                                                className="text-[11px] h-7 px-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Commitments Table / Rows */}
                    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] overflow-hidden">
                        <div className="divide-y divide-[var(--color-border-subtle)]">
                            {/* Subscriptions */}
                            {(activeTab === 'all' || activeTab === 'subscriptions') && subscriptions.map(sub => (
                                <div
                                    key={sub.id}
                                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-subtle)]/60 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                                            style={{ backgroundColor: sub.color || '#D92F57' }}
                                        >
                                            {sub.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                    {sub.name}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {sub.category}
                                                </Badge>
                                                {sub.is_trial && (
                                                    <Badge variant="warning" className="text-[10px]">
                                                        Trial
                                                    </Badge>
                                                )}
                                                {sub.status === 'cancelled' && (
                                                    <Badge variant="outline" className="text-[10px] text-stone-500">
                                                        Cancelled
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                                                <span className="capitalize">{sub.cycle} subscription</span>
                                                {sub.renew_date && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Renews {new Date(sub.renew_date).toLocaleDateString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                        <div className="text-right">
                                            <div className="text-base font-bold tabular-nums font-mono text-[var(--color-text-primary)]">
                                                {formatCurrency(sub.price)}
                                            </div>
                                            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                                                per {sub.cycle === 'yearly' ? 'yr' : sub.cycle === 'weekly' ? 'wk' : 'mo'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleSubStatus(sub)}
                                                className="h-8 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                            >
                                                {sub.is_active ? 'Pause' : 'Resume'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteSub(sub.id, sub.name)}
                                                className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-rose-600 rounded-lg"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Bills & Rent */}
                            {(activeTab === 'all' || activeTab === 'bills') && bills.map(bill => {
                                const nextDue = billService.getNextDueDate(bill);
                                const isOverdue = !bill.is_paid && nextDue < new Date();

                                return (
                                    <div
                                        key={bill.id}
                                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-subtle)]/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center font-bold text-sm text-[var(--color-text-secondary)] shrink-0 border border-[var(--color-border-subtle)]">
                                                <FileText className="h-5 w-5 text-[var(--color-text-secondary)]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                        {bill.name}
                                                    </span>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {bill.category}
                                                    </Badge>
                                                    {bill.is_paid ? (
                                                        <Badge variant="success" className="text-[10px]">
                                                            Paid
                                                        </Badge>
                                                    ) : isOverdue ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Overdue
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                                                    <span>Due: {nextDue.toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{bill.frequency}</span>
                                                    {bill.notes && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="italic text-[var(--color-text-muted)]">{bill.notes}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                            <div className="text-right">
                                                <div className="text-base font-bold tabular-nums font-mono text-[var(--color-text-primary)]">
                                                    {formatCurrency(bill.amount)}
                                                </div>
                                                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                                                    {bill.frequency} bill
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {!bill.is_paid && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleMarkBillPaid(bill)}
                                                        className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                    >
                                                        <Check className="h-3.5 w-3.5 mr-1" />
                                                        Mark Paid
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteBill(bill.id, bill.name)}
                                                    className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-rose-600 rounded-lg"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty state */}
                            {subscriptions.length === 0 && bills.length === 0 && (
                                <div className="p-12 text-center space-y-3">
                                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                                        <Repeat className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                            No recurring commitments tracked
                                        </h3>
                                        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
                                            Track your rent, utilities, streaming services, and SaaS tools to protect your cashflow.
                                        </p>
                                    </div>
                                    <div className="flex justify-center gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => setAddModalType('subscription')}
                                            className="rounded-xl bg-[var(--color-brand)] text-white text-xs h-8"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Add Subscription
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setAddModalType('bill')}
                                            className="rounded-xl border-[var(--color-border)] text-xs h-8 text-[var(--color-text-secondary)]"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Add Bill
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subscription Modal */}
            <Dialog open={addModalType === 'subscription'} onOpenChange={(open) => !open && setAddModalType(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[var(--color-text-primary)]">Add Subscription</DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Track a recurring SaaS, streaming, or subscription service.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubscription} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="sub-name" className="text-xs font-semibold text-[var(--color-text-primary)]">Service Name</Label>
                            <Input
                                id="sub-name"
                                placeholder="e.g. Netflix, Spotify, GitHub"
                                value={subForm.name}
                                onChange={e => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="sub-price" className="text-xs font-semibold text-[var(--color-text-primary)]">Price</Label>
                                <Input
                                    id="sub-price"
                                    type="number"
                                    step="0.01"
                                    placeholder="14.99"
                                    value={subForm.price}
                                    onChange={e => setSubForm(prev => ({ ...prev, price: e.target.value }))}
                                    required
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="sub-cycle" className="text-xs font-semibold text-[var(--color-text-primary)]">Billing Cycle</Label>
                                <Select
                                    value={subForm.cycle}
                                    onValueChange={(val: any) => setSubForm(prev => ({ ...prev, cycle: val }))}
                                >
                                    <SelectTrigger id="sub-cycle" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sub-category" className="text-xs font-semibold text-[var(--color-text-primary)]">Category</Label>
                            <Select
                                value={subForm.category}
                                onValueChange={val => setSubForm(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger id="sub-category" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                    {SUBSCRIPTION_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)]">
                            <div>
                                <Label htmlFor="sub-trial" className="text-xs font-semibold cursor-pointer text-[var(--color-text-primary)]">Free Trial Tracking</Label>
                                <p className="text-[11px] text-[var(--color-text-muted)]">Set a deadline alert before conversion</p>
                            </div>
                            <Switch
                                id="sub-trial"
                                checked={subForm.is_trial}
                                onCheckedChange={checked => setSubForm(prev => ({ ...prev, is_trial: checked }))}
                            />
                        </div>

                        {subForm.is_trial && (
                            <div className="space-y-1.5">
                                <Label htmlFor="sub-trial-days" className="text-xs font-semibold text-[var(--color-text-primary)]">Trial Duration (Days)</Label>
                                <Input
                                    id="sub-trial-days"
                                    type="number"
                                    value={subForm.trial_days}
                                    onChange={e => setSubForm(prev => ({ ...prev, trial_days: e.target.value }))}
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddModalType(null)}
                                className="rounded-xl text-xs border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs"
                            >
                                {submitting ? 'Saving...' : 'Add Subscription'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Bill Modal */}
            <Dialog open={addModalType === 'bill'} onOpenChange={(open) => !open && setAddModalType(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[var(--color-text-primary)]">Add Bill or Obligation</DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Track rent, utilities, insurance, or loans with due date reminders.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddBill} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="bill-name" className="text-xs font-semibold text-[var(--color-text-primary)]">Obligation Name</Label>
                            <Input
                                id="bill-name"
                                placeholder="e.g. Electricity, Apartment Rent, Car Loan"
                                value={billForm.name}
                                onChange={e => setBillForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="bill-amount" className="text-xs font-semibold text-[var(--color-text-primary)]">Amount</Label>
                                <Input
                                    id="bill-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="150.00"
                                    value={billForm.amount}
                                    onChange={e => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                                    required
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="bill-freq" className="text-xs font-semibold text-[var(--color-text-primary)]">Frequency</Label>
                                <Select
                                    value={billForm.frequency}
                                    onValueChange={(val: any) => setBillForm(prev => ({ ...prev, frequency: val }))}
                                >
                                    <SelectTrigger id="bill-freq" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                        <SelectItem value="one-time">One-Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="bill-due" className="text-xs font-semibold text-[var(--color-text-primary)]">Due Date</Label>
                                <Input
                                    id="bill-due"
                                    type="date"
                                    value={billForm.dueDate}
                                    onChange={e => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                    required
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="bill-category" className="text-xs font-semibold text-[var(--color-text-primary)]">Category</Label>
                                <Select
                                    value={billForm.category}
                                    onValueChange={val => setBillForm(prev => ({ ...prev, category: val }))}
                                >
                                    <SelectTrigger id="bill-category" className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
                                        {BILL_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="bill-notes" className="text-xs font-semibold text-[var(--color-text-primary)]">Notes (Optional)</Label>
                            <Input
                                id="bill-notes"
                                placeholder="Account number, auto-pay details..."
                                value={billForm.notes}
                                onChange={e => setBillForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddModalType(null)}
                                className="rounded-xl text-xs border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs"
                            >
                                {submitting ? 'Saving...' : 'Add Bill'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SubscriptionsPage;
