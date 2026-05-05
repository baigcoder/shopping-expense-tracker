import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Plus, Trophy, TrendingUp, PiggyBank, Sparkles, X,
    DollarSign, Calendar, Pencil, Trash2, ShieldCheck,
    ArrowUpRight, Clock, CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import { GoalsSkeleton } from '../components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import styles from './GoalsPage.module.css';

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

const GOAL_COLORS = [
    { name: 'blue', bg: '#3b82f6', light: '#eff6ff', text: '#2563eb' },
    { name: 'indigo', bg: '#6366f1', light: '#eef2ff', text: '#4f46e5' },
    { name: 'teal', bg: '#14b8a6', light: '#f0fdfa', text: '#0d9488' },
    { name: 'amber', bg: '#f59e0b', light: '#fffbeb', text: '#d97706' },
    { name: 'rose', bg: '#f43f5e', light: '#fff1f2', text: '#e11d48' },
    { name: 'emerald', bg: '#10b981', light: '#f0fdf4', text: '#059669' },
];

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '💍', '🎓', '💰', '🏝️'];

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const GoalsPage = () => {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        current_amount: '',
        deadline: '',
        icon: '🎯',
        color: 'blue'
    });

    const fetchGoals = async () => {
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [user?.id]);

    // Listen for goal changes to update immediately
    useEffect(() => {
        const handleGoalChange = () => {
            console.log('🔄 Goal changed - refreshing');
            fetchGoals();
        };

        window.addEventListener('goal-added', handleGoalChange);
        window.addEventListener('goal-updated', handleGoalChange);
        window.addEventListener('goal-deleted', handleGoalChange);

        return () => {
            window.removeEventListener('goal-added', handleGoalChange);
            window.removeEventListener('goal-updated', handleGoalChange);
            window.removeEventListener('goal-deleted', handleGoalChange);
        };
    }, [user?.id]);


    const openAddModal = () => {
        setEditingGoal(null);
        setFormData({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯', color: 'blue' });
        setIsModalOpen(true);
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            target_amount: goal.target_amount.toString(),
            current_amount: goal.current_amount.toString(),
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            icon: goal.icon,
            color: goal.color
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.target_amount) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            const goalData = {
                user_id: user?.id,
                name: formData.name,
                target_amount: parseFloat(formData.target_amount),
                current_amount: parseFloat(formData.current_amount) || 0,
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
                toast.success('Goal updated successfully');
            } else {
                const { error } = await supabase
                    .from('goals')
                    .insert([goalData]);
                if (error) throw error;
                toast.success('Goal created successfully');
            }

            setIsModalOpen(false);
            fetchGoals();
        } catch (error) {
            console.error('Failed to save goal:', error);
            toast.error('Failed to save goal');
        }
    };

    const handleDelete = async (goalId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', goalId);
            if (error) throw error;
            toast.success('Goal deleted');
            fetchGoals();
        } catch (error) {
            toast.error('Failed to delete goal');
        }
    };

    const getColorData = (colorName: string) => {
        return GOAL_COLORS.find(c => c.name === colorName) || GOAL_COLORS[0];
    };

    const calculateProgress = (current: number, target: number) => {
        const t = target || 1;
        return Math.min(Math.round((current / t) * 100), 100);
    };

    const completedGoalsCount = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 0)).length;
    const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g.current_amount, g.target_amount), 0) / goals.length)
        : 0;

    if (loading && goals.length === 0) {
        return (
            <div className={styles.mainContent}>
                <GoalsSkeleton />
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
                        <PiggyBank className="h-9 w-9" strokeWidth={3} />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Savings Goals</h1>
                        <p>Total Freedom Tracker</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        className="font-black text-black uppercase tracking-widest text-[12px] hover:underline"
                        onClick={() => fetchGoals()}
                    >
                        Sync Data
                    </button>
                    <button
                        onClick={openAddModal}
                        className="h-14 px-8 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_#E11D48] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#E11D48]"
                    >
                        New Goal
                    </button>
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
                        <div className={styles.statIconContainer}>
                            <Target className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">Active</span>
                    </div>
                    <div className={styles.statLabel}>Total Goals</div>
                    <div className={styles.statValue}>{goals.length}</div>
                    <div className={styles.statSubtext}>Mission Status</div>
                </motion.div>

                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIconContainer}>
                            <Trophy className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase bg-[#E11D48] text-white px-2 py-0.5">Elite</span>
                    </div>
                    <div className={styles.statLabel}>Completed</div>
                    <div className={styles.statValue}>{completedGoalsCount}</div>
                    <div className={styles.statSubtext}>Targets Achieved</div>
                </motion.div>

                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIconContainer}>
                            <TrendingUp className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">Wealth</span>
                    </div>
                    <div className={styles.statLabel}>Total Saved</div>
                    <div className={styles.statValue}>${totalSaved.toLocaleString()}</div>
                    <div className={styles.statSubtext}>Capital Stashed</div>
                </motion.div>

                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIconContainer}>
                            <Sparkles className="h-7 w-7" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black uppercase bg-[#E11D48] text-white px-2 py-0.5">Power</span>
                    </div>
                    <div className={styles.statLabel}>Avg. Progress</div>
                    <div className={styles.statValue}>{avgProgress}%</div>
                    <div className={styles.statSubtext}>Efficiency Rate</div>
                </motion.div>
            </motion.div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={styles.emptyStateContainer}
                >
                    <div className={styles.emptyStateCard}>
                        <div className={styles.emptyIconWrapper}>
                            <Target className="h-14 w-14" strokeWidth={4} />
                        </div>
                        <h2 className="font-black uppercase italic text-3xl">Zero Targets Detected</h2>
                        <p className="font-bold text-black opacity-60">Your financial arsenal is empty. Deploy your first savings mission now.</p>
                        <button
                            onClick={openAddModal}
                            className="h-16 px-10 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[8px_8px_0px_#E11D48] mt-4"
                        >
                            Deploy First Mission
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={styles.goalsGrid}
                >
                    <AnimatePresence mode="popLayout">
                        {goals.map((goal, index) => {
                            const color = getColorData(goal.color);
                            const progress = calculateProgress(goal.current_amount, goal.target_amount);
                            const isCompleted = progress >= 100;

                            return (
                                <motion.div
                                    key={goal.id}
                                    layout
                                    variants={itemVariants}
                                    className={cn(styles.premiumGoalCard, isCompleted && styles.completedCard)}
                                    onClick={() => openEditModal(goal)}
                                >
                                    <div className={styles.goalCardHeader}>
                                        <div
                                            className={styles.goalAvatar}
                                            style={{ backgroundColor: color.light, color: color.text }}
                                        >
                                            {goal.icon}
                                        </div>
                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={(e) => { e.stopPropagation(); openEditModal(goal); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                className={cn(styles.iconBtn, styles.deleteBtn)}
                                                onClick={(e) => handleDelete(goal.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.goalInfo}>
                                        <h3>{goal.name}</h3>
                                        <div className={styles.goalMeta}>
                                            <Calendar className="h-3.5 w-3.5" />
                                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                                        </div>
                                    </div>

                                    <div className={styles.progressContainer}>
                                        <div className={styles.percentageBadge}>{progress}% Complete</div>
                                        <div className={styles.linearProgressBase}>
                                            <div
                                                className={styles.linearProgressFill}
                                                style={{ width: `${progress}%`, backgroundColor: color.bg }}
                                            />
                                        </div>
                                        <div className={styles.progressDetails}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Capital Saved</span>
                                                <span className={styles.detailValue}>${goal.current_amount.toLocaleString()}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Target Objective</span>
                                                <span className={styles.detailValue}>${goal.target_amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isCompleted && (
                                        <div className={styles.completionBadge}>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Achievement Unlocked! 🎉
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add/Edit Goal Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className={styles.glassDialog}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalIcon}>
                            <Target className="h-8 w-8" />
                        </div>
                        <div className={styles.modalTitle}>
                            <DialogTitle>{editingGoal ? 'Revise Goal' : 'New Savings Goal'}</DialogTitle>
                            <DialogDescription>Define your target and track your progress</DialogDescription>
                        </div>
                    </div>

                    <div className={styles.modalBody}>
                        {/* Icon & Color Selection */}
                        <div className="grid grid-cols-2 gap-8">
                            <div className={styles.selectionArea}>
                                <span className={styles.selectionLabel}>Select Icon</span>
                                <div className={styles.gridSelection}>
                                    {GOAL_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            className={cn(styles.selectBtn, formData.icon === icon && styles.selected)}
                                            onClick={() => setFormData({ ...formData, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.selectionArea}>
                                <span className={styles.selectionLabel}>Accent Color</span>
                                <div className={styles.gridSelection}>
                                    {GOAL_COLORS.map(color => (
                                        <button
                                            key={color.name}
                                            className={cn(styles.selectBtn, formData.color === color.name && styles.selected)}
                                            onClick={() => setFormData({ ...formData, color: color.name })}
                                            style={{ backgroundColor: color.light }}
                                        >
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.bg }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className={styles.inputGroup}>
                            <span className={styles.selectionLabel}>Goal Name</span>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Summer Trip to Tokyo"
                                className={styles.premiumInput}
                            />
                        </div>

                        {/* Amounts Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className={styles.inputGroup}>
                                <span className={styles.selectionLabel}>Target Amount</span>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        placeholder="5000"
                                        className={cn(styles.premiumInput, "pl-12")}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <span className={styles.selectionLabel}>Already Saved</span>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={formData.current_amount}
                                        onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                        placeholder="0"
                                        className={cn(styles.premiumInput, "pl-12")}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className={styles.inputGroup}>
                            <span className={styles.selectionLabel}>Target Date (Optional)</span>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className={cn(styles.premiumInput, "pl-12")}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-6 pt-6">
                            <button
                                className="flex-1 h-14 border-4 border-black bg-white font-black uppercase tracking-widest text-black hover:bg-slate-50 transition-all"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Discard
                            </button>
                            <button
                                className="flex-1 h-14 border-4 border-black bg-[#E11D48] text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                onClick={handleSubmit}
                            >
                                {editingGoal ? 'Update Mission' : 'Activate Objective'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GoalsPage;
