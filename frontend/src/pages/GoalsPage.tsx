// GoalsPage - Cashly Theme with Add Goal Modal
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, Plus, Trophy, TrendingUp, PiggyBank, Sparkles, X, DollarSign, Calendar, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';

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
    { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-500' },
    { name: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-500' },
    { name: 'teal', bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-500' },
    { name: 'amber', bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-500' },
    { name: 'rose', bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-500' },
    { name: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-500' },
];

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '💍', '🎓', '💰', '🏝️'];

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

    // Fetch goals
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
            deadline: goal.deadline,
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

    const handleDelete = async (goalId: string) => {
        if (!confirm('Delete this goal?')) return;
        try {
            const { error } = await supabase.from('goals').delete().eq('id', goalId);
            if (error) throw error;
            toast.success('Goal deleted');
            fetchGoals();
        } catch (error) {
            toast.error('Failed to delete goal');
        }
    };

    const getColorClasses = (colorName: string) => {
        return GOAL_COLORS.find(c => c.name === colorName) || GOAL_COLORS[0];
    };

    const calculateProgress = (current: number | null | undefined, target: number | null | undefined) => {
        const c = current || 0;
        const t = target || 1;
        return Math.min(Math.round((c / t) * 100), 100);
    };

    const completedGoals = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 0)).length;
    const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + calculateProgress(g.current_amount, g.target_amount), 0) / goals.length)
        : 0;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-2">
                        <PiggyBank className="h-8 w-8 text-primary" />
                        Savings Goals
                    </h1>
                    <p className="text-muted-foreground mt-1">Track your financial goals and dreams</p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Goal
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="card-hover border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-500">
                            Total Goals
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Target className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">{goals.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active goals</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-500">
                            Completed
                            <div className="p-2 rounded-lg bg-indigo-50">
                                <Trophy className="h-4 w-4 text-indigo-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display text-indigo-600">{completedGoals}</div>
                        <p className="text-xs text-muted-foreground mt-1">Goals achieved</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-500">
                            Total Saved
                            <div className="p-2 rounded-lg bg-amber-50">
                                <TrendingUp className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">${totalSaved.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-500">
                            Progress
                            <div className="p-2 rounded-lg bg-rose-50">
                                <Sparkles className="h-4 w-4 text-rose-600" />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display text-rose-600">{avgProgress}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Average completion</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="card-hover">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                                <Target className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No savings goals yet</h3>
                            <p className="text-muted-foreground mb-6 text-center max-w-sm">
                                Create your first goal and start tracking your progress towards financial freedom
                            </p>
                            <Button
                                onClick={openAddModal}
                                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Goal
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence>
                        {goals.map((goal, index) => {
                            const colorClasses = getColorClasses(goal.color);
                            const progress = calculateProgress(goal.current_amount, goal.target_amount);
                            const isCompleted = progress >= 100;

                            return (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className={`card-hover overflow-hidden ${isCompleted ? 'ring-2 ring-emerald-400' : ''}`}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center text-2xl shadow-md`}>
                                                        {goal.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800">{goal.name}</h3>
                                                        {goal.deadline && (
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(goal.deadline).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditModal(goal)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(goal.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Circle */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="relative w-16 h-16">
                                                    <svg className="w-16 h-16 -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                                                        <circle
                                                            cx="32" cy="32" r="28"
                                                            stroke={isCompleted ? '#10b981' : 'hsl(var(--primary))'}
                                                            strokeWidth="6" fill="none"
                                                            strokeDasharray={`${progress * 1.76} 176`}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-500"
                                                        />
                                                    </svg>
                                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                                        {progress}%
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-slate-500">Saved</span>
                                                        <span className="font-semibold">${(goal.current_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500">Target</span>
                                                        <span className="font-semibold">${(goal.target_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isCompleted && (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium">
                                                    <Trophy className="h-4 w-4" />
                                                    Goal Completed! 🎉
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add/Edit Goal Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                                </h2>
                                <p className="text-sm text-slate-500 font-normal">
                                    {editingGoal ? 'Update your savings goal' : 'Set a new savings target'}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        {/* Icon Selection */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Choose Icon</label>
                            <div className="flex flex-wrap gap-2">
                                {GOAL_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.icon === icon
                                            ? 'bg-primary/10 ring-2 ring-primary scale-110'
                                            : 'bg-slate-100 hover:bg-slate-200'
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Choose Color</label>
                            <div className="flex gap-2">
                                {GOAL_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setFormData({ ...formData, color: color.name })}
                                        className={`w-8 h-8 rounded-full ${color.bg} transition-all ${formData.color === color.name
                                            ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                                            : 'hover:scale-105'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Goal Name */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Goal Name *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Dream Vacation"
                                className="h-11 bg-slate-50 border-slate-200 focus:border-primary"
                            />
                        </div>

                        {/* Amounts */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Target Amount *</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                        placeholder="5000"
                                        className="h-11 pl-9 bg-slate-50 border-slate-200 focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Already Saved</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={formData.current_amount}
                                        onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                        placeholder="0"
                                        className="h-11 pl-9 bg-slate-50 border-slate-200 focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Target Date (Optional)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="h-11 pl-9 bg-slate-50 border-slate-200 focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-11 border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                            >
                                {editingGoal ? 'Update Goal' : 'Create Goal'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GoalsPage;
