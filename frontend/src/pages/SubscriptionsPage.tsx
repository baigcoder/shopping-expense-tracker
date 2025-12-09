// Subscriptions Page - Enhanced with Trial Tracking & Notifications
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, CreditCard, AlertCircle, Plus, X, Loader2,
    Clock, Bell, AlertTriangle, CheckCircle, Timer, Zap,
    TrendingUp, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { subscriptionService, Subscription, TrialInfo } from '../services/subscriptionService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import styles from './SubscriptionsPage.module.css';

const SUB_CATEGORIES = ['Entertainment', 'Music', 'Productivity', 'Storage', 'Creative', 'Gaming', 'News', 'Fitness', 'Software', 'Other'];
const SUB_ICONS = ['📺', '🎵', '🤖', '☁️', '▶️', '🎨', '📰', '🎮', '💪', '💻', '📦'];
const TRIAL_DAYS_OPTIONS = [7, 14, 30, 60, 90];

const SubscriptionsPage = () => {
    const { user } = useAuthStore();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'trials' | 'active'>('all');

    const [newSub, setNewSub] = useState({
        name: '',
        logo: '📦',
        category: 'Other',
        price: '',
        cycle: 'monthly' as 'monthly' | 'yearly' | 'weekly',
        renew_date: '',
        color: '#6366F1',
        is_trial: false,
        trial_days: 14
    });

    // Load subscriptions from Supabase
    useEffect(() => {
        loadSubscriptions();
    }, [user?.id]);

    const loadSubscriptions = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            // Check and update expired trials first
            await subscriptionService.checkAndUpdateExpired(user.id);

            const data = await subscriptionService.getAll(user.id);
            setSubscriptions(data);

            // Show notifications for trials expiring soon
            checkTrialNotifications(data);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check for trial notifications
    const checkTrialNotifications = (subs: Subscription[]) => {
        const trials = subs.filter(s => s.is_trial && s.is_active);

        trials.forEach(sub => {
            const trialInfo = subscriptionService.getTrialInfo(sub);

            if (trialInfo.daysRemaining === 0) {
                toast.error(`⚠️ ${sub.name} trial ends TODAY!`, { autoClose: false });
            } else if (trialInfo.daysRemaining === 1) {
                toast.warning(`⏰ ${sub.name} trial ends TOMORROW!`);
            } else if (trialInfo.daysRemaining <= 3) {
                toast.info(`📢 ${sub.name} trial ends in ${trialInfo.daysRemaining} days`);
            }
        });
    };

    // Filter subscriptions based on active tab
    const filteredSubs = subscriptions.filter(sub => {
        if (activeTab === 'trials') return sub.is_trial && sub.is_active;
        if (activeTab === 'active') return !sub.is_trial && sub.is_active;
        return sub.is_active;
    });

    // Calculate totals
    const totalMonthly = subscriptions
        .filter(s => s.is_active && !s.is_trial)
        .reduce((sum, sub) => {
            if (sub.cycle === 'yearly') return sum + sub.price / 12;
            if (sub.cycle === 'weekly') return sum + sub.price * 4;
            return sum + sub.price;
        }, 0);

    const totalYearly = totalMonthly * 12;
    const trialsCount = subscriptions.filter(s => s.is_trial && s.is_active).length;
    const activeCount = subscriptions.filter(s => !s.is_trial && s.is_active).length;

    const handleAddSub = async () => {
        if (!newSub.name || !user?.id) {
            toast.error('Please enter a subscription name!');
            return;
        }

        if (!newSub.is_trial && !newSub.price) {
            toast.error('Please enter a price for paid subscription!');
            return;
        }

        setSaving(true);
        try {
            let created: Subscription | null = null;

            if (newSub.is_trial) {
                // Create trial subscription
                created = await subscriptionService.startTrial(
                    user.id,
                    newSub.name,
                    newSub.trial_days,
                    {
                        logo: newSub.logo,
                        category: newSub.category,
                        price: parseFloat(newSub.price) || 0,
                        cycle: newSub.cycle,
                        color: newSub.color
                    }
                );
            } else {
                // Create paid subscription
                created = await subscriptionService.create({
                    user_id: user.id,
                    name: newSub.name,
                    logo: newSub.logo,
                    category: newSub.category,
                    price: parseFloat(newSub.price),
                    cycle: newSub.cycle,
                    renew_date: newSub.renew_date,
                    color: newSub.color,
                    is_active: true,
                    is_trial: false,
                    status: 'active'
                });
            }

            if (created) {
                setSubscriptions([created, ...subscriptions]);
                resetForm();
                setShowModal(false);
                toast.success(
                    newSub.is_trial
                        ? `🎉 ${newSub.name} trial started! ${newSub.trial_days} days free!`
                        : `${newSub.name} added! 🔔`
                );
            }
        } catch (error) {
            toast.error('Failed to add subscription');
        } finally {
            setSaving(false);
        }
    };

    const handleConvertToPaid = async (sub: Subscription) => {
        const price = prompt(`Enter ${sub.name} subscription price:`, sub.price?.toString() || '9.99');
        if (!price) return;

        try {
            const updated = await subscriptionService.convertToPaid(sub.id, {
                price: parseFloat(price),
                cycle: sub.cycle
            });

            if (updated) {
                setSubscriptions(subs =>
                    subs.map(s => s.id === sub.id ? updated : s)
                );
                toast.success(`✅ ${sub.name} converted to paid subscription!`);
            }
        } catch (error) {
            toast.error('Failed to convert subscription');
        }
    };

    const handleCancel = async (id: string, name: string) => {
        if (!window.confirm(`Cancel ${name} subscription?`)) return;

        try {
            const success = await subscriptionService.cancel(id);
            if (success) {
                setSubscriptions(subs => subs.filter(s => s.id !== id));
                toast.success(`${name} subscription cancelled! 🗑️`);
            }
        } catch (error) {
            toast.error('Failed to cancel subscription');
        }
    };

    const resetForm = () => {
        setNewSub({
            name: '',
            logo: '📦',
            category: 'Other',
            price: '',
            cycle: 'monthly',
            renew_date: '',
            color: '#6366F1',
            is_trial: false,
            trial_days: 14
        });
    };

    // Get trial info for display
    const getTrialDisplay = (sub: Subscription): TrialInfo => {
        return subscriptionService.getTrialInfo(sub);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={40} className={styles.spinner} />
                    <p>Loading subscriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Subscriptions 🔄</h1>
                <div className={styles.headerActions}>
                    <button className={styles.refreshBtn} onClick={loadSubscriptions}>
                        <RefreshCw size={18} />
                    </button>
                    <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Add Sub
                    </button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <motion.div
                    className={styles.totalCard}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className={styles.totalInfo}>
                        <h2>Monthly Burn Rate</h2>
                        <span className={styles.totalAmount}>{formatCurrency(totalMonthly)}</span>
                    </div>
                    <div className={styles.totalMeta}>
                        <span className={styles.subCount}>{activeCount}</span>
                        <span className={styles.subLabel}>Paid Subs</span>
                        <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', display: 'block', opacity: 0.8 }}>
                            ~{formatCurrency(totalYearly)}/year
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    className={`${styles.totalCard} ${styles.trialCard}`}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.totalInfo}>
                        <h2>Active Trials</h2>
                        <span className={styles.totalAmount}>{trialsCount}</span>
                    </div>
                    <div className={styles.totalMeta}>
                        <Timer size={24} />
                        <span className={styles.subLabel}>Free Trials</span>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All ({subscriptions.filter(s => s.is_active).length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'trials' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('trials')}
                >
                    ⏰ Trials ({trialsCount})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    💳 Paid ({activeCount})
                </button>
            </div>

            {/* Subscriptions List */}
            <div className={styles.subList}>
                {filteredSubs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>
                            {activeTab === 'trials'
                                ? 'No active trials! 🎉'
                                : activeTab === 'active'
                                    ? 'No paid subscriptions yet'
                                    : 'No subscriptions! 🎉'}
                        </h3>
                        <p>
                            {activeTab === 'trials'
                                ? 'Start a free trial to track it here.'
                                : 'Add subscriptions to track your recurring expenses.'}
                        </p>
                        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Add Subscription
                        </button>
                    </div>
                ) : (
                    filteredSubs.map((sub, index) => {
                        const trialInfo = getTrialDisplay(sub);

                        return (
                            <motion.div
                                key={sub.id}
                                className={`${styles.subCard} ${sub.is_trial ? styles.trialSubCard : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className={styles.subLogo} style={{ background: sub.color + '20' }}>
                                    {sub.logo}
                                </div>

                                <div className={styles.subDetails}>
                                    <span className={styles.subName}>{sub.name}</span>
                                    <span className={styles.subCategory}>{sub.category}</span>
                                    <div className={styles.subMeta}>
                                        {sub.is_trial ? (
                                            <>
                                                <span className={styles.statusTrial}>
                                                    <Timer size={12} /> Trial
                                                </span>
                                                {trialInfo.daysRemaining > 0 ? (
                                                    <span className={`${styles.trialDays} ${trialInfo.daysRemaining <= 3 ? styles.urgent : ''}`}>
                                                        {trialInfo.daysRemaining} days left
                                                    </span>
                                                ) : (
                                                    <span className={styles.expired}>Expired</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <span className={styles.statusActive}>
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                                {sub.renew_date && (
                                                    <span className={styles.renewDate}>
                                                        <Calendar size={12} style={{ marginRight: '4px' }} />
                                                        Renews {sub.renew_date}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Trial Progress Bar */}
                                    {sub.is_trial && trialInfo.isOnTrial && (
                                        <div className={styles.trialProgress}>
                                            <div
                                                className={styles.trialProgressFill}
                                                style={{ width: `${trialInfo.percentComplete}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.subPricing}>
                                    {sub.is_trial ? (
                                        <span className={styles.freePrice}>FREE</span>
                                    ) : (
                                        <>
                                            <span className={styles.subPrice}>{formatCurrency(sub.price)}</span>
                                            <span className={styles.subCycle}>
                                                /{sub.cycle === 'monthly' ? 'mo' : sub.cycle === 'yearly' ? 'yr' : 'wk'}
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className={styles.subActions}>
                                    {sub.is_trial && trialInfo.isOnTrial && (
                                        <button
                                            className={styles.convertBtn}
                                            onClick={() => handleConvertToPaid(sub)}
                                            title="Convert to paid"
                                        >
                                            <Zap size={16} /> Upgrade
                                        </button>
                                    )}
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => handleCancel(sub.id, sub.name)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Subscription Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>

                            <h2>Add Subscription 📦</h2>

                            {/* Trial Toggle */}
                            <div className={styles.trialToggle}>
                                <button
                                    className={`${styles.toggleBtn} ${!newSub.is_trial ? styles.active : ''}`}
                                    onClick={() => setNewSub({ ...newSub, is_trial: false })}
                                >
                                    💳 Paid Subscription
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${newSub.is_trial ? styles.active : ''}`}
                                    onClick={() => setNewSub({ ...newSub, is_trial: true })}
                                >
                                    ⏰ Free Trial
                                </button>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Icon</label>
                                <div className={styles.iconPicker}>
                                    {SUB_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`${styles.iconOption} ${newSub.logo === icon ? styles.selected : ''}`}
                                            onClick={() => setNewSub({ ...newSub, logo: icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Netflix, Spotify"
                                    value={newSub.name}
                                    onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                                />
                            </div>

                            {newSub.is_trial ? (
                                <div className={styles.formGroup}>
                                    <label>Trial Duration</label>
                                    <div className={styles.trialDaysPicker}>
                                        {TRIAL_DAYS_OPTIONS.map(days => (
                                            <button
                                                key={days}
                                                type="button"
                                                className={`${styles.trialDayOption} ${newSub.trial_days === days ? styles.selected : ''}`}
                                                onClick={() => setNewSub({ ...newSub, trial_days: days })}
                                            >
                                                {days} days
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Price</label>
                                        <input
                                            type="number"
                                            placeholder="9.99"
                                            value={newSub.price}
                                            onChange={e => setNewSub({ ...newSub, price: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Cycle</label>
                                        <select
                                            value={newSub.cycle}
                                            onChange={e => setNewSub({ ...newSub, cycle: e.target.value as any })}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <select
                                        value={newSub.category}
                                        onChange={e => setNewSub({ ...newSub, category: e.target.value })}
                                    >
                                        {SUB_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Color</label>
                                    <input
                                        type="color"
                                        value={newSub.color}
                                        onChange={e => setNewSub({ ...newSub, color: e.target.value })}
                                        className={styles.colorInput}
                                    />
                                </div>
                            </div>

                            {/* Price after trial info */}
                            {newSub.is_trial && (
                                <div className={styles.formGroup}>
                                    <label>Price After Trial (optional)</label>
                                    <input
                                        type="number"
                                        placeholder="9.99"
                                        value={newSub.price}
                                        onChange={e => setNewSub({ ...newSub, price: e.target.value })}
                                    />
                                    <small className={styles.hint}>
                                        You can set this now or when you convert to paid
                                    </small>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button className={styles.cancelModalBtn} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleAddSub} disabled={saving}>
                                    {saving ? (
                                        <Loader2 size={18} className={styles.spinner} />
                                    ) : newSub.is_trial ? (
                                        '⏰ Start Trial'
                                    ) : (
                                        'Add Subscription'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubscriptionsPage;
