import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Calendar, DollarSign, Clock, Bell, Check, X,
    RefreshCw, Trash2, Edit2, AlertCircle, Zap, CreditCard,
    Home, Wifi, Phone, Car, Heart, ShoppingBag, Utensils, Tv
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/useStore';
import recurringService, { RecurringTransaction } from '../services/recurringService';
import styles from './RecurringPage.module.css';

const CATEGORY_ICONS: Record<string, any> = {
    'Bills': Zap,
    'Rent': Home,
    'Internet': Wifi,
    'Phone': Phone,
    'Insurance': Heart,
    'Car': Car,
    'Shopping': ShoppingBag,
    'Food': Utensils,
    'Entertainment': Tv,
    'Other': CreditCard
};

const FREQUENCY_LABELS: Record<string, string> = {
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'yearly': 'Yearly'
};

const RecurringPage = () => {
    const { user } = useAuthStore();
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: 'Bills',
        frequency: 'monthly',
        next_due_date: new Date().toISOString().split('T')[0],
        auto_add: false,
        reminder_days: 3,
        notes: ''
    });

    // Fetch recurring transactions
    const fetchRecurring = async () => {
        if (!user?.id) return;
        setLoading(true);
        const data = await recurringService.getAll(user.id);
        setRecurring(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRecurring();
    }, [user?.id]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchRecurring();
        setIsRefreshing(false);
        toast.success('Refreshed!');
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        const data = {
            user_id: user.id,
            name: formData.name,
            amount: parseFloat(formData.amount),
            category: formData.category,
            frequency: formData.frequency as any,
            next_due_date: formData.next_due_date,
            is_active: true,
            auto_add: formData.auto_add,
            reminder_days: formData.reminder_days,
            notes: formData.notes || undefined
        };

        if (editingItem) {
            const success = await recurringService.update(editingItem.id, data);
            if (success) {
                toast.success('Updated successfully!');
            }
        } else {
            const created = await recurringService.create(data);
            if (created) {
                toast.success('Recurring payment added!');
            }
        }

        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchRecurring();
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this recurring payment?')) return;
        const success = await recurringService.delete(id);
        if (success) {
            toast.success('Deleted!');
            fetchRecurring();
        }
    };

    // Handle mark as paid
    const handleMarkPaid = async (id: string) => {
        const success = await recurringService.markAsPaid(id);
        if (success) {
            toast.success('Marked as paid! Next due date updated.');
            fetchRecurring();
        }
    };

    // Open edit modal
    const openEdit = (item: RecurringTransaction) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            amount: item.amount.toString(),
            category: item.category,
            frequency: item.frequency,
            next_due_date: item.next_due_date,
            auto_add: item.auto_add,
            reminder_days: item.reminder_days,
            notes: item.notes || ''
        });
        setShowModal(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            amount: '',
            category: 'Bills',
            frequency: 'monthly',
            next_due_date: new Date().toISOString().split('T')[0],
            auto_add: false,
            reminder_days: 3,
            notes: ''
        });
    };

    // Calculate days until due
    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateStr);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get status color
    const getStatusColor = (daysUntil: number) => {
        if (daysUntil < 0) return '#EF4444'; // Overdue
        if (daysUntil <= 3) return '#F59E0B'; // Due soon
        if (daysUntil <= 7) return '#3B82F6'; // Upcoming
        return '#10B981'; // Safe
    };

    // Calculate totals
    const monthlyTotal = recurring
        .filter(r => r.is_active)
        .reduce((sum, r) => {
            if (r.frequency === 'monthly') return sum + r.amount;
            if (r.frequency === 'weekly') return sum + (r.amount * 4.33);
            if (r.frequency === 'yearly') return sum + (r.amount / 12);
            if (r.frequency === 'daily') return sum + (r.amount * 30);
            return sum;
        }, 0);

    const upcomingCount = recurring.filter(r => r.is_active && getDaysUntil(r.next_due_date) <= 7).length;
    const overdueCount = recurring.filter(r => r.is_active && getDaysUntil(r.next_due_date) < 0).length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Recurring Payments</h1>
                    <p>Track your bills & subscriptions</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.refreshBtn}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={20} className={isRefreshing ? styles.spinning : ''} />
                    </button>
                    <button
                        className={styles.addBtn}
                        onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
                    >
                        <Plus size={20} />
                        Add Payment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <motion.div className={styles.statCard} whileHover={{ y: -5 }}>
                    <DollarSign size={24} />
                    <div>
                        <span className={styles.statValue}>${monthlyTotal.toFixed(0)}</span>
                        <span className={styles.statLabel}>Monthly Total</span>
                    </div>
                </motion.div>
                <motion.div className={styles.statCard} whileHover={{ y: -5 }}>
                    <Calendar size={24} />
                    <div>
                        <span className={styles.statValue}>{recurring.filter(r => r.is_active).length}</span>
                        <span className={styles.statLabel}>Active Bills</span>
                    </div>
                </motion.div>
                <motion.div className={`${styles.statCard} ${upcomingCount > 0 ? styles.warning : ''}`} whileHover={{ y: -5 }}>
                    <Clock size={24} />
                    <div>
                        <span className={styles.statValue}>{upcomingCount}</span>
                        <span className={styles.statLabel}>Due This Week</span>
                    </div>
                </motion.div>
                {overdueCount > 0 && (
                    <motion.div className={`${styles.statCard} ${styles.danger}`} whileHover={{ y: -5 }}>
                        <AlertCircle size={24} />
                        <div>
                            <span className={styles.statValue}>{overdueCount}</span>
                            <span className={styles.statLabel}>Overdue</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Recurring List */}
            <div className={styles.listContainer}>
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : recurring.length === 0 ? (
                    <div className={styles.empty}>
                        <Calendar size={48} />
                        <h3>No Recurring Payments</h3>
                        <p>Add your regular bills like rent, utilities, subscriptions</p>
                        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                            <Plus size={20} /> Add First Payment
                        </button>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {recurring.map((item) => {
                            const daysUntil = getDaysUntil(item.next_due_date);
                            const Icon = CATEGORY_ICONS[item.category] || CreditCard;

                            return (
                                <motion.div
                                    key={item.id}
                                    className={`${styles.item} ${!item.is_active ? styles.inactive : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -3 }}
                                >
                                    <div className={styles.itemIcon} style={{ background: getStatusColor(daysUntil) + '20' }}>
                                        <Icon size={24} style={{ color: getStatusColor(daysUntil) }} />
                                    </div>

                                    <div className={styles.itemInfo}>
                                        <h4>{item.name}</h4>
                                        <p>{FREQUENCY_LABELS[item.frequency]} • {item.category}</p>
                                    </div>

                                    <div className={styles.itemDue}>
                                        <span
                                            className={styles.dueDate}
                                            style={{ color: getStatusColor(daysUntil) }}
                                        >
                                            {daysUntil < 0
                                                ? `${Math.abs(daysUntil)} days overdue`
                                                : daysUntil === 0
                                                    ? 'Due Today!'
                                                    : `${daysUntil} days left`
                                            }
                                        </span>
                                        <span className={styles.nextDate}>
                                            {new Date(item.next_due_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className={styles.itemAmount}>
                                        ${item.amount.toFixed(2)}
                                    </div>

                                    <div className={styles.itemActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleMarkPaid(item.id)}
                                            title="Mark as Paid"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => openEdit(item)}
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
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
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>{editingItem ? 'Edit Payment' : 'Add Recurring Payment'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Netflix, Rent, Electric Bill"
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Amount ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Frequency</label>
                                        <select
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {Object.keys(CATEGORY_ICONS).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Next Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.next_due_date}
                                            onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Remind me (days before)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={formData.reminder_days}
                                        onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_add}
                                            onChange={(e) => setFormData({ ...formData, auto_add: e.target.checked })}
                                        />
                                        <span>Auto-add to transactions when due</span>
                                    </label>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Notes (optional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Any additional notes..."
                                        rows={2}
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={styles.submitBtn}>
                                        {editingItem ? 'Update' : 'Add Payment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RecurringPage;
