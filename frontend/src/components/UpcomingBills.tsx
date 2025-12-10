// Upcoming Bills Component - Shows recurring payments due soon
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, DollarSign, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { recurringTransactionService, RecurringTransaction } from '../services/recurringService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { formatCurrency } from '../services/currencyService';
import { useAuthStore } from '../store/useStore';
import styles from './UpcomingBills.module.css';

interface UpcomingItem {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    daysUntil: number;
    type: 'recurring' | 'subscription';
    isUrgent: boolean;
    icon: string;
}

const UpcomingBills = () => {
    const { user } = useAuthStore();
    const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDue, setTotalDue] = useState(0);

    useEffect(() => {
        const fetchUpcoming = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const items: UpcomingItem[] = [];
                const today = new Date();

                // Try to fetch recurring transactions (may fail if table doesn't exist)
                try {
                    const recurring = await recurringTransactionService.getUpcoming(user.id, 14);

                    recurring.forEach(r => {
                        const dueDate = new Date(r.next_due_date);
                        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        items.push({
                            id: r.id,
                            name: r.name,
                            amount: r.amount,
                            dueDate: r.next_due_date,
                            daysUntil: Math.max(0, daysUntil),
                            type: 'recurring',
                            isUrgent: daysUntil <= 2,
                            icon: getCategoryIcon(r.category)
                        });
                    });
                } catch (e) {
                    // Recurring transactions table may not exist yet - that's okay
                    console.log('Recurring transactions not available');
                }

                // Fetch active subscriptions (this should always work)
                try {
                    const subscriptions = await subscriptionService.getAll(user.id);
                    const activeSubscriptions = subscriptions.filter(s => s.is_active && !s.is_trial);

                    activeSubscriptions.forEach(s => {
                        if (s.renew_date) {
                            const renewDate = new Date(s.renew_date);
                            // If renew date is in the past, calculate next occurrence
                            while (renewDate < today) {
                                if (s.cycle === 'monthly') renewDate.setMonth(renewDate.getMonth() + 1);
                                else if (s.cycle === 'yearly') renewDate.setFullYear(renewDate.getFullYear() + 1);
                                else if (s.cycle === 'weekly') renewDate.setDate(renewDate.getDate() + 7);
                                else break;
                            }

                            const daysUntil = Math.ceil((renewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            if (daysUntil <= 14) {
                                items.push({
                                    id: s.id,
                                    name: s.name,
                                    amount: s.price,
                                    dueDate: renewDate.toISOString().split('T')[0],
                                    daysUntil: Math.max(0, daysUntil),
                                    type: 'subscription',
                                    isUrgent: daysUntil <= 2,
                                    icon: s.logo || '📦'
                                });
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error fetching subscriptions:', e);
                }

                // Sort by days until due
                items.sort((a, b) => a.daysUntil - b.daysUntil);

                // Calculate total
                const total = items.reduce((sum, item) => sum + item.amount, 0);

                setUpcomingItems(items.slice(0, 5)); // Show top 5
                setTotalDue(total);
            } catch (error) {
                console.error('Error fetching upcoming bills:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcoming();
    }, [user?.id]);

    if (loading) {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <Calendar size={20} />
                    <h3>Upcoming Bills</h3>
                </div>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (upcomingItems.length === 0) {
        return (
            <div className={styles.card}>
                <div className={styles.header}>
                    <Calendar size={20} />
                    <h3>Upcoming Bills</h3>
                </div>
                <div className={styles.empty}>
                    <span>🎉</span>
                    <p>No bills due soon!</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Calendar size={20} />
                    <h3>Upcoming Bills</h3>
                </div>
                <div className={styles.totalBadge}>
                    {formatCurrency(totalDue)} due
                </div>
            </div>

            <div className={styles.billsList}>
                <AnimatePresence>
                    {upcomingItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            className={`${styles.billItem} ${item.isUrgent ? styles.urgent : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={styles.billIcon}>{item.icon}</div>
                            <div className={styles.billInfo}>
                                <span className={styles.billName}>{item.name}</span>
                                <span className={styles.billDue}>
                                    {item.daysUntil === 0
                                        ? 'Due today!'
                                        : item.daysUntil === 1
                                            ? 'Due tomorrow'
                                            : `In ${item.daysUntil} days`}
                                </span>
                            </div>
                            <div className={styles.billAmount}>
                                {formatCurrency(item.amount)}
                            </div>
                            {item.isUrgent && (
                                <div className={styles.urgentBadge}>
                                    <AlertTriangle size={14} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Helper to get category icon
function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        'Rent': '🏠',
        'Utilities': '💡',
        'Insurance': '🛡️',
        'Internet': '📶',
        'Phone': '📱',
        'Gym': '💪',
        'Streaming': '📺',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

export default UpcomingBills;
