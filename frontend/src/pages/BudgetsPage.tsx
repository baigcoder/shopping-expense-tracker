
// Budgets Page - Track spending limits per category with real-time sync
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, AlertTriangle, CheckCircle, BellRing, Info, RefreshCw, TrendingDown } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { budgetService, Budget } from '../services/budgetService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuth } from '../hooks/useAuth';
import { notificationSound } from '../services/notificationSoundService';
import genZToast from '../services/genZToast';
import styles from './BudgetsPage.module.css';

// Predefined categories for consistency
const BUDGET_CATEGORIES = [
    'Shopping',
    'Food & Dining',
    'Transport',
    'Entertainment',
    'Bills & Utilities',
    'Health',
    'Education',
    'Travel',
    'Other'
];

const BudgetsPage = () => {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBudget, setNewBudget] = useState({ category: 'Shopping', limit: '' });
    const [hasPlayedSound, setHasPlayedSound] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calculate spending from transactions (case-insensitive matching)
    const calculateSpending = useCallback((txList: SupabaseTransaction[], budgetList: Budget[]) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentTx = txList.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        });

        // Aggregate spending by category (case-insensitive)
        const spending: Record<string, number> = {};

        currentTx.forEach(t => {
            const txCategory = (t.category || 'Other').toLowerCase();

            // Find matching budget category (case-insensitive)
            const matchingBudget = budgetList.find(b =>
                b.category.toLowerCase() === txCategory ||
                b.category.toLowerCase().includes(txCategory) ||
                txCategory.includes(b.category.toLowerCase())
            );

            if (matchingBudget) {
                spending[matchingBudget.category] = (spending[matchingBudget.category] || 0) + t.amount;
            } else {
                // Use original category if no budget match
                const cat = t.category || 'Other';
                spending[cat] = (spending[cat] || 0) + t.amount;
            }
        });

        return { spending, currentTx };
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user) return;

        setIsRefreshing(true);
        try {
            const [fetchedBudgets, fetchedTransactions] = await Promise.all([
                budgetService.getAll(user.id),
                supabaseTransactionService.getAll(user.id)
            ]);

            setBudgets(fetchedBudgets);
            setTransactions(fetchedTransactions);

            const { spending } = calculateSpending(fetchedTransactions, fetchedBudgets);
            setSpendingMap(spending);
            setLastRefresh(new Date());

        } catch (error) {
            console.error("Failed to load budget data", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, calculateSpending]);

    // Initial fetch + polling for real-time updates
    useEffect(() => {
        fetchData();

        // Poll every 15 seconds for new transactions
        const pollInterval = setInterval(() => {
            fetchData();
        }, 15000);

        return () => clearInterval(pollInterval);
    }, [fetchData]);

    // Check for alerts and play sound
    useEffect(() => {
        if (isLoading || hasPlayedSound || budgets.length === 0) return;

        const hasOverBudget = budgets.some(b => {
            const spent = spendingMap[b.category] || 0;
            return spent > b.amount;
        });

        if (hasOverBudget) {
            // Play alert sound
            notificationSound.playAlert();

            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification("Budget Alert! ⚠️", { body: "You have exceeded one or more budget limits." });
                }
            } catch (e) {
                console.error("Notification error", e);
            }
            setHasPlayedSound(true);
        }
    }, [budgets, spendingMap, isLoading, hasPlayedSound]);

    const handleAddBudget = async () => {
        if (newBudget.category && newBudget.limit && user) {
            try {
                const limitAmount = parseFloat(newBudget.limit);
                const created = await budgetService.create({
                    user_id: user.id,
                    category: newBudget.category,
                    amount: limitAmount,
                    period: 'monthly'
                });

                if (created) {
                    const updatedBudgets = [...budgets, created];
                    setBudgets(updatedBudgets);

                    // Recalculate spending with new budget
                    const { spending } = calculateSpending(transactions, updatedBudgets);
                    setSpendingMap(spending);

                    setNewBudget({ category: 'Shopping', limit: '' });
                    setShowModal(false);
                    genZToast.success(`Budget set for ${newBudget.category}! 💸`);
                }
            } catch (error) {
                console.error("Error creating budget", error);
                genZToast.error("Couldn't save that budget. Try again? 🤷‍♀️");
            }
        }
    };

    const handleDeleteBudget = async (id: string) => {
        const success = await budgetService.delete(id);
        if (success) {
            setBudgets(budgets.filter(b => b.id !== id));
            genZToast.success("Budget deleted! Free as a bird 🕊️");
        }
    };

    // Get transactions for a specific budget category
    const getTransactionsForBudget = (category: string) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return transactions.filter(t => {
            const d = new Date(t.date);
            const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            const txCategory = (t.category || '').toLowerCase();
            const budgetCategory = category.toLowerCase();

            return isCurrentMonth &&
                t.type === 'expense' &&
                (txCategory === budgetCategory ||
                    txCategory.includes(budgetCategory) ||
                    budgetCategory.includes(txCategory));
        }).slice(0, 3); // Show last 3
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (spendingMap[b.category] || 0), 0);
    const remaining = totalBudget - totalSpent;

    const getProgress = (spent: number, limit: number) => Math.min((spent / limit) * 100, 100);

    const getStatus = (spent: number, limit: number) => {
        const percent = (spent / limit) * 100;
        if (percent >= 100) return 'danger';
        if (percent >= 80) return 'warning';
        return 'safe';
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerLeft}>
                    <h1>BUDGET <span>VAULT</span> 🔐</h1>
                    <div className={styles.statusRow}>
                        <div className={styles.subtitle}>
                            Monthly Limits Active
                        </div>
                        {/* Live sync indicator */}
                        <div className={styles.syncStatus}>
                            <span className={`${styles.syncDot} ${isRefreshing ? styles.syncing : ''}`}></span>
                            <span>{isRefreshing ? 'TX_SYNCING...' : 'SYSTEM_LIVE'}</span>
                            <button
                                onClick={fetchData}
                                className={styles.refreshBtn}
                                disabled={isRefreshing}
                            >
                                <RefreshCw size={12} className={isRefreshing ? styles.spinning : ''} />
                            </button>
                        </div>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                    <Plus size={24} strokeWidth={4} /> ADD LIMIT
                </button>
            </motion.div>

            {/* Summary Card */}
            <motion.div
                className={styles.summaryCard}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
            >
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{formatCurrency(totalBudget)}</span>
                    <span className={styles.summaryLabel}>Total Limit</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{formatCurrency(totalSpent)}</span>
                    <span className={styles.summaryLabel}>Used</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue} style={{ color: remaining < 0 ? '#EF4444' : 'inherit' }}>
                        {formatCurrency(Math.abs(remaining))}
                    </span>
                    <span className={styles.summaryLabel}>{remaining < 0 ? 'Over' : 'Left'}</span>
                </div>
            </motion.div>

            {/* Empty State */}
            {!isLoading && budgets.length === 0 && (
                <div className={styles.emptyState}>
                    <Wallet size={48} style={{ marginBottom: '1rem', color: '#CBD5E1' }} />
                    <h3>No budgets set yet</h3>
                    <p>Create a budget to track your spending habits.</p>
                </div>
            )}

            {/* Budget Cards */}
            <div className={styles.budgetGrid}>
                <AnimatePresence>
                    {budgets.map((budget, index) => {
                        const spent = spendingMap[budget.category] || 0;
                        const progress = getProgress(spent, budget.amount);
                        const status = getStatus(spent, budget.amount);
                        const recentTx = getTransactionsForBudget(budget.category);

                        return (
                            <motion.div
                                key={budget.id}
                                className={styles.budgetCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                style={{
                                    borderColor: status === 'danger' ? '#EF4444' : '#000',
                                    backgroundColor: status === 'danger' ? '#FEF2F2' : '#fff'
                                }}
                            >
                                <div className={styles.budgetHeader}>
                                    <div className={styles.categoryInfo}>
                                        <div className={styles.categoryIcon}>
                                            {status === 'danger' ? <BellRing size={24} color="#EF4444" /> : <Wallet size={24} />}
                                        </div>
                                        <div>
                                            <span className={styles.categoryName}>{budget.category}</span>
                                            {status === 'danger' && (
                                                <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>OVER LIMIT</div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBudget(budget.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className={styles.budgetAmount}>
                                    <span className={styles.spent} style={{ color: status === 'danger' ? '#EF4444' : '#000' }}>
                                        {formatCurrency(spent)}
                                    </span>
                                    <span className={styles.limit}>of {formatCurrency(budget.amount)}</span>
                                </div>

                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={`${styles.progressFill} ${styles[status]}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.1 }}
                                        />
                                    </div>
                                    <div className={styles.progressText}>
                                        <span>{progress.toFixed(0)}%</span>
                                        <span>{spent > budget.amount ? `${formatCurrency(spent - budget.amount)} over` : `${formatCurrency(budget.amount - spent)} left`}</span>
                                    </div>
                                </div>

                                {/* Recent transactions for this budget */}
                                {recentTx.length > 0 && (
                                    <div className={styles.recentTxSection}>
                                        <div className={styles.recentTxHeader}>
                                            <TrendingDown size={12} />
                                            <span>Recent Activity</span>
                                        </div>
                                        {recentTx.map(tx => (
                                            <div key={tx.id} className={styles.recentTxItem}>
                                                <span className={styles.txDesc}>{tx.description?.slice(0, 25) || 'Transaction'}...</span>
                                                <span className={styles.txAmount}>-{formatCurrency(tx.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Add Budget Modal */}
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
                            <h2>Set Budget Limit 🎯</h2>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Category</label>
                                <select
                                    className={styles.input}
                                    value={newBudget.category}
                                    onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                                >
                                    {BUDGET_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <p className={styles.inputHint}>
                                    💡 Categories match with your transactions automatically
                                </p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Monthly Limit ({getCurrencySymbol()})</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="5000"
                                    value={newBudget.limit}
                                    onChange={e => setNewBudget({ ...newBudget, limit: e.target.value })}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleAddBudget}>
                                    Save Budget
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BudgetsPage;
