import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Wallet, AlertTriangle, RefreshCw, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { budgetService, Budget } from '../services/budgetService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import LoadingScreen from '../components/LoadingScreen';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

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
        const pollInterval = setInterval(fetchData, 30000);
        return () => clearInterval(pollInterval);
    }, [fetchData]);

    const handleAddBudget = async () => {
        if (!newBudget.category || !newBudget.limit || !user) return;
        setSaving(true);
        try {
            const created = await budgetService.create({
                user_id: user.id, category: newBudget.category,
                amount: parseFloat(newBudget.limit), period: 'monthly'
            });
            if (created) {
                const updatedBudgets = [...budgets, created];
                setBudgets(updatedBudgets);
                setSpendingMap(calculateSpending(transactions, updatedBudgets));
                setNewBudget({ category: 'Shopping', limit: '' });
                setShowModal(false);
                toast.success('Budget created!');
                sound.playSuccess();
            }
        } catch (error) {
            toast.error("Failed to create budget");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBudget = async (id: string) => {
        if (!confirm('Delete this budget?')) return;
        if (await budgetService.delete(id)) {
            setBudgets(budgets.filter(b => b.id !== id));
            toast.success("Budget deleted");
            sound.playClick();
        }
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

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-display">Budget Health</h1>
                    <p className="text-muted-foreground mt-1">Track and manage your monthly budgets</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                        <Plus className="mr-2 h-4 w-4" />
                        New Budget
                    </Button>
                    <Avatar className="border-2 border-primary/20">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2563EB&color=fff`} />
                        <AvatarFallback className="bg-primary text-white">U</AvatarFallback>
                    </Avatar>

                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-hover border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Budget</CardTitle>
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Wallet className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold font-display">{formatCurrency(totalBudget)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Monthly allocation</p>
                    </CardContent>
                </Card>
                <Card className="card-hover border-slate-200/60 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Spent</CardTitle>
                        <div className="p-2 rounded-lg bg-slate-100">
                            <AlertTriangle className="h-4 w-4 text-slate-600" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-bold font-display">{formatCurrency(totalSpent)}</div>
                        <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "card-hover border-slate-200/60 shadow-sm overflow-hidden",
                    remaining < 0
                        ? "bg-red-50/30"
                        : "bg-indigo-50/20"
                )}>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{remaining < 0 ? 'Over Budget' : 'Remaining'}</CardTitle>
                        <div className={cn(
                            "p-2 rounded-lg",
                            remaining < 0 ? "bg-red-50" : "bg-indigo-50"
                        )}>
                            <Target className={cn("h-4 w-4", remaining < 0 ? "text-red-600" : "text-indigo-600")} />
                        </div>

                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-display", remaining < 0 ? "text-red-500" : "text-indigo-600")}>
                            {formatCurrency(Math.abs(remaining))}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">Available to spend</p>
                    </CardContent>
                </Card>
            </div>

            {/* Budgets Grid */}
            {budgets.length === 0 ? (
                <Card className="card-hover">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                            <Wallet className="h-10 w-10 text-white" />
                        </div>

                        <h3 className="text-xl font-semibold mb-2">No budgets yet</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-sm">Create your first budget to start tracking your spending</p>
                        <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">Create First Budget</Button>

                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map((budget, index) => {
                        const spent = spendingMap[budget.category] || 0;
                        const progress = getProgress(spent, budget.amount);
                        const status = getStatus(spent, budget.amount);

                        return (
                            <motion.div
                                key={budget.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{budget.category}</CardTitle>
                                                <Badge variant="secondary" className="mt-1">
                                                    Limit: {formatCurrency(budget.amount)}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBudget(budget.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className={cn(
                                                    "font-medium",
                                                    status === 'danger' && "text-red-600",
                                                    status === 'warning' && "text-amber-600",
                                                    status === 'safe' && "text-blue-600"

                                                )}>
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={progress}
                                                className={cn(
                                                    "h-2",
                                                    status === 'danger' && "[&>div]:bg-red-500",
                                                    status === 'warning' && "[&>div]:bg-amber-500",
                                                    status === 'safe' && "[&>div]:bg-blue-500"

                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Spent</p>
                                                <p className="font-bold">{formatCurrency(spent)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">Remaining</p>
                                                <p className={cn(
                                                    "font-bold",
                                                    budget.amount - spent < 0 ? "text-red-600" : "text-blue-600"
                                                )}>
                                                    {formatCurrency(budget.amount - spent)}
                                                </p>

                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Add Budget Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Create New Budget</h2>
                                <p className="text-sm text-slate-500 font-normal">Set a monthly spending limit</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-5">
                        {/* Category Selection */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Category</label>
                            <Select value={newBudget.category} onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}>
                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:border-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BUDGET_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            <span className="flex items-center gap-2">
                                                <span>{getCategoryEmoji(cat)}</span>
                                                <span>{cat}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Monthly Limit */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Monthly Limit *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{getCurrencySymbol()}</span>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    value={newBudget.limit}
                                    onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                                    className="h-11 pl-8 bg-slate-50 border-slate-200 focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Quick Amounts</label>
                            <div className="flex gap-2">
                                {[500, 1000, 2000, 5000].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setNewBudget({ ...newBudget, limit: amount.toString() })}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                            newBudget.limit === amount.toString()
                                                ? "bg-primary/10 text-primary ring-2 ring-primary"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        )}
                                    >
                                        {getCurrencySymbol()}{amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="flex-1 h-11 border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddBudget}
                                disabled={saving || !newBudget.limit}
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                            >
                                {saving ? 'Creating...' : 'Create Budget'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetsPage;
