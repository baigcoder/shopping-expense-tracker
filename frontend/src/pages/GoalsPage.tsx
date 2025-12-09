// Goals Page - Track savings goals with Supabase sync
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Calendar, TrendingUp, X, Wallet, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatCurrency, getCurrencySymbol, getCurrencyInfo } from '../services/currencyService';
import { goalService, Goal } from '../services/goalService';
import { useAuthStore } from '../store/useStore';
import styles from './GoalsPage.module.css';

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];
const GOAL_ICONS = ['🎯', '📱', '💻', '🚗', '🏠', '✈️', '🏖️', '💍', '🎓', '💰', '🛟', '🎮', '👟', '📷', '🎸'];

const GoalsPage = () => {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [fundAmount, setFundAmount] = useState('');
    const [newGoal, setNewGoal] = useState({ name: '', description: '', target: '', icon: '🎯', deadline: '' });
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [saving, setSaving] = useState(false);

    // Load goals from Supabase
    useEffect(() => {
        const loadGoals = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const data = await goalService.getAll(user.id);
                setGoals(data);
            } catch (error) {
                console.error('Error loading goals:', error);
            } finally {
                setLoading(false);
            }
        };

        loadGoals();
    }, [user?.id]);

    useEffect(() => {
        const info = getCurrencyInfo();
        setCurrencySymbol(info.symbol);
    }, []);

    const handleAddGoal = async () => {
        if (!newGoal.name || !newGoal.target || !user?.id) return;

        setSaving(true);
        try {
            const created = await goalService.create({
                user_id: user.id,
                name: newGoal.name,
                description: newGoal.description,
                icon: newGoal.icon,
                target: parseFloat(newGoal.target),
                saved: 0,
                deadline: newGoal.deadline || 'TBD'
            });

            if (created) {
                setGoals([created, ...goals]);
                setNewGoal({ name: '', description: '', target: '', icon: '🎯', deadline: '' });
                setShowModal(false);
                toast.success('New goal added! Let\'s get it! 🎯');
            } else {
                toast.error('Failed to save goal');
            }
        } catch (error) {
            toast.error('Error creating goal');
        } finally {
            setSaving(false);
        }
    };

    const openFundModal = (goal: Goal) => {
        setSelectedGoal(goal);
        setFundAmount('');
        setShowFundModal(true);
    };

    const handleAddFunds = async () => {
        if (!selectedGoal || !fundAmount) return;

        const amount = parseFloat(fundAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            const updated = await goalService.addFunds(selectedGoal.id, amount);

            if (updated) {
                setGoals(goals.map(g => g.id === selectedGoal.id ? updated : g));

                const newTotal = updated.saved;
                const progress = (newTotal / updated.target) * 100;

                if (newTotal >= updated.target) {
                    toast.success(`🎉 Congrats! You've reached your ${selectedGoal.name} goal!`);
                } else {
                    toast.success(`Added ${formatCurrency(amount)} to ${selectedGoal.name}! (${progress.toFixed(0)}% complete)`);
                }
            }
        } catch (error) {
            toast.error('Error adding funds');
        } finally {
            setShowFundModal(false);
            setSelectedGoal(null);
            setFundAmount('');
            setSaving(false);
        }
    };

    const setQuickAmount = (amount: number) => {
        setFundAmount(amount.toString());
    };

    const getProgress = (saved: number, target: number) => {
        return Math.min((saved / target) * 100, 100);
    };

    const getRemaining = (goal: Goal) => {
        return Math.max(goal.target - goal.saved, 0);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={40} className={styles.spinner} />
                    <p>Loading goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerLeft}>
                    <h1>Goals 🎯</h1>
                    <span className={styles.currencyBadge}>{getCurrencyInfo().code}</span>
                </div>
                <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Goal
                </button>
            </motion.div>

            {/* Goals Grid */}
            <div className={styles.goalsGrid}>
                {goals.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Target size={48} />
                        <h3>No goals yet!</h3>
                        <p>Create your first savings goal to start tracking</p>
                        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Create Goal
                        </button>
                    </div>
                ) : (
                    goals.map((goal, index) => {
                        const progress = getProgress(goal.saved, goal.target);
                        const isComplete = progress >= 100;

                        return (
                            <motion.div
                                key={goal.id}
                                className={`${styles.goalCard} ${isComplete ? styles.completed : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {isComplete && (
                                    <span className={styles.completedBadge}>🎉 Done!</span>
                                )}

                                <div className={styles.goalIcon}>{goal.icon}</div>
                                <h3 className={styles.goalName}>{goal.name}</h3>
                                <p className={styles.goalDescription}>{goal.description}</p>

                                <div className={styles.goalProgress}>
                                    <div className={styles.progressHeader}>
                                        <span className={styles.currentAmount}>{formatCurrency(goal.saved)}</span>
                                        <span className={styles.targetAmount}>of {formatCurrency(goal.target)}</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={styles.progressFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, delay: index * 0.1 }}
                                        >
                                            {progress > 15 && (
                                                <span className={styles.progressPercent}>{progress.toFixed(0)}%</span>
                                            )}
                                        </motion.div>
                                    </div>
                                    {!isComplete && (
                                        <p className={styles.remainingText}>
                                            {formatCurrency(getRemaining(goal))} to go
                                        </p>
                                    )}
                                </div>

                                <div className={styles.goalMeta}>
                                    <span className={styles.deadline}>
                                        <Calendar size={14} />
                                        {goal.deadline}
                                    </span>
                                    {!isComplete && (
                                        <button
                                            className={styles.contributeBtn}
                                            onClick={() => openFundModal(goal)}
                                        >
                                            <Wallet size={14} /> Add Funds
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Goal Modal */}
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
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>

                            <h2>New Savings Goal 🎯</h2>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Pick an Icon</label>
                                <div className={styles.iconPicker}>
                                    {GOAL_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`${styles.iconOption} ${newGoal.icon === icon ? styles.selected : ''}`}
                                            onClick={() => setNewGoal({ ...newGoal, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Goal Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g., New Car"
                                    value={newGoal.name}
                                    onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="What are you saving for?"
                                    value={newGoal.description}
                                    onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Target Amount ({currencySymbol})</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        placeholder="1000"
                                        value={newGoal.target}
                                        onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Deadline</label>
                                    <input
                                        type="month"
                                        className={styles.input}
                                        value={newGoal.deadline}
                                        onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleAddGoal} disabled={saving}>
                                    {saving ? <Loader2 size={18} className={styles.spinner} /> : 'Create Goal'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Funds Modal */}
            <AnimatePresence>
                {showFundModal && selectedGoal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFundModal(false)}
                    >
                        <motion.div
                            className={styles.fundModal}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className={styles.closeBtn} onClick={() => setShowFundModal(false)}>
                                <X size={20} />
                            </button>

                            <div className={styles.fundHeader}>
                                <span className={styles.fundIcon}>{selectedGoal.icon}</span>
                                <h2>Add Funds</h2>
                                <p>to {selectedGoal.name}</p>
                            </div>

                            <div className={styles.fundProgress}>
                                <div className={styles.fundProgressInfo}>
                                    <span>{formatCurrency(selectedGoal.saved)}</span>
                                    <span>of {formatCurrency(selectedGoal.target)}</span>
                                </div>
                                <div className={styles.fundProgressBar}>
                                    <div
                                        className={styles.fundProgressFill}
                                        style={{ width: `${getProgress(selectedGoal.saved, selectedGoal.target)}%` }}
                                    />
                                </div>
                                <p className={styles.fundRemaining}>
                                    {formatCurrency(getRemaining(selectedGoal))} remaining
                                </p>
                            </div>

                            <div className={styles.amountInput}>
                                <span className={styles.currencyPrefix}>{currencySymbol}</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={fundAmount}
                                    onChange={e => setFundAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.quickAmounts}>
                                {QUICK_AMOUNTS.map(amount => (
                                    <button
                                        key={amount}
                                        className={`${styles.quickAmount} ${fundAmount === amount.toString() ? styles.selected : ''}`}
                                        onClick={() => setQuickAmount(amount)}
                                    >
                                        {currencySymbol}{amount}
                                    </button>
                                ))}
                            </div>

                            <button
                                className={styles.addFundBtn}
                                onClick={handleAddFunds}
                                disabled={!fundAmount || parseFloat(fundAmount) <= 0 || saving}
                            >
                                {saving ? (
                                    <Loader2 size={18} className={styles.spinner} />
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Add {fundAmount ? formatCurrency(parseFloat(fundAmount)) : 'Funds'}
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GoalsPage;
