import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { formatCurrency } from '../../services/currencyService';
import { SupabaseTransaction } from '../../services/supabaseTransactionService';
import { ShoppingBag, Coffee, Car, Film, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import styles from './ActivityTimeline.module.css';

interface ActivityTimelineProps {
    transactions: SupabaseTransaction[];
}

const getIconForCategory = (category: string) => {
    switch (category.toLowerCase()) {
        case 'shopping': return <ShoppingBag size={16} />;
        case 'food':
        case 'food & dining': return <Coffee size={16} />;
        case 'transport': return <Car size={16} />;
        case 'entertainment': return <Film size={16} />;
        default: return <CreditCard size={16} />;
    }
};

const ActivityTimeline = ({ transactions }: ActivityTimelineProps) => {
    // Sort transactions by date (newest first) and take top 5
    const recentActivity = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    if (recentActivity.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>No recent activity to show.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Recent Activity 🕒</h3>
            <div className={styles.timeline}>
                {recentActivity.map((item, index) => (
                    <motion.div
                        key={item.id}
                        className={styles.timelineItem}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className={styles.line}></div>
                        <div className={styles.iconWrapper} style={{
                            background: item.type === 'income' ? '#D1FAE5' : '#FEE2E2',
                            color: item.type === 'income' ? '#059669' : '#DC2626'
                        }}>
                            {item.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className={styles.content}>
                            <div className={styles.header}>
                                <span className={styles.categoryName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {getIconForCategory(item.category)} {item.description || item.category}
                                </span>
                                <span className={styles.amount} style={{
                                    color: item.type === 'income' ? '#059669' : '#DC2626'
                                }}>
                                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                </span>
                            </div>
                            <span className={styles.date}>{format(new Date(item.date), 'MMM d, h:mm a')}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActivityTimeline;
