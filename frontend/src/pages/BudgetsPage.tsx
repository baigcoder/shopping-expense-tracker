import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Wallet, RefreshCw, Target,
    TrendingUp, Clock, DollarSign, LayoutGrid, Flame, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
        'Shopping': '🛍️', 'Food & Dining': '🍽️', 'Transport': '🚗',
        'Entertainment': '🎬', 'Bills & Utilities': '💡', 'Health': '💊',
        'Education': '📚', 'Travel': '✈️', 'Other': '📦'
    };
    return emojis[category] || '📦';
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

    const calculateBurnRate = (spent: number, limit: number) => {
        const today = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - today;
        const dailyAvg = spent / today;
        const remainingBudget = limit - spent;
        
        if (remainingBudget <= 0) return 0;
        if (dailyAvg === 0) return remainingDays;
        
        return Math.floor(remainingBudget / dailyAvg);
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
        return <div className={styles.mainContent}><BudgetsSkeleton /></div>;
    }

    return (
        <div className={styles.mainContent}>
            <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.headerIcon}><Wallet size={28} /></div>
                    <div className={styles.headerInfo}>
                        <h1>Budget Health</h1>
                        <p>Track your monthly fuel and spending velocity</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchData} disabled={isRefreshing} className="h-14 px-6 border-4 border-black bg-white font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all">
                        <RefreshCw size={16} className={cn("inline mr-2", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                    <button onClick={() => setShowModal(true)} className="h-14 px-6 border-4 border-black bg-[#E11D48] text-white font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all">
                        <Plus size={16} className="inline mr-2" />
                        New Budget
                    </button>
                </div>
            </motion.header>

            <div className={styles.overviewGrid}>
                <div className={styles.premiumStatCard}>
                    <span className={styles.statLabel}>Total Allocation</span>
                    <div className={styles.statValue}>{formatCurrency(totalBudget)}</div>
                    <div className={styles.statSubtext}>Planned Fuel</div>
                </div>
                <div className={styles.premiumStatCard}>
                    <span className={styles.statLabel}>Total Burn</span>
                    <div className={styles.statValue}>{formatCurrency(totalSpent)}</div>
                    <div className={styles.statSubtext}>Current Consumption</div>
                </div>
                <div className={cn(styles.premiumStatCard, remaining < 0 && styles.overBudgetCard)}>
                    <span className={styles.statLabel}>{remaining < 0 ? 'DEFICIT' : 'REMAINING'}</span>
                    <div className={cn(styles.statValue, remaining < 0 && "text-[#E11D48]")}>
                        {formatCurrency(Math.abs(remaining))}
                    </div>
                    <div className={styles.statSubtext}>Buying Power</div>
                </div>
            </div>

            {budgets.length === 0 ? (
                <div className={styles.emptyStateCard}>
                    <div className={styles.modalIcon} style={{ margin: '0 auto 1.5rem' }}><Wallet size={32} /></div>
                    <h2 className="text-3xl font-black uppercase mb-4">No budgets established</h2>
                    <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8 uppercase tracking-widest text-xs">
                        Create your first budget limit to gain complete control over your cash flow.
                    </p>
                    <button onClick={() => setShowModal(true)} className="h-16 px-10 border-4 border-black bg-[#000000] text-white font-black uppercase tracking-widest shadow-[8px_8px_0px_#E11D48] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                        Launch First Target
                    </button>
                </div>
            ) : (
                <div className={styles.budgetGrid}>
                    <AnimatePresence mode="popLayout">
                        {budgets.map((budget) => {
                            const spent = spendingMap[budget.category] || 0;
                            const progress = getProgress(spent, budget.amount);
                            const statusClass = getStatusType(spent, budget.amount);
                            const daysLeft = calculateBurnRate(spent, budget.amount);

                            return (
                                <motion.div key={budget.id} layout className={cn(styles.premiumBudgetCard, statusClass)}>
                                    <div className={styles.cardTop}>
                                        <div className="flex items-center gap-4">
                                            <div className={styles.categoryAvatar}>{getCategoryEmoji(budget.category)}</div>
                                            <div className={styles.budgetInfo}>
                                                <h3>{budget.category}</h3>
                                                <div className={styles.limitLabel}>TARGET: {formatCurrency(budget.amount)}</div>
                                            </div>
                                        </div>
                                        <button className={styles.refreshBtn} style={{ width: '2.5rem', height: '2.5rem' }} onClick={(e) => handleDeleteBudget(budget.id, e)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressLabelGroup}>
                                            <span>Utilization</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className={styles.statLabel}>Burned</span>
                                            <div className="text-xl font-black">{formatCurrency(spent)}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={styles.statLabel}>Fuel Left</span>
                                            <div className={cn("text-xl font-black", budget.amount - spent < 0 ? "text-[#E11D48]" : "text-black")}>
                                                {formatCurrency(budget.amount - spent)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.burnRate}>
                                        <div className="flex items-center gap-2">
                                            <Flame size={14} className={daysLeft < 5 ? "animate-pulse" : ""} />
                                            <span>Burn Velocity</span>
                                        </div>
                                        <span>{daysLeft === 0 ? 'CRITICAL: EMPTY' : `${daysLeft} Days Left`}</span>
                                    </div>

                                    {progress >= 100 && (
                                        <div className="bg-[#E11D48] text-white p-2 font-black uppercase text-[10px] tracking-tighter flex items-center gap-2 animate-bounce">
                                            <AlertTriangle size={14} /> LIMIT BREACHED: ADJUST STRATEGY
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className={styles.glassDialog}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalIcon}><Target size={32} /></div>
                        <h2 className="text-2xl font-black uppercase">Plan Spending</h2>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Define a monthly limit for a specific category</p>
                    </div>

                    <div className="p-8">
                        <div className={styles.formSection}>
                            <label className={styles.labelPremium}>Select Category</label>
                            <Select value={newBudget.category} onValueChange={(v) => setNewBudget({ ...newBudget, category: v })}>
                                <SelectTrigger className={styles.premiumInput}><SelectValue /></SelectTrigger>
                                <SelectContent className="border-4 border-black rounded-none">
                                    {BUDGET_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat} className="font-black uppercase text-[10px]">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={styles.formSection}>
                            <label className={styles.labelPremium}>Monthly Threshold</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
                                <Input type="number" placeholder="5,000" value={newBudget.limit} onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })} className={cn(styles.premiumInput, "pl-12")} />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 h-16 border-4 border-black bg-white font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Discard
                            </button>
                            <button 
                                onClick={handleAddBudget} 
                                disabled={saving || !newBudget.limit} 
                                className="flex-[2] h-16 border-4 border-black bg-[#000000] text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_#E11D48] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#E11D48] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <RefreshCw className="h-5 w-5 animate-spin mx-auto" /> : 'Establish Plan'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetsPage;

