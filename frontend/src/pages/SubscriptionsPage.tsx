// SubscriptionsPage - Stark Gen Z Brutalist Mission Manager
import { useState, useEffect } from 'react';
import {
    Repeat, Plus, Calendar, DollarSign, Bell,
    Trash2, Edit2, Clock, Zap, CreditCard, RefreshCw, X,
    CheckCircle2, Timer, Crown, Sparkles, Check, AlertCircle, TrendingUp, ArrowUpRight
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
import { SubscriptionsSkeleton } from '../components/LoadingSkeleton';
import { featureExpansionApi } from '../services/featureExpansionApi';

const CATEGORIES = [
    'Entertainment', 'Music', 'Software', 'Gaming', 'Fitness',
    'News', 'Education', 'Cloud Storage', 'Productivity', 'Other'
];

const COLORS = [
    { name: 'Pure Black', value: '#000000' },
    { name: 'Hyper Red', value: '#E11D48' },
    { name: 'Slate Gray', value: '#64748b' },
    { name: 'Deep Indigo', value: '#4338ca' },
    { name: 'Dark Green', value: '#14532d' },
    { name: 'Iron', value: '#1e293b' },
];

const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [commandCenter, setCommandCenter] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'Entertainment',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
        color: '#000000',
        is_trial: false,
        trial_days: '7',
        start_date: new Date().toISOString().split('T')[0],
    });

    const fetchSubscriptions = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await subscriptionService.checkAndUpdateExpired(user.id);
            const [data, center] = await Promise.all([
                subscriptionService.getAll(user.id),
                featureExpansionApi.subscriptionCommandCenter().catch(() => null)
            ]);
            setSubscriptions(data);
            setCommandCenter(center);
        } catch (error) {
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [user?.id]);

    useEffect(() => {
        const handleSubscriptionChange = () => fetchSubscriptions();
        window.addEventListener('subscription-changed', handleSubscriptionChange);
        return () => window.removeEventListener('subscription-changed', handleSubscriptionChange);
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
            toast.success('Mission Deployed!');
            setShowAddModal(false);
            fetchSubscriptions();
        } catch (error) {
            toast.error('Deployment failed');
        }
    };

    const handleCancel = async (id: string, name: string) => {
        if (!confirm(`Terminate Mission: ${name}?`)) return;
        try {
            await subscriptionService.cancel(id);
            toast.success('Mission Terminated');
            fetchSubscriptions();
        } catch (error) {
            toast.error('Action failed');
        }
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
                <SubscriptionsSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            <div className={styles.contentArea}>
                {/* Header Section */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={styles.header}
                >
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Zap className="h-9 w-9" strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Subscriptions
                                <span className={styles.liveBadge}>Live Intel</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            className="font-black text-black uppercase tracking-widest text-[12px] hover:underline"
                            onClick={() => fetchSubscriptions()}
                        >
                            Sync Stream
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="h-14 px-8 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_#E11D48] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#E11D48]"
                        >
                            Deploy Mission
                        </button>
                    </div>
                </motion.header>

                {commandCenter && (
                    <section className="bg-white border-4 border-black p-8 mb-12 shadow-[8px_8px_0px_#000000]">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic text-black">Subscription Command Center</h2>
                                <p className="text-black/60 font-bold">Intel on trials, price changes, and unused streams.</p>
                            </div>
                            <div className="lg:text-right">
                                <div className="text-4xl font-black text-black">{formatCurrency(commandCenter.totals?.yearlyCost || monthlyTotal * 12)}</div>
                                <div className="text-xs font-black uppercase text-red-600 tracking-widest">Yearly exposure</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="p-6 border-4 border-black bg-white shadow-[4px_4px_0px_#000000]">
                                <div className="text-3xl font-black">{commandCenter.trialsEndingSoon?.length || 0}</div>
                                <div className="text-xs font-black uppercase text-black/50">Trials ending soon</div>
                            </div>
                            <div className="p-6 border-4 border-black bg-red-600 text-white shadow-[4px_4px_0px_#000000]">
                                <div className="text-3xl font-black">{commandCenter.priceIncreases?.length || 0}</div>
                                <div className="text-xs font-black uppercase text-white/80">Price increases</div>
                            </div>
                            <div className="p-6 border-4 border-black bg-black text-white shadow-[4px_4px_0px_#E11D48]">
                                <div className="text-3xl font-black">{commandCenter.unusedAlerts?.length || 0}</div>
                                <div className="text-xs font-black uppercase text-white/80">Unused alerts</div>
                            </div>
                        </div>
                        {commandCenter.cancellationHints?.[0] && (
                            <div className="mt-8 p-4 border-2 border-black bg-slate-50 font-bold italic">
                                <span className="text-red-600 mr-2">/ ADVICE:</span>
                                {commandCenter.cancellationHints[0].hint}
                            </div>
                        )}
                    </section>
                )}

                {/* Main Stats */}
                <div className={styles.statsRow}>
                    <motion.div variants={fadeInUp} className={styles.premiumStatCard}>
                        <div className={styles.statIconBox} style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
                            <CreditCard className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <p className={styles.statLabel}>Monthly Burn</p>
                        <h3 className={styles.statValue}>{formatCurrency(monthlyTotal)}</h3>
                        <div className={styles.statProgress}>
                            <div className={styles.progressFill} style={{ width: '70%', backgroundColor: '#E11D48' }} />
                        </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.premiumStatCard}>
                        <div className={styles.statIconBox} style={{ backgroundColor: '#E11D48', color: '#FFFFFF' }}>
                            <Zap className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <p className={styles.statLabel}>Active Missions</p>
                        <h3 className={styles.statValue}>{activeSubscriptions.length}</h3>
                        <div className={styles.statProgress}>
                            <div className={styles.progressFill} style={{ width: '40%', backgroundColor: '#000000' }} />
                        </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.premiumStatCard}>
                        <div className={styles.statIconBox} style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
                            <ArrowUpRight className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <p className={styles.statLabel}>Yearly Projection</p>
                        <h3 className={styles.statValue}>{formatCurrency(monthlyTotal * 12)}</h3>
                        <div className={styles.statProgress}>
                            <div className={styles.progressFill} style={{ width: '55%', backgroundColor: '#E11D48' }} />
                        </div>
                    </motion.div>

                    <motion.div variants={fadeInUp} className={styles.premiumStatCard}>
                        <div className={styles.statIconBox} style={{ backgroundColor: '#E11D48', color: '#FFFFFF' }}>
                            <TrendingUp className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <p className={styles.statLabel}>Trial Flow</p>
                        <h3 className={styles.statValue}>{trials.length}</h3>
                        <div className={styles.statProgress}>
                            <div className={styles.progressFill} style={{ width: '85%', backgroundColor: '#000000' }} />
                        </div>
                    </motion.div>
                </div>

                {/* Trial Section */}
                {trials.length > 0 && (
                    <div className="mb-12">
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <Timer className="text-red-600" strokeWidth={3} />
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
                        <CreditCard className="text-black" strokeWidth={3} />
                        Active Pipeline
                    </h2>
                </div>

                <div className="mb-12">
                    {activeSubscriptions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h3 className={styles.emptyTitle}>Empty Pipeline</h3>
                            <p className={styles.emptyText}>Zero active recurring streams detected.</p>
                            <button
                                className="h-16 px-10 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[8px_8px_0px_#E11D48]"
                                onClick={() => setShowAddModal(true)}
                            >
                                Track First Mission
                            </button>
                        </div>
                    ) : (
                        <div className={styles.subsGrid}>
                            {activeSubscriptions.map(sub => (
                                <SubscriptionCard key={sub.id} sub={sub} onCancel={handleCancel} />
                            ))}
                        </div>
                    )}
                </div>
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
                    <div className={styles.subLogoBox}>
                        {sub.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={styles.subName}>{sub.name}</h3>
                        <p className={styles.subCat}>{sub.category}</p>
                    </div>
                </div>
                <div className={styles.cardActions}>
                    <button className={styles.miniBtn} onClick={() => onCancel(sub.id, sub.name)}>
                        <X className="h-5 w-5" strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className={styles.subAmount}>
                <span className={styles.amountVal}>{formatCurrency(sub.price)}</span>
                <span className={styles.cycle}>/{sub.cycle.slice(0, 2)}</span>
            </div>

            <div className={styles.paymentInfo}>
                <div className={styles.nextBill}>
                    Next Due: <span className={styles.daysLeft}>{sub.next_payment_date ? new Date(sub.next_payment_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 bg-black text-white px-3 py-1 text-[10px] font-black uppercase">
                    ACTIVE
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
                    <div className={styles.subLogoBox}>
                        {sub.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className={styles.subName}>{sub.name}</h3>
                        <p className={styles.subCat}>Trial Period</p>
                    </div>
                </div>
                <button className={styles.miniBtn} onClick={() => onCancel(sub.id, sub.name)}>
                    <X className="h-5 w-5" strokeWidth={3} />
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
                    <span className={styles.daysLeft}>{info.daysRemaining} Days</span> Remaining
                </div>
                <button
                    className="bg-red-600 text-white px-4 py-2 border-2 border-white font-black uppercase text-[10px]"
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
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-4 border-black rounded-none shadow-[12px_12px_0px_#000000]">
                <div className="bg-black p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-red-600 text-white border-2 border-white">
                                    <Plus size={24} strokeWidth={3} />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter italic">Deploy Mission</DialogTitle>
                                    <DialogDescription className="font-bold text-red-600 uppercase text-xs tracking-widest">Initialize new recurring stream</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-8 space-y-8 bg-white">
                    <div className="flex items-center justify-between p-5 border-4 border-black bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2 border-2 border-black", formData.is_trial ? "bg-red-600 text-white" : "bg-white text-black")}>
                                <Timer size={20} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase">Trial Mission</p>
                                <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Toggle for limited engagement</p>
                            </div>
                        </div>
                        <Switch checked={formData.is_trial} onCheckedChange={(v) => setFormData({ ...formData, is_trial: v })} />
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-black/40">Target Name</Label>
                            <Input
                                placeholder="NETFLIX / AWS / SPOTIFY"
                                className="h-14 rounded-none border-4 border-black bg-white text-lg font-black uppercase"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {!formData.is_trial ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-black/40">Resource Cost</Label>
                                    <Input
                                        type="number"
                                        className="h-14 rounded-none border-4 border-black bg-white font-black"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-black/40">Interval</Label>
                                    <Select value={formData.cycle} onValueChange={(v) => setFormData({ ...formData, cycle: v })}>
                                        <SelectTrigger className="h-14 rounded-none border-4 border-black bg-white font-black uppercase">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-4 border-black">
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-black/40">Engagement Duration (Days)</Label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-none border-4 border-black bg-white font-black"
                                    value={formData.trial_days}
                                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            className="flex-1 h-16 border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors" 
                            onClick={onClose}
                        >
                            Abort
                        </button>
                        <button 
                            className="flex-[2] h-16 bg-black text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_#E11D48] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" 
                            onClick={onSubmit}
                        >
                            Initiate Stream
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SubscriptionsPage;
