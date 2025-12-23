// SubscriptionsPage - Cashly Dynamic Subscriptions Manager
// Fully dynamic with real data, trial tracking, and reminders
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
    Repeat, Plus, Calendar, DollarSign, Bell, AlertTriangle,
    Trash2, Edit2, Clock, Zap, CreditCard, RefreshCw, X,
    CheckCircle2, XCircle, Timer, Crown, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useStore';
import { subscriptionService, Subscription, TrialInfo } from '../services/subscriptionService';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Category options
const CATEGORIES = [
    'Entertainment', 'Music', 'Software', 'Gaming', 'Fitness',
    'News', 'Education', 'Cloud Storage', 'Productivity', 'Other'
];

// Color options for subscription cards
const COLORS = [
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Emerald', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Violet', value: '#7C3AED' },
    { name: 'Pink', value: '#EC4899' },
];

const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [expiringSoon, setExpiringSoon] = useState<Subscription[]>([]);
    const [trials, setTrials] = useState<Subscription[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'Entertainment',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
        color: '#10B981',
        is_trial: false,
        trial_days: '7',
        start_date: new Date().toISOString().split('T')[0],
        reminder_enabled: true
    });

    // Fetch subscriptions
    const fetchSubscriptions = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            // Check and update expired subscriptions first
            await subscriptionService.checkAndUpdateExpired(user.id);

            // Fetch all data
            const [allSubs, expiring, onTrial] = await Promise.all([
                subscriptionService.getAll(user.id),
                subscriptionService.getExpiringSoon(user.id, 7),
                subscriptionService.getTrials(user.id)
            ]);

            setSubscriptions(allSubs);
            setExpiringSoon(expiring);
            setTrials(onTrial);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [user?.id]);

    // Calculate totals
    const activeSubscriptions = subscriptions.filter(s => s.is_active && s.status !== 'cancelled');
    const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
        if (sub.is_trial) return sum; // Trials don't cost anything yet
        if (sub.cycle === 'monthly') return sum + sub.price;
        if (sub.cycle === 'yearly') return sum + (sub.price / 12);
        if (sub.cycle === 'weekly') return sum + (sub.price * 4);
        return sum;
    }, 0);
    const yearlyTotal = monthlyTotal * 12;

    // Handle add subscription
    const handleAddSubscription = async () => {
        if (!user?.id || !formData.name || (!formData.is_trial && !formData.price)) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            if (formData.is_trial) {
                // Start a trial
                await subscriptionService.startTrial(
                    user.id,
                    formData.name,
                    parseInt(formData.trial_days) || 7,
                    {
                        category: formData.category,
                        color: formData.color,
                        logo: '',
                    }
                );
                toast.success(`${formData.name} trial started! ${formData.trial_days} days remaining.`);
            } else {
                // Create paid subscription
                const nextPaymentDate = new Date();
                if (formData.cycle === 'monthly') nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
                else if (formData.cycle === 'yearly') nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
                else if (formData.cycle === 'weekly') nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);

                await subscriptionService.create({
                    user_id: user.id,
                    name: formData.name,
                    category: formData.category,
                    price: parseFloat(formData.price) || 0,
                    cycle: formData.cycle,
                    color: formData.color,
                    logo: '',
                    is_active: true,
                    status: 'active',
                    is_trial: false,
                    start_date: formData.start_date,
                    next_payment_date: nextPaymentDate.toISOString().split('T')[0],
                });
                toast.success(`${formData.name} subscription added!`);
            }

            // Dispatch event for insights
            window.dispatchEvent(new CustomEvent('subscription-changed'));

            setShowAddModal(false);
            resetForm();
            fetchSubscriptions();
        } catch (error) {
            console.error('Error adding subscription:', error);
            toast.error('Failed to add subscription');
        }
    };

    // Handle update subscription
    const handleUpdateSubscription = async () => {
        if (!editingSub) return;

        try {
            await subscriptionService.update(editingSub.id, {
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price) || 0,
                cycle: formData.cycle,
                color: formData.color,
            });

            // Dispatch event for insights
            window.dispatchEvent(new CustomEvent('subscription-changed'));

            toast.success('Subscription updated!');
            setShowEditModal(false);
            setEditingSub(null);
            fetchSubscriptions();
        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Failed to update subscription');
        }
    };

    // Handle cancel subscription
    const handleCancelSubscription = async (id: string, name: string) => {
        if (!confirm(`Cancel ${name}? This will stop tracking this subscription.`)) return;

        try {
            await subscriptionService.cancel(id);

            // Dispatch event for insights
            window.dispatchEvent(new CustomEvent('subscription-changed'));

            toast.success(`${name} cancelled`);
            fetchSubscriptions();
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error('Failed to cancel subscription');
        }
    };

    // Handle convert trial to paid
    const handleConvertToPaid = async (sub: Subscription) => {
        const price = prompt(`Enter the price for ${sub.name}:`, '9.99');
        if (!price) return;

        try {
            await subscriptionService.convertToPaid(sub.id, {
                price: parseFloat(price),
                cycle: 'monthly',
            });

            // Dispatch event for insights
            window.dispatchEvent(new CustomEvent('subscription-changed'));

            toast.success(`${sub.name} converted to paid subscription!`);
            fetchSubscriptions();
        } catch (error) {
            console.error('Error converting trial:', error);
            toast.error('Failed to convert trial');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Entertainment',
            price: '',
            cycle: 'monthly',
            color: '#10B981',
            is_trial: false,
            trial_days: '7',
            start_date: new Date().toISOString().split('T')[0],
            reminder_enabled: true
        });
    };

    // Open edit modal
    const openEditModal = (sub: Subscription) => {
        setEditingSub(sub);
        setFormData({
            name: sub.name,
            category: sub.category,
            price: sub.price.toString(),
            cycle: sub.cycle,
            color: sub.color,
            is_trial: sub.is_trial,
            trial_days: (sub.trial_days || 7).toString(),
            start_date: sub.start_date || new Date().toISOString().split('T')[0],
            reminder_enabled: true
        });
        setShowEditModal(true);
    };

    // Get trial info
    const getTrialProgress = (sub: Subscription): TrialInfo => {
        return subscriptionService.getTrialInfo(sub);
    };

    // Get days until next payment
    const getDaysUntilPayment = (sub: Subscription): number => {
        if (!sub.next_payment_date) return 0;
        const today = new Date();
        const nextPayment = new Date(sub.next_payment_date);
        const diff = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    // Get status badge
    const getStatusBadge = (sub: Subscription) => {
        if (sub.status === 'cancelled') {
            return <Badge variant="destructive">Cancelled</Badge>;
        }
        if (sub.is_trial) {
            const info = getTrialProgress(sub);
            if (info.daysRemaining <= 0) {
                return <Badge variant="destructive">Trial Expired</Badge>;
            }
            return (
                <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                    <Timer className="mr-1 h-3 w-3" />
                    {info.daysRemaining} days left
                </Badge>
            );
        }
        if (!sub.is_active) {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100">Active</Badge>;

    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Repeat className="h-12 w-12 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground">Loading subscriptions...</p>

                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <motion.div
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-[#3B82F6]/10 text-[#3B82F6] ring-1 ring-[#3B82F6]/20">
                            <Repeat className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                            Subscriptions
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">
                        Track recurring payments, trials, and get renewal reminders
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchSubscriptions}
                        className="h-12 px-6 rounded-2xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="h-12 px-8 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Subscription
                    </Button>
                </div>
            </motion.div>

            {/* Alerts - Expiring Soon */}
            <AnimatePresence>
                {expiringSoon.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardContent className="flex items-center gap-4 py-4">
                                <div className="p-3 rounded-xl bg-amber-50">
                                    <Bell className="h-6 w-6 text-amber-600" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-700">
                                        {expiringSoon.length} subscription{expiringSoon.length > 1 ? 's' : ''} expiring soon
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        {expiringSoon.map(s => s.name).join(', ')} - renewing within 7 days
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {[
                    { label: 'Monthly Cost', value: monthlyTotal, icon: DollarSign, color: '#3B82F6', label2: 'recurring' },
                    { label: 'Yearly Cost', value: yearlyTotal, icon: Calendar, color: '#8B5CF6', label2: 'projected' },
                    { label: 'Active', value: activeSubscriptions.length, icon: CheckCircle2, color: '#10B981', label2: 'subscriptions', isNumber: true },
                    { label: 'Trials', value: trials.length, icon: Timer, color: '#F59E0B', label2: 'active trials', isNumber: true }
                ].map((stat, i) => (
                    <div key={i} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="p-3 rounded-2xl transition-colors"
                                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                            >
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label2}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                {stat.isNumber ? stat.value : formatCurrency(stat.value as number)}
                            </h3>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: stat.color }}
                                initial={{ width: 0 }}
                                animate={{ width: '70%' }}
                                transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                            />
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Trials Section */}
            {trials.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Timer className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Trials</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trials.map((sub) => {
                            const trialInfo = getTrialProgress(sub);
                            return (
                                <motion.div
                                    key={sub.id}
                                    whileHover={{ y: -5 }}
                                    className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-200/20 transition-all duration-300 overflow-hidden group"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
                                        <motion.div
                                            className="h-full bg-amber-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${trialInfo.percentComplete}%` }}
                                        />
                                    </div>

                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                                                    style={{ backgroundColor: sub.color, boxShadow: `0 8px 16px -4px ${sub.color}40` }}
                                                >
                                                    {sub.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{sub.name}</h3>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.category}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-amber-50 rounded-xl">
                                                <Timer className="h-4 w-4 text-amber-600" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                                                    <p className={cn(
                                                        "text-xl font-black",
                                                        trialInfo.daysRemaining <= 3 ? "text-red-500" : "text-amber-600"
                                                    )}>
                                                        {trialInfo.daysRemaining} Days
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-bold px-3 py-1 rounded-lg">Trial</Badge>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <motion.div
                                                    className="h-full bg-amber-400"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${trialInfo.percentComplete}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-500/20"
                                                onClick={() => handleConvertToPaid(sub)}
                                            >
                                                <Crown className="mr-2 h-4 w-4" />
                                                Subscribe
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-11 h-11 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                                                onClick={() => handleCancelSubscription(sub.id, sub.name)}
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Subscriptions List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-3 ml-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CreditCard className="h-4 w-4" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Subscriptions</h2>
                </div>

                {subscriptions.filter(s => !s.is_trial).length === 0 ? (
                    <motion.div
                        className="bg-white rounded-[3rem] p-16 border border-slate-100 shadow-sm flex flex-col items-center text-center"
                        whileHover={{ y: -5 }}
                    >
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-8 relative">
                            <Repeat className="h-10 w-10 text-slate-300" />
                            <motion.div
                                className="absolute -top-2 -right-2 w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-white"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Plus className="h-4 w-4" />
                            </motion.div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No Subscriptions Yet</h3>
                        <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
                            Keep track of all your recurring payments in one place. Never get surprised by a renewal again!
                        </p>
                        <Button
                            className="h-14 px-10 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold shadow-xl shadow-blue-500/25 transition-all hover:scale-105"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Track Your First Payment
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {subscriptions.filter(s => !s.is_trial).map((sub) => {
                            const daysUntil = getDaysUntilPayment(sub);
                            const isCancelled = sub.status === 'cancelled';

                            return (
                                <motion.div
                                    key={sub.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                    className={cn(
                                        "relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden group",
                                        isCancelled && "opacity-75 grayscale-[0.5]"
                                    )}
                                >
                                    {/* Accent line */}
                                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: sub.color }} />

                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                                                    style={{ backgroundColor: sub.color, boxShadow: `0 8px 16px -4px ${sub.color}40` }}
                                                >
                                                    {sub.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{sub.name}</h3>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge className={cn(
                                                    "font-bold px-3 py-1 rounded-lg border",
                                                    isCancelled
                                                        ? "bg-red-50 text-red-700 border-red-100"
                                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                                )}>
                                                    {isCancelled ? 'Cancelled' : sub.cycle}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-6 mb-8">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(sub.price)}</span>
                                                        <span className="text-sm font-bold text-slate-400">/{sub.cycle.slice(0, 2)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Next Bill</p>
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <Calendar className={cn("h-4 w-4", daysUntil <= 3 ? "text-amber-500" : "text-slate-400")} />
                                                        <span className={cn(
                                                            "text-sm font-black",
                                                            daysUntil <= 3 ? "text-amber-600" : "text-slate-700"
                                                        )}>
                                                            {daysUntil} Days
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Started {sub.start_date || 'N/A'}
                                                </div>
                                                {sub.notification_enabled && (
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        <Bell className="h-3 w-3" />
                                                        ALERTS ON
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-11 rounded-xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                                                onClick={() => openEditModal(sub)}
                                            >
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Manage
                                            </Button>
                                            {!isCancelled && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-11 h-11 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all"
                                                    onClick={() => handleCancelSubscription(sub.id, sub.name)}
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </motion.div>

            {/* Add Subscription Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                    <div className="relative overflow-hidden pt-8 pb-6 px-6 bg-slate-50">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 tr-y-1/2 -tr-x-1/2 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -z-10" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                        Add Subscription
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold">
                                        Track a new subscription or start a trial
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 bg-white">
                        {/* Trial Toggle Card */}
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                            formData.is_trial
                                ? "bg-amber-50 border-amber-200 shadow-sm"
                                : "bg-slate-50 border-slate-100 shadow-none"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    formData.is_trial ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-500"
                                )}>
                                    <Timer className="h-5 w-5" />
                                </div>
                                <div>
                                    <Label className="text-sm font-black text-slate-700">This is a trial</Label>
                                    <p className="text-[10px] text-slate-400 font-bold">Enable to track trial duration</p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.is_trial}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_trial: checked })}
                                className="data-[state=checked]:bg-amber-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Service Name *</Label>
                                <div className="relative group">
                                    <Input
                                        placeholder="Netflix, Spotify, etc."
                                        className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all group-hover:border-slate-300"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-blue-500">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat} className="rounded-lg font-bold">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.is_trial ? (
                                /* Trial Days */
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Trial Duration (days)</Label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="365"
                                            className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all"
                                            value={formData.trial_days}
                                            onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                        />
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Price */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Price *</Label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="9.99"
                                                    className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">Rs</div>
                                            </div>
                                        </div>

                                        {/* Cycle */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Billing Cycle</Label>
                                            <Select
                                                value={formData.cycle}
                                                onValueChange={(value: 'monthly' | 'yearly' | 'weekly') =>
                                                    setFormData({ ...formData, cycle: value })
                                                }
                                            >
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-blue-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                    <SelectItem value="weekly" className="font-bold">Weekly</SelectItem>
                                                    <SelectItem value="monthly" className="font-bold">Monthly</SelectItem>
                                                    <SelectItem value="yearly" className="font-bold">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Start Date</Label>
                                        <div className="relative group">
                                            <Input
                                                type="date"
                                                className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Color Picker */}
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Subscription Theme</Label>
                                <div className="flex flex-wrap gap-2 px-1">
                                    {COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            className={cn(
                                                "w-9 h-9 rounded-xl border-2 transition-all duration-300 relative group",
                                                formData.color === color.value
                                                    ? "border-blue-500 ring-4 ring-blue-50 scale-110 shadow-lg"
                                                    : "border-slate-100 hover:border-slate-200 hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                        >
                                            {formData.color === color.value && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubscription}
                                className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {formData.is_trial ? 'Start Trial' : 'Add Subscription'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Subscription Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                    <div className="relative overflow-hidden pt-8 pb-6 px-6 bg-slate-50">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -z-10" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                                    <Edit2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                                        Edit Subscription
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold">
                                        Update your subscription details
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 bg-white">
                        <div className="grid grid-cols-1 gap-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Service Name</Label>
                                <div className="relative group">
                                    <Input
                                        className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all group-hover:border-slate-300"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-blue-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat} className="rounded-lg font-bold">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Price */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Price</Label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-12 rounded-xl border-slate-200 pl-11 bg-slate-50/50 focus:bg-white transition-all"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">Rs</div>
                                    </div>
                                </div>

                                {/* Cycle */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Billing Cycle</Label>
                                    <Select
                                        value={formData.cycle}
                                        onValueChange={(value: 'monthly' | 'yearly' | 'weekly') =>
                                            setFormData({ ...formData, cycle: value })
                                        }
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-blue-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="weekly" className="font-bold">Weekly</SelectItem>
                                            <SelectItem value="monthly" className="font-bold">Monthly</SelectItem>
                                            <SelectItem value="yearly" className="font-bold">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">Subscription Theme</Label>
                                <div className="flex flex-wrap gap-2 px-1">
                                    {COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            className={cn(
                                                "w-9 h-9 rounded-xl border-2 transition-all duration-300 relative group",
                                                formData.color === color.value
                                                    ? "border-blue-500 ring-4 ring-blue-50 scale-110 shadow-lg"
                                                    : "border-slate-100 hover:border-slate-200 hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                        >
                                            {formData.color === color.value && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateSubscription}
                                className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default SubscriptionsPage;
