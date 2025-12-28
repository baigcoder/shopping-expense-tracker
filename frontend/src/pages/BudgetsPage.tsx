import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Wallet, AlertTriangle, RefreshCw, Target,
    ChevronRight, CheckCircle2, TrendingUp, Sparkles, Clock,
    DollarSign, LayoutGrid, CalendarDays
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { budgetService, Budget } from '../services/budgetService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { BudgetsSkeleton } from '../components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import styles from './BudgetsPage.module.css';

const BUDGET_CATEGORIES = [
    'Shopping', 'Food & Dining', 'Transport', 'Entertainment',
    'Bills & Utilities', 'Health', 'Education', 'Travel', 'Other'
];

const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
        'Shopping': '🛍️',
        'Food & Dining': '🍽️',
        'Transport': '🚗',
        'Entertainment': '🎬',
        'Bills & Utilities': '💡',
        'Health': '💊',
        'Education': '📚',
        'Travel': '✈️',
        'Other': '📦'
    };
    return emojis[category] || '📦';
};

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100 }
    }
};

const BudgetsPage = () => {
    const { user } = useAuth();
    const sound = useSound();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBudget, setNewBudget] = useState({ category: 'Shopping', limit: '' });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const calculateSpending = useCallback((txList: SupabaseTransaction[], budgetList: Budget[]) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentTx = txList.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
        });
        const spending: Record<string, number> = {};
        currentTx.forEach(t => {
            const txCategory = typeof t.category === 'string' ? t.category.toLowerCase() : (t.category as any)?.name?.toLowerCase() || 'other';
            const matchingBudget = budgetList.find(b =>
                b.category.toLowerCase() === txCategory ||
                b.category.toLowerCase().includes(txCategory) ||
                txCategory.includes(b.category.toLowerCase())
            );
            if (matchingBudget) {
                spending[matchingBudget.category] = (spending[matchingBudget.category] || 0) + t.amount;
            }
        });
        return spending;
    }, []);

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
            setSpendingMap(calculateSpending(fetchedTransactions, fetchedBudgets));
        } catch (error) {
            console.error("Failed to load budget data", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user, calculateSpending]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddBudget = async () => {
        if (!newBudget.category || !newBudget.limit || !user) return;
        setSaving(true);
        try {
            const created = await budgetService.create({
                user_id: user.id,
                category: newBudget.category,
                amount: parseFloat(newBudget.limit),
                period: 'monthly'
            });
            if (created) {
                const updatedBudgets = [...budgets, created];
                setBudgets(updatedBudgets);
                setSpendingMap(calculateSpending(transactions, updatedBudgets));
                setNewBudget({ category: 'Shopping', limit: '' });
                setShowModal(false);
                toast.success('Budget limits activated! 🚀');
                sound.playSuccess();
            }
        } catch (error) {
            toast.error("Cloud sync failed. Try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBudget = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Discard this budget limit?')) return;
        if (await budgetService.delete(id)) {
            setBudgets(budgets.filter(b => b.id !== id));
            toast.success("Budget target removed");
            sound.playClick();
        }
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (spendingMap[b.category] || 0), 0);
    const remaining = totalBudget - totalSpent;

    const getProgress = (spent: number, limit: number) => Math.min((spent / limit) * 100, 100);
    const getStatusType = (spent: number, limit: number) => {
        const percent = (spent / limit) * 100;
        if (percent >= 100) return styles.danger;
        if (percent >= 80) return styles.warning;
        return styles.safe;
    };

    if (isLoading && budgets.length === 0) {
        return (
            <div className={styles.mainContent}>
                <BudgetsSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            {/* Glass Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={styles.header}
            >
                <div className={styles.headerTitle}>
                    <div className={styles.headerIcon}>
                        <Wallet className="h-7 w-7" />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Budget Health</h1>
                        <p>Track your monthly fuel and spending velocity</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        className="rounded-2xl font-bold text-slate-500 hover:bg-slate-100 h-12 px-5"
                        onClick={fetchData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        New Budget
                    </Button>
                </div>
            </motion.header>

            {/* Stats Overview */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={styles.overviewGrid}
            >
                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, "bg-blue-50 text-blue-600")}>
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="border-blue-100 bg-blue-50/50 text-blue-600 font-black text-[10px] uppercase">Plan</Badge>
                    </div>
                    <div className={styles.statLabel}>Total Budget</div>
                    <div className={styles.statValue}>{formatCurrency(totalBudget)}</div>
                    <div className={styles.statSubtext}>Monthly Allocation</div>
                </motion.div>

                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, "bg-slate-100 text-slate-600")}>
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50/50 text-slate-600 font-black text-[10px] uppercase">Spent</Badge>
                    </div>
                    <div className={styles.statLabel}>Total Spent</div>
                    <div className={styles.statValue}>{formatCurrency(totalSpent)}</div>
                    <div className={styles.statSubtext}>Current Month</div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className={cn(styles.premiumStatCard, remaining < 0 && styles.overBudgetCard)}
                >
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, remaining < 0 ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600")}>
                            <Target className="h-6 w-6" />
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-black text-[10px] uppercase",
                                remaining < 0 ? "border-rose-100 bg-rose-50 text-rose-600" : "border-indigo-100 bg-indigo-50 text-indigo-600"
                            )}
                        >
                            {remaining < 0 ? 'CRITICAL' : 'REMAINING'}
                        </Badge>
                    </div>
                    <div className={styles.statLabel}>{remaining < 0 ? 'Deficit' : 'Remaining'}</div>
                    <div className={cn(styles.statValue, remaining < 0 ? "text-rose-600" : "text-indigo-600")}>
                        {formatCurrency(Math.abs(remaining))}
                    </div>
                    <div className={styles.statSubtext}>Buying Power</div>
                </motion.div>
            </motion.div>

            {/* Budgets Grid */}
            {budgets.length === 0 ? (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={styles.emptyStateCard}
                >
                    <div className={styles.emptyIconBox}>
                        <Wallet className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-black">No budgets established</h2>
                    <p className="text-slate-500 font-bold max-w-sm">
                        Create your first budget limit to gain complete control over your cash flow.
                    </p>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 mt-2"
                    >
                        <Plus className="mr-2 h-6 w-6" />
                        Establish First Budget
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={styles.budgetGrid}
                >
                    <AnimatePresence mode="popLayout">
                        {budgets.map((budget, index) => {
                            const spent = spendingMap[budget.category] || 0;
                            const progress = getProgress(spent, budget.amount);
                            const statusClass = getStatusType(spent, budget.amount);

                            return (
                                <motion.div
                                    key={budget.id}
                                    layout
                                    variants={itemVariants}
                                    className={cn(styles.premiumBudgetCard, statusClass)}
                                >
                                    <div className={styles.cardTop}>
                                        <div className="flex items-center gap-4">
                                            <div className={styles.categoryAvatar}>
                                                {getCategoryEmoji(budget.category)}
                                            </div>
                                            <div className={styles.budgetInfo}>
                                                <h3>{budget.category}</h3>
                                                <div className={styles.limitLabel}>
                                                    <Clock className="h-3 w-3" />
                                                    Limit: {formatCurrency(budget.amount)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.deleteAction}>
                                            <button
                                                className={styles.iconButton}
                                                onClick={(e) => handleDeleteBudget(budget.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressLabelGroup}>
                                            <span className={styles.progressText}>Current Utilization</span>
                                            <span className={styles.progressPercent}>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.metricsRow}>
                                        <div className={styles.metricItem}>
                                            <span className={styles.mLabel}>Spent</span>
                                            <span className={styles.mValue}>{formatCurrency(spent)}</span>
                                        </div>
                                        <div className={styles.metricItem} style={{ textAlign: 'right' }}>
                                            <span className={styles.mLabel}>Left</span>
                                            <span className={cn(styles.mValue, budget.amount - spent < 0 ? "text-rose-600" : "text-blue-600")}>
                                                {formatCurrency(budget.amount - spent)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add Budget Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className={styles.glassDialog}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalIcon}>
                            <Target className="h-8 w-8" />
                        </div>
                        <div className={styles.modalTitle}>
                            <DialogTitle className="text-2xl font-black">Plan Spending</DialogTitle>
                            <DialogDescription className="font-bold text-slate-500">Define a monthly limit for a specific category</DialogDescription>
                        </div>
                    </div>

                    <div className={styles.modalContent}>
                        {/* Category Selection */}
                        <div className={styles.formSection}>
                            <label className={styles.labelPremium}>Select Category</label>
                            <Select
                                value={newBudget.category}
                                onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                            >
                                <SelectTrigger className={styles.premiumInput}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl">
                                    {BUDGET_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat} className="rounded-xl my-1 focus:bg-indigo-50">
                                            <span className="flex items-center gap-3 font-bold text-slate-700">
                                                <span className="text-xl">{getCategoryEmoji(cat)}</span>
                                                {cat}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount Input */}
                        <div className={styles.formSection}>
                            <label className={styles.labelPremium}>Monthly Threshold</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="number"
                                    placeholder="e.g. 5,000"
                                    value={newBudget.limit}
                                    onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                                    className={cn(styles.premiumInput, "pl-12")}
                                />
                            </div>
                        </div>

                        {/* Quick Amounts */}
                        <div className={styles.formSection}>
                            <label className={styles.labelPremium}>Direct Presets</label>
                            <div className={styles.quickAmounts}>
                                {[500, 1000, 2000, 5000].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setNewBudget({ ...newBudget, limit: amount.toString() })}
                                        className={cn(
                                            styles.amountBtn,
                                            newBudget.limit === amount.toString() && styles.amountSelected
                                        )}
                                    >
                                        {getCurrencySymbol()}{amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setShowModal(false)}
                                className="flex-1 h-14 rounded-2xl font-bold bg-slate-50 text-slate-500 hover:bg-slate-100"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={handleAddBudget}
                                disabled={saving || !newBudget.limit}
                                className="flex-2 h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200"
                            >
                                {saving ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Establish Plan'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetsPage;
