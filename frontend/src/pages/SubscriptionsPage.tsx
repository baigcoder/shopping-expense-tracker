// SubscriptionsPage - Cashly Premium Subscriptions Manager
// Midnight Coral Theme - Light Mode
import { useState, useEffect } from 'react';
import {
    Repeat, Plus, Calendar, DollarSign, Bell,
    Trash2, Edit2, Clock, Zap, CreditCard, RefreshCw, X,
    CheckCircle2, Timer, Crown, Sparkles, Check, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useStore';
import { subscriptionService, Subscription, TrialInfo } from '../services/subscriptionService';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import styles from './SubscriptionsPage.module.css';

const CATEGORIES = [
    'Entertainment', 'Music', 'Software', 'Gaming', 'Fitness',
    'News', 'Education', 'Cloud Storage', 'Productivity', 'Other'
];

const COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Emerald', value: '#10B981' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
];

const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'Entertainment',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
        color: '#3B82F6',
        is_trial: false,
        trial_days: '7',
        start_date: new Date().toISOString().split('T')[0],
    });

    const fetchSubscriptions = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await subscriptionService.checkAndUpdateExpired(user.id);
            const data = await subscriptionService.getAll(user.id);
            setSubscriptions(data);
        } catch (error) {
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [user?.id]);

    // Listen for subscription changes to update immediately
    useEffect(() => {
        const handleSubscriptionChange = () => {
            console.log('🔄 Subscription changed - refreshing');
            fetchSubscriptions();
        };

        window.addEventListener('subscription-changed', handleSubscriptionChange);

        return () => {
            window.removeEventListener('subscription-changed', handleSubscriptionChange);
        };
    }, [user?.id]);


    const activeSubscriptions = subscriptions.filter(s => s.status !== 'cancelled' && !s.is_trial);
    const trials = subscriptions.filter(s => s.is_trial && s.status !== 'cancelled');

    const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
        if (sub.cycle === 'monthly') return sum + sub.price;
        if (sub.cycle === 'yearly') return sum + (sub.price / 12);
        if (sub.cycle === 'weekly') return sum + (sub.price * 4);
        return sum;
    }, 0);

    const handleAdd = async () => {
        if (!user?.id || !formData.name) return;
        try {
            if (formData.is_trial) {
                await subscriptionService.startTrial(user.id, formData.name, parseInt(formData.trial_days) || 7, {
                    category: formData.category,
                    color: formData.color,
                });
            } else {
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
                    next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
                });
            }
            toast.success('Subscription saved!');
            setShowAddModal(false);
            fetchSubscriptions();
        } catch (error) {
            toast.error('Creation failed');
        }
    };

    const handleCancel = async (id: string, name: string) => {
        if (!confirm(`Archive ${name}?`)) return;
        try {
            await subscriptionService.cancel(id);
            toast.success('Archived');
            fetchSubscriptions();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const getDaysUntil = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className={styles.mainContent}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={styles.titleIcon}
                    >
                        <Repeat size={32} />
                    </motion.div>
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Syncing Subscriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            <div className={styles.contentArea}>
                {/* Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Repeat size={28} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Subscriptions
                                <div className={styles.liveBadge}>LIVE TRACKER</div>
                            </h1>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                                Managing {activeSubscriptions.length} active pipelines
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className={styles.miniBtn}
                            onClick={fetchSubscriptions}
                            style={{ width: 'auto', padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 800 }}
                        >
                            <RefreshCw size={16} className="mr-2" />
                            REFRESH
                        </button>
                        <button
                            className="h-14 px-8 rounded-2xl bg-[#3B82F6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={18} />
                            Add Service
                        </button>
                    </div>
                </motion.header>

                {/* Main Stats */}
                <motion.div
                    className={styles.statsRow}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <DollarSign size={24} />
                        </div>
                        <p className={styles.statLabel}>Monthly burn</p>
                        <h3 className={styles.statValue}>{formatCurrency(monthlyTotal)}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#3b82f6' }}
                                initial={{ width: 0 }}
                                animate={{ width: '70%' }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                            <Calendar size={24} />
                        </div>
                        <p className={styles.statLabel}>Yearly projection</p>
                        <h3 className={styles.statValue}>{formatCurrency(monthlyTotal * 12)}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#8b5cf6' }}
                                initial={{ width: 0 }}
                                animate={{ width: '85%' }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#ecfdf5', color: '#10b981' }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <p className={styles.statLabel}>Active services</p>
                        <h3 className={styles.statValue}>{activeSubscriptions.length}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#10b981' }}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#fffbeb', color: '#f59e0b' }}>
                            <Timer size={24} />
                        </div>
                        <p className={styles.statLabel}>Active trials</p>
                        <h3 className={styles.statValue}>{trials.length}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#f59e0b' }}
                                initial={{ width: 0 }}
                                animate={{ width: trials.length > 0 ? '40%' : '0%' }}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Trial Section */}
                {trials.length > 0 && (
                    <div className="mb-12">
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <Timer className="text-amber-500" />
                                Trial Inflow
                            </h2>
                        </div>
                        <div className={styles.subsGrid}>
                            {trials.map(sub => (
                                <TrialCard key={sub.id} sub={sub} onCancel={handleCancel} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Pipeline Section */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <CreditCard className="text-blue-500" />
                        Active Pipeline
                    </h2>
                </div>

                <motion.div
                    className={styles.pipelineSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {activeSubscriptions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Repeat size={32} />
                            </div>
                            <h3 className={styles.emptyTitle}>Empty Pipeline</h3>
                            <p className={styles.emptyText}>
                                No active recurring payments detected in your matrix yet.
                            </p>
                            <Button
                                className="h-12 px-8 rounded-xl bg-blue-600 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                                onClick={() => setShowAddModal(true)}
                            >
                                Track Current Bill
                            </Button>
                        </div>
                    ) : (
                        <motion.div
                            className={styles.subsGrid}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {activeSubscriptions.map(sub => (
                                <SubscriptionCard key={sub.id} sub={sub} onCancel={handleCancel} />
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Add Modal */}
            <AddModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAdd}
                formData={formData}
                setFormData={setFormData}
            />
        </div>
    );
};

const SubscriptionCard = ({ sub, onCancel }: { sub: Subscription, onCancel: any }) => {
    const daysUntil = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    return (
        <motion.div
            className={styles.subCard}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -10 }}
        >
            <div className={styles.subCardTop}>
                <div className={styles.subBrand}>
                    <div className={styles.subLogoBox} style={{ background: sub.color }}>
                        {sub.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={styles.subName}>{sub.name}</h3>
                        <p className={styles.subCat}>{sub.category}</p>
                    </div>
                </div>
                <div className={styles.cardActions}>
                    <button className={styles.miniBtn} onClick={() => onCancel(sub.id, sub.name)}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className={styles.subAmount}>
                <span className={styles.amountVal}>{formatCurrency(sub.price)}</span>
                <span className={styles.cycle}>/{sub.cycle.slice(0, 2)}</span>
            </div>

            <div className={styles.paymentInfo}>
                <div className={styles.nextBill}>
                    <Clock size={14} className={daysUntil(sub.next_payment_date) <= 3 ? "text-amber-500" : "text-slate-400"} />
                    Next in <span className={styles.daysLeft}>{daysUntil(sub.next_payment_date)} Days</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    <Sparkles size={10} />
                    Active
                </div>
            </div>
        </motion.div>
    );
};

const TrialCard = ({ sub, onCancel }: { sub: Subscription, onCancel: any }) => {
    const info = subscriptionService.getTrialInfo(sub);

    return (
        <motion.div className={cn(styles.subCard, styles.trialCard)} whileHover={{ y: -10 }}>
            <div className={styles.subCardTop}>
                <div className={styles.subBrand}>
                    <div className={styles.subLogoBox} style={{ background: sub.color }}>
                        {sub.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={styles.subName}>{sub.name}</h3>
                        <p className={styles.subCat}>Trial Period</p>
                    </div>
                </div>
                <button className={styles.miniBtn} onClick={() => onCancel(sub.id, sub.name)}>
                    <X size={18} />
                </button>
            </div>

            <div className={styles.trialProgress}>
                <motion.div
                    className={styles.trialFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${info.percentComplete}%` }}
                />
            </div>

            <div className={styles.paymentInfo}>
                <div className={styles.nextBill}>
                    <Timer size={14} className="text-amber-500" />
                    <span className={styles.daysLeft}>{info.daysRemaining} Days</span> Remaining
                </div>
                <button
                    className="bg-amber-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-200"
                >
                    Upgrade
                </button>
            </div>
        </motion.div>
    );
};

const AddModal = ({ isOpen, onClose, onSubmit, formData, setFormData }: any) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
                <div className="bg-slate-50 p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Add Service</DialogTitle>
                                    <DialogDescription className="font-bold text-slate-400">Initialize a new recurring matrix</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-10 space-y-8 bg-white">
                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-xl", formData.is_trial ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400")}>
                                <Timer size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-700">Trial Mode</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle for free trials</p>
                            </div>
                        </div>
                        <Switch checked={formData.is_trial} onCheckedChange={(v) => setFormData({ ...formData, is_trial: v })} />
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Service Name</Label>
                            <Input
                                placeholder="Netflix, Disney, Cloud..."
                                className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-lg font-bold"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {!formData.is_trial ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Daily/Monthly Cost</Label>
                                    <Input
                                        type="number"
                                        className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white font-bold"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Cycle</Label>
                                    <Select value={formData.cycle} onValueChange={(v) => setFormData({ ...formData, cycle: v })}>
                                        <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Trial Days</Label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white font-bold"
                                    value={formData.trial_days}
                                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.1em] ml-1">Visual Identity</Label>
                            <div className="flex gap-4">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        className={cn(
                                            "w-10 h-10 rounded-xl transition-all",
                                            formData.color === c.value ? "ring-4 ring-slate-100 scale-110" : "opacity-40 hover:opacity-100"
                                        )}
                                        style={{ background: c.value }}
                                        onClick={() => setFormData({ ...formData, color: c.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase" onClick={onClose}>
                            Abort
                        </Button>
                        <Button className="flex-[2] h-14 rounded-2xl bg-blue-600 font-black text-xs uppercase shadow-xl shadow-blue-100" onClick={onSubmit}>
                            Initiate Pipeline
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SubscriptionsPage;
