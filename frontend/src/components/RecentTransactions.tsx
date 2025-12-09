// Recent Transactions Component
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Transaction } from '../types';
import { useModalStore } from '../store/useStore';
import styles from './RecentTransactions.module.css';

interface RecentTransactionsProps {
    transactions: Transaction[];
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
    const { openEditTransaction } = useModalStore();

    if (!transactions || transactions.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No transactions yet</p>
                <span>Add your first transaction to get started</span>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className={styles.list}>
            {transactions.map((transaction) => (
                <div
                    key={transaction.id}
                    className={styles.item}
                    onClick={() => openEditTransaction(transaction.id)}
                >
                    <div className={styles.left}>
                        <div
                            className={styles.categoryIcon}
                            style={{ background: transaction.category?.color || '#6b7280' }}
                        >
                            {transaction.category?.icon || '📦'}
                        </div>
                        <div className={styles.info}>
                            <div className={styles.storeName}>
                                {transaction.storeName}
                                {transaction.storeUrl && (
                                    <a
                                        href={transaction.storeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.storeLink}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                            <div className={styles.details}>
                                {transaction.productName && (
                                    <span className={styles.productName}>{transaction.productName}</span>
                                )}
                                <span className={styles.date}>
                                    {format(new Date(transaction.purchaseDate), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.amount}>
                            -{formatCurrency(Number(transaction.amount))}
                        </div>
                        <div className={styles.category}>
                            {transaction.category?.name || 'Uncategorized'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentTransactions;
