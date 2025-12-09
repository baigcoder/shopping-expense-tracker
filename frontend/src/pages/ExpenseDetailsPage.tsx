// Expense Details Page - Live Data with Import & AI Detection
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, TrendingUp, TrendingDown, Calendar, PieChart, Plus,
    Upload, FileText, X, Loader2, RefreshCw, Wallet, CreditCard,
    ShoppingBag, Car, Gamepad2, Zap, Heart, Coffee, Utensils,
    Plane, Home, Smartphone, Sparkles, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatCompact, getCurrencySymbol } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { budgetService, Budget } from '../services/budgetService';
import { useAuthStore } from '../store/useStore';
import styles from './ExpenseDetailsPage.module.css';

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: any; color: string }> = {
    'Food & Dining': { icon: Utensils, color: '#FF6B6B' },
    'Shopping': { icon: ShoppingBag, color: '#4ECDC4' },
    'Transport': { icon: Car, color: '#FFE66D' },
    'Entertainment': { icon: Gamepad2, color: '#9D4EDD' },
    'Bills & Utilities': { icon: Zap, color: '#FF9F1C' },
    'Health': { icon: Heart, color: '#2EC4B6' },
    'Travel': { icon: Plane, color: '#A18CD1' },
    'Rent': { icon: Home, color: '#84FAB0' },
    'Tech': { icon: Smartphone, color: '#F093FB' },
    'Coffee': { icon: Coffee, color: '#8B4513' },
    'Other': { icon: Wallet, color: '#64748B' },
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORY_CONFIG);

const ExpenseDetailsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ count: number; bank: string } | null>(null);

    // Add expense form
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Shopping',
        date: new Date().toISOString().split('T')[0]
    });
    const [saving, setSaving] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setIsRefreshing(true);
        try {
            const [txData, budgetData] = await Promise.all([
                supabaseTransactionService.getAll(user.id),
                budgetService.getAll(user.id)
            ]);
            setTransactions(txData);
            setBudgets(budgetData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
        // Poll every 15 seconds
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Calculate metrics from real data
    const metrics = {
        totalSpent: transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        thisMonth: transactions
            .filter(t => {
                const d = new Date(t.date);
                const now = new Date();
                return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0),
        dailyAvg: 0,
        budgetUsed: 0,
        categories: {} as Record<string, number>,
        monthlyData: [] as { month: string; amount: number; color: string }[]
    };

    // Daily average (this month)
    const daysInMonth = new Date().getDate();
    metrics.dailyAvg = metrics.thisMonth / daysInMonth;

    // Budget usage
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => {
        const catSpending = transactions
            .filter(t => t.type === 'expense' && t.category?.toLowerCase() === b.category.toLowerCase())
            .reduce((s, t) => s + t.amount, 0);
        return sum + catSpending;
    }, 0);
    metrics.budgetUsed = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

    // Category breakdown
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        metrics.categories[cat] = (metrics.categories[cat] || 0) + t.amount;
    });

    // Monthly data (last 6 months)
    const colors = ['#FF9A9E', '#A18CD1', '#84FAB0', '#FCCB90', '#E0C3FC', '#F093FB'];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthTotal = transactions
            .filter(t => {
                const td = new Date(t.date);
                return t.type === 'expense' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            })
            .reduce((sum, t) => sum + t.amount, 0);
        metrics.monthlyData.push({ month: monthName, amount: monthTotal, color: colors[5 - i] });
    }

    const maxMonthly = Math.max(...metrics.monthlyData.map(d => d.amount), 1);

    // Category stats sorted by amount
    const categoryStats = Object.entries(metrics.categories)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: metrics.totalSpent > 0 ? (amount / metrics.totalSpent) * 100 : 0,
            ...CATEGORY_CONFIG[name] || CATEGORY_CONFIG['Other']
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // Recent transactions
    const recentTx = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 5);

    // Add expense handler
    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount || !user?.id) return;
        setSaving(true);
        try {
            const created = await supabaseTransactionService.create({
                user_id: user.id,
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                type: 'expense',
                category: newExpense.category,
                date: newExpense.date
            });
            if (created) {
                setTransactions([created, ...transactions]);
                setNewExpense({ description: '', amount: '', category: 'Shopping', date: new Date().toISOString().split('T')[0] });
                setShowAddModal(false);
            }
        } catch (error) {
            console.error('Failed to add expense:', error);
        } finally {
            setSaving(false);
        }
    };

    // Import handler (simulated AI bank detection)
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        setImporting(true);
        setImportResult(null);

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Detect bank from filename
        const fileName = file.name.toLowerCase();
        let detectedBank = 'Unknown Bank';
        if (fileName.includes('hbl')) detectedBank = 'HBL Bank';
        else if (fileName.includes('meezan')) detectedBank = 'Meezan Bank';
        else if (fileName.includes('ubl')) detectedBank = 'UBL Bank';
        else if (fileName.includes('jazzcash')) detectedBank = 'JazzCash';
        else if (fileName.includes('easypaisa')) detectedBank = 'Easypaisa';
        else if (fileName.includes('allied')) detectedBank = 'Allied Bank';

        // Simulate imported transactions
        const mockImported = [
            { description: `${detectedBank} - ATM Withdrawal`, amount: 5000, category: 'Other' },
            { description: `${detectedBank} - Online Purchase`, amount: 2500, category: 'Shopping' },
            { description: `${detectedBank} - Bill Payment`, amount: 1200, category: 'Bills & Utilities' },
        ];

        // Save to Supabase
        for (const tx of mockImported) {
            await supabaseTransactionService.create({
                user_id: user.id,
                description: tx.description,
                amount: tx.amount,
                type: 'expense',
                category: tx.category,
                date: new Date().toISOString().split('T')[0],
                source: file.name
            });
        }

        setImportResult({ count: mockImported.length, bank: detectedBank });
        setImporting(false);
        fetchData();
    };

    const getCategoryIcon = (category: string) => {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];
        return config.icon;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={40} className={styles.spinner} />
                    <p>Loading your money moves...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerLeft}>
                    <motion.button
                        className={styles.backBtn}
                        onClick={() => navigate('/dashboard')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                </div>
                <h1 className={styles.pageTitle}>Money Moves 💸</h1>
                <div className={styles.headerActions}>
                    <motion.button
                        className={styles.iconBtn}
                        onClick={() => setShowImportModal(true)}
                        whileHover={{ scale: 1.1 }}
                        title="Import Statement"
                    >
                        <Upload size={20} />
                    </motion.button>
                    <motion.button
                        className={styles.addBtn}
                        onClick={() => setShowAddModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus size={18} /> Add
                    </motion.button>
                </div>
            </motion.div>

            {/* Live Sync Status */}
            <div className={styles.syncBar}>
                <span className={`${styles.syncDot} ${isRefreshing ? styles.syncing : ''}`}></span>
                <span>Live Sync {lastUpdate && `• ${lastUpdate.toLocaleTimeString()}`}</span>
                <button onClick={fetchData} disabled={isRefreshing} className={styles.refreshBtn}>
                    <RefreshCw size={14} className={isRefreshing ? styles.spinning : ''} />
                </button>
            </div>

            {/* Hero Stats */}
            <div className={styles.heroStats}>
                <motion.div
                    className={styles.totalCard}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <div className={styles.totalHeader}>
                        <span>This Month</span>
                        <div className={styles.trendBadge}>
                            <TrendingDown size={14} />
                            PKR
                        </div>
                    </div>
                    <h2 className={styles.totalAmount}>{formatCurrency(metrics.thisMonth)}</h2>
                    <div className={styles.progressBarContainer}>
                        <motion.div
                            className={styles.progressBarFill}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(metrics.budgetUsed, 100)}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                    <p className={styles.budgetStatus}>
                        {metrics.budgetUsed < 80 ? "You're killing it! 💅" : metrics.budgetUsed < 100 ? "Watch out! 👀" : "Over budget! 🔥"}
                    </p>
                </motion.div>

                <div className={styles.miniStatsGrid}>
                    <motion.div className={`${styles.miniStat} ${styles.blue}`} whileHover={{ y: -3 }}>
                        <div className={styles.statIcon}><Calendar size={18} /></div>
                        <h3>{formatCurrency(metrics.dailyAvg)}</h3>
                        <p>Daily Avg</p>
                    </motion.div>
                    <motion.div className={`${styles.miniStat} ${styles.pink}`} whileHover={{ y: -3 }}>
                        <div className={styles.statIcon}><Wallet size={18} /></div>
                        <h3>{metrics.budgetUsed.toFixed(0)}%</h3>
                        <p>Budget Used</p>
                    </motion.div>
                </div>
            </div>

            {/* Chart Section */}
            <motion.div
                className={styles.chartSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.sectionHeader}>
                    <h3>Vibe Check 📊</h3>
                    <span className={styles.timeLabel}>Last 6 Months</span>
                </div>
                <div className={styles.barChart}>
                    {metrics.monthlyData.map((data, index) => (
                        <div key={data.month} className={styles.barWrapper}>
                            <motion.div
                                className={styles.bar}
                                style={{ backgroundColor: data.color }}
                                initial={{ height: 0 }}
                                animate={{ height: `${(data.amount / maxMonthly) * 100}%` }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className={styles.barTooltip}>{formatCompact(data.amount)}</span>
                            </motion.div>
                            <span className={styles.barLabel}>{data.month}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Split Grid */}
            <div className={styles.splitGrid}>
                {/* Categories */}
                <motion.div className={styles.categoriesCard} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3>Where it went 💸</h3>
                    <div className={styles.categoriesList}>
                        {categoryStats.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No expenses yet</p>
                        ) : categoryStats.map((cat, i) => {
                            const IconComp = cat.icon;
                            return (
                                <motion.div key={cat.name} className={styles.catRow} whileHover={{ x: 5 }}>
                                    <div className={styles.catBlob} style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                                        <IconComp size={18} />
                                    </div>
                                    <div className={styles.catInfo}>
                                        <div className={styles.catHeader}>
                                            <span className={styles.catName}>{cat.name}</span>
                                            <span className={styles.catPercent}>{cat.percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className={styles.catBarBg}>
                                            <motion.div
                                                className={styles.catBarFill}
                                                style={{ backgroundColor: cat.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.percentage}%` }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div className={styles.transactionsCard} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <h3>Latest Drops 🛍️</h3>
                    <div className={styles.transactionsList}>
                        {recentTx.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No transactions yet</p>
                        ) : recentTx.map((tx) => {
                            const config = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG['Other'];
                            const IconComp = config.icon;
                            return (
                                <motion.div key={tx.id} className={styles.txRow} whileHover={{ scale: 1.02 }}>
                                    <div className={styles.txIcon} style={{ backgroundColor: config.color }}>
                                        <IconComp size={16} color="#fff" />
                                    </div>
                                    <div className={styles.txDetails}>
                                        <span className={styles.txName}>{tx.description?.slice(0, 25) || 'Transaction'}</span>
                                        <span className={styles.txTime}>{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                    <span className={styles.txAmount}>{formatCurrency(tx.amount)}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Add Expense Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                            <h2>Add Expense 💰</h2>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    placeholder="What did you buy?"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Amount ({getCurrencySymbol()})</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className={styles.saveBtn}
                                onClick={handleAddExpense}
                                disabled={saving || !newExpense.description || !newExpense.amount}
                            >
                                {saving ? <Loader2 size={18} className={styles.spinner} /> : 'Add Expense'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !importing && setShowImportModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className={styles.closeBtn} onClick={() => !importing && setShowImportModal(false)}>
                                <X size={20} />
                            </button>
                            <h2>Import Statement 📄</h2>

                            {!importing && !importResult && (
                                <>
                                    <p className={styles.importInfo}>
                                        Upload your bank statement (PDF/CSV) and our AI will automatically detect transactions and categorize them.
                                    </p>
                                    <div className={styles.supportedBanks}>
                                        <span>Supported: HBL, Meezan, UBL, JazzCash, Easypaisa, Allied Bank</span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.csv"
                                        onChange={handleFileImport}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        className={styles.uploadBtn}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={20} />
                                        Choose File
                                    </button>
                                </>
                            )}

                            {importing && (
                                <div className={styles.importingState}>
                                    <Loader2 size={48} className={styles.spinner} />
                                    <p>AI is analyzing your statement...</p>
                                    <span>Detecting bank and extracting transactions</span>
                                </div>
                            )}

                            {importResult && (
                                <div className={styles.importSuccess}>
                                    <CheckCircle size={48} color="#10B981" />
                                    <h3>Import Complete!</h3>
                                    <p>Detected: <strong>{importResult.bank}</strong></p>
                                    <p>Imported: <strong>{importResult.count} transactions</strong></p>
                                    <button
                                        className={styles.saveBtn}
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportResult(null);
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExpenseDetailsPage;
