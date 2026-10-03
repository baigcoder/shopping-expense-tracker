import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Plus, Trophy, TrendingUp, PiggyBank,
    Pencil, Trash2,
    RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { PlanNavigationTabs } from '@/components/PlanNavigationTabs';

interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    icon: string;
    color: string;
    created_at: string;
}

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '💍', '🎓', '💰', '🏝️', '🛡️', '👶'];

const GOAL_COLORS = [
    { name: 'brand', bg: '#0E8174', label: 'Sovereign Jade' },
    { name: 'blue', bg: '#2563EB', label: 'Classic Blue' },
    { name: 'emerald', bg: '#059669', label: 'Emerald Green' },
    { name: 'amber', bg: '#D97706', label: 'Warm Amber' },
    { name: 'purple', bg: '#7C3AED', label: 'Royal Purple' },
    { name: 'stone', bg: '#44403C', label: 'Charcoal' },
];

export const GoalsPage = () => {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Quick deposit modal
    const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositing, setDepositing] = useState(false);

    // Filter
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        icon: '🎯',
        color: 'brand'
    });
    const [saving, setSaving] = useState(false);

    const fetchGoals = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            toast.error('Could not load savings goals');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchGoals();
        toast.success('Goals updated');
    };

    const openAddModal = () => {
        setEditingGoal(null);
        setFormData({
            name: '',
            target_amount: '',
            current_amount: '',
            deadline: '',
            icon: '🎯',
            color: 'brand'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            current_amount: goal.current_amount.toString(),
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            icon: goal.icon || '🎯',
            color: goal.color || 'brand'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.target_amount || !user?.id) {
            toast.error('Please enter a goal name and target amount');
            return;
        }

        const target = parseFloat(formData.target_amount);
        const current = parseFloat(formData.current_amount) || 0;
        if (isNaN(target) || target <= 0) {
            toast.error('Target amount must be greater than zero');
            return;
        }

        setSaving(true);
        try {
            const goalData = {
                user_id: user.id,
                name: formData.name,
                target_amount: target,
                current_amount: current,
                deadline: formData.deadline || null,
                icon: formData.icon,
                color: formData.color
            };

            if (editingGoal) {
                const { error } = await supabase
                    .from('goals')
                    .update(goalData)
                    .eq('id', editingGoal.id);
                if (error) throw error;
                toast.success('Goal updated');
            } else {
                const { error } = await supabase
                    .from('goals')
                    .insert([goalData]);
                if (error) throw error;
                toast.success('New goal created! 🎯');
            }

            setIsModalOpen(false);
            fetchGoals();
        } catch (error) {
            console.error('Failed to save goal:', error);
            toast.error('Failed to save goal');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (goalId: string, name: string) => {
        if (!confirm(`Delete savings goal "${name}"?`)) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', goalId);
            if (error) throw error;
            toast.success('Goal deleted');
            fetchGoals();
        } catch {
            toast.error('Failed to delete goal');
        }
    };

    const handleQuickDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!depositGoal) return;
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Enter a valid deposit amount');
            return;
        }

        setDepositing(true);
        try {
            const nextCurrent = depositGoal.current_amount + amount;
            const { error } = await supabase
                .from('goals')
                .update({ current_amount: nextCurrent })
                .eq('id', depositGoal.id);

            if (error) throw error;

            toast.success(`Deposited ${formatCurrency(amount)} toward ${depositGoal.name}!`);
            setDepositGoal(null);
            setDepositAmount('');
            fetchGoals();
        } catch {
            toast.error('Deposit failed');
        } finally {
            setDepositing(false);
        }
    };

    // Computations
    const decoratedGoals = useMemo(() => {
        const today = new Date();

        return goals.map(goal => {
            const current = goal.current_amount || 0;
            const target = goal.target_amount || 1;
            const progress = Math.min(Math.round((current / target) * 100), 100);
            const remaining = Math.max(target - current, 0);
            const isCompleted = current >= target;

            let monthsRemaining: number | null = null;
            let requiredMonthly = 0;

            if (goal.deadline) {
                const dDate = new Date(goal.deadline);
                const diffTime = dDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                monthsRemaining = Math.max(Math.ceil(diffDays / 30.4), 1);

                if (!isCompleted && monthsRemaining > 0) {
                    requiredMonthly = remaining / monthsRemaining;
                }
            }

            return {
                ...goal,
                progress,
                remaining,
                isCompleted,
                monthsRemaining,
                requiredMonthly,
            };
        });
    }, [goals]);

    // High level metrics
    const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + (g.target_amount || 0), 0), [goals]);
    const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + (g.current_amount || 0), 0), [goals]);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const completedCount = decoratedGoals.filter(g => g.isCompleted).length;
    const activeCount = decoratedGoals.length - completedCount;
    const totalRequiredMonthly = useMemo(() => {
        return decoratedGoals.reduce((sum, g) => sum + g.requiredMonthly, 0);
    }, [decoratedGoals]);

    const filteredGoals = useMemo(() => {
        if (filter === 'active') return decoratedGoals.filter(g => !g.isCompleted);
        if (filter === 'completed') return decoratedGoals.filter(g => g.isCompleted);
        return decoratedGoals;
    }, [decoratedGoals, filter]);

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Capital Accumulation Roadmap
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Goals & Milestones
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Target milestones, automated monthly contribution tracking, and progress metrics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', refreshing && 'animate-spin')} />
                        Sync
                    </Button>
                    <Button
                        size="sm"
                        onClick={openAddModal}
                        className="rounded-full bg-[#EE5024] hover:bg-[#EE5024]/90 text-white font-bold text-xs h-10 px-6 shadow-sm transition-all"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create New Goal
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <PlanNavigationTabs
                badges={{
                    goals: activeCount,
                }}
            />

            {/* Color-Blocked Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Cadmium Orange: Total Capital Saved */}
                <div className="p-6 rounded-[24px] bg-[#EE5024] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
                        <span>Capital Saved</span>
                        <PiggyBank className="h-4 w-4 text-white" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(totalSaved)}
                        </div>
                        <div className="text-xs font-semibold text-white/90 mt-2">
                            {overallProgress.toFixed(0)}% of total milestone targets
                        </div>
                    </div>
                </div>

                {/* 2. Deep Ink: Required Monthly Contribution */}
                <div className="p-6 rounded-[24px] bg-[#111111] text-white shadow-sm flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                        <span>Required Monthly Pace</span>
                        <TrendingUp className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-white leading-none">
                            {loading ? '—' : formatCurrency(totalRequiredMonthly)}
                        </div>
                        <div className="text-xs text-white/70 mt-2">
                            To achieve targets by specified deadlines
                        </div>
                    </div>
                </div>

                {/* 3. Warm Ivory / White: Total Target Sum */}
                <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/60">
                        <span>Total Target Sum</span>
                        <Target className="h-4 w-4 text-[#EE5024]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : formatCurrency(totalTarget)}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Remaining: {formatCurrency(Math.max(totalTarget - totalSaved, 0))}
                        </div>
                    </div>
                </div>

                {/* 4. Muted Sage / Soft Accent: Milestones Reached */}
                <div className="p-6 rounded-[24px] bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 shadow-xs flex flex-col justify-between min-h-[160px]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/70">
                        <span>Milestones Reached</span>
                        <Trophy className="h-4 w-4 text-[var(--color-ink)]" />
                    </div>
                    <div className="my-2">
                        <div className="text-4xl font-extrabold tracking-tight tabular-nums font-mono text-[var(--color-ink)] leading-none">
                            {loading ? '—' : completedCount}
                        </div>
                        <div className="text-xs text-[var(--color-ink)]/70 mt-2 font-medium">
                            Goals funded to 100% completion
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            filter === 'all'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        All Goals ({decoratedGoals.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            filter === 'active'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        In Progress ({activeCount})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={cn(
                            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                            filter === 'completed'
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] shadow-xs'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        )}
                    >
                        Completed ({completedCount})
                    </button>
                </div>
            </div>

            {/* Goals Grid */}
            {loading ? (
                <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                    Loading savings milestones...
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--color-surface-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                        <PiggyBank className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {filter === 'completed' ? 'No completed goals yet' : 'No savings goals established'}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
                            Track funding for travel, emergency reserve, real estate, or gadget upgrades.
                        </p>
                    </div>
                    {filter !== 'completed' && (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                onClick={openAddModal}
                                className="rounded-xl bg-[var(--color-brand)] text-white text-xs"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Create First Goal
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredGoals.map(goal => {
                            const colorObj = GOAL_COLORS.find(c => c.name === goal.color) || GOAL_COLORS[0];

                            return (
                                <motion.div
                                    key={goal.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border)] transition-all space-y-4"
                                >
                                    {/* Top Bar */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shadow-xs"
                                                style={{ backgroundColor: `${colorObj.bg}15`, border: `1px solid ${colorObj.bg}30` }}
                                            >
                                                {goal.icon || '🎯'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                                                    {goal.name}
                                                </h3>
                                                <div className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
                                                    Target: {formatCurrency(goal.target_amount)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {goal.isCompleted ? (
                                                <Badge variant="success" className="text-[10px]">
                                                    Achieved
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDepositGoal(goal);
                                                        setDepositAmount('');
                                                    }}
                                                    className="h-7 text-xs px-2.5 font-semibold text-[var(--color-brand)] border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/10 rounded-lg"
                                                >
                                                    + Add Funds
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(goal)}
                                                className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(goal.id, goal.name)}
                                                className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-rose-600 rounded-lg"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[var(--color-text-secondary)] font-medium">
                                                {goal.progress}% funded
                                            </span>
                                            <span className="tabular-nums font-mono font-semibold text-[var(--color-text-primary)]">
                                                {formatCurrency(goal.current_amount)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${goal.progress}%`,
                                                    backgroundColor: colorObj.bg
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metrics Footer */}
                                    <div className="pt-2 border-t border-[var(--color-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block">
                                                Deadline
                                            </span>
                                            <span className="font-medium text-[var(--color-text-secondary)]">
                                                {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block">
                                                Monthly Pace
                                            </span>
                                            <span className="font-semibold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                                                {goal.isCompleted
                                                    ? 'Complete'
                                                    : goal.requiredMonthly > 0
                                                    ? `${formatCurrency(goal.requiredMonthly)}/mo`
                                                    : 'Self-paced'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Quick Deposit Modal */}
            <Dialog open={!!depositGoal} onOpenChange={(open) => !open && setDepositGoal(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[var(--color-text-primary)]">Add Funds to Goal</DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Log a deposit towards {depositGoal?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleQuickDeposit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="dep-amount" className="text-xs font-semibold text-[var(--color-text-primary)]">Deposit Amount</Label>
                            <Input
                                id="dep-amount"
                                type="number"
                                step="0.01"
                                placeholder="100.00"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                required
                                autoFocus
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDepositGoal(null)}
                                className="rounded-xl text-xs border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={depositing}
                                className="rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs"
                            >
                                {depositing ? 'Updating...' : 'Confirm Deposit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add / Edit Goal Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-[var(--color-surface)] border-[var(--color-border)]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[var(--color-text-primary)]">
                            {editingGoal ? 'Edit Savings Goal' : 'Create Savings Milestone'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--color-text-muted)]">
                            Define your milestone target and timeline.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="goal-name" className="text-xs font-semibold text-[var(--color-text-primary)]">Goal Name</Label>
                            <Input
                                id="goal-name"
                                placeholder="e.g. Japan Vacation, Emergency Fund, Tesla Downpayment"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="goal-target" className="text-xs font-semibold text-[var(--color-text-primary)]">Target Amount</Label>
                                <Input
                                    id="goal-target"
                                    type="number"
                                    step="1"
                                    placeholder="5000"
                                    value={formData.target_amount}
                                    onChange={e => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                                    required
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="goal-current" className="text-xs font-semibold text-[var(--color-text-primary)]">Current Saved</Label>
                                <Input
                                    id="goal-current"
                                    type="number"
                                    step="1"
                                    placeholder="500"
                                    value={formData.current_amount}
                                    onChange={e => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                                    className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="goal-deadline" className="text-xs font-semibold text-[var(--color-text-primary)]">Target Date (Optional)</Label>
                            <Input
                                id="goal-deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono"
                            />
                        </div>

                        {/* Icon Picker */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[var(--color-text-primary)]">Select Icon</Label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {GOAL_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                                        className={cn(
                                            'h-9 w-9 rounded-xl flex items-center justify-center text-lg border transition-all',
                                            formData.icon === icon
                                                ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 scale-110 shadow-xs'
                                                : 'border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]'
                                        )}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl text-xs border-[var(--color-border)] text-[var(--color-text-secondary)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-[var(--color-brand)] hover:opacity-90 text-white text-xs"
                            >
                                {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GoalsPage;
