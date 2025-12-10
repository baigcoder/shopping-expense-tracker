// Dashboard - Fully Dynamic GenZ Real-time Dashboard
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Plus, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
    CreditCard, Eye, EyeOff, Lock, ChevronRight, Target, Calendar, Zap,
    AlertTriangle, CheckCircle, Clock, Flame, Trophy, Bell, Trash2
} from 'lucide-react';
import { useAuthStore, useCardStore, useModalStore } from '../store/useStore';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { budgetService, Budget } from '../services/budgetService';
import { goalService, Goal } from '../services/goalService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { streakService, StreakData } from '../services/streakService';
import { useNotificationStore, notificationTriggers } from '../services/notificationService';
import { formatCurrency } from '../services/currencyService';
import { cardService, getThemeById } from '../services/cardService';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import UpcomingBills from '../components/UpcomingBills';
import DarkPatternShield from '../components/DarkPatternShield';
import QuickAddTransaction from '../components/QuickAddTransaction';
import styles from './DashboardPage.module.css';

// Format helper
const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return formatCurrency(num);
};

// --- COMPONENTS ---

// Hero Balance Card
const HeroCard = ({ balance, income, expense, loading }: {
    balance: number;
    income: number;
    expense: number;
    loading: boolean;
}) => {
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const badge = savingsRate >= 20 ? '💰 RICH' : savingsRate >= 10 ? '💪 SAVING' : '😅 SPENDING';

    return (
        <motion.div
            className={styles.heroCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.heroTop}>
                <span className={styles.heroLabel}>Total Balance</span>
                <motion.span
                    className={styles.heroBadge}
                    whileHover={{ scale: 1.1 }}
                >
                    {badge}
                </motion.span>
            </div>
            <h1 className={styles.heroAmount}>
                {loading ? '---' : formatCurrency(balance)}
            </h1>
            <div className={styles.heroStats}>
                <div className={styles.statItem}>
                    <ArrowUpRight size={16} className={styles.statIconUp} />
                    <div>
                        <span>Income</span>
                        <strong>{loading ? '...' : formatCompact(income)}</strong>
                    </div>
                </div>
                <div className={styles.statItem}>
                    <ArrowDownRight size={16} className={styles.statIconDown} />
                    <div>
                        <span>Expenses</span>
                        <strong>{loading ? '...' : formatCompact(expense)}</strong>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Spending Chart Card
const SpendingChart = ({ data, loading }: { data: { day: string; amount: number }[]; loading: boolean }) => (
    <motion.div
        className={styles.chartCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
    >
        <div className={styles.chartHeader}>
            <div>
                <h3>Weekly Vibe Check</h3>
                <span className={styles.chartSubtitle}>Last 7 days spending</span>
            </div>
            <div className={styles.liveBadge}>
                <span className={styles.liveDot}></span>
                LIVE
            </div>
        </div>
        <div className={styles.chartContainer}>
            {loading ? (
                <div className={styles.chartLoading}>Loading chart...</div>
            ) : (
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="50%" stopColor="#EC4899" />
                                <stop offset="100%" stopColor="#FBBF24" />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }}
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#000',
                                border: '2px solid #333',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                                boxShadow: '4px 4px 0 #8B5CF6'
                            }}
                            itemStyle={{ color: '#FBBF24', fontWeight: 800 }}
                            formatter={(value: number) => [`Rs ${value.toFixed(0)}`, 'SPENT']}
                            cursor={{ stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="url(#strokeGradient)"
                            strokeWidth={4}
                            fill="url(#neonGradient)"
                            animationDuration={2000}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    </motion.div>
);

// Quick Stats Row - Now Dynamic
// Quick Stats Row - Now Dynamic & Animated
const QuickStats = ({ streak, budgetUsed, loading }: { streak: number; budgetUsed: number; loading: boolean }) => (
    <div className={styles.quickStats}>
        {/* Streak Card - Yellow/Orange */}
        <motion.div
            className={`${styles.quickStatCard} ${styles.streakCard}`}
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
        >
            <div className={styles.cardIcon}>
                <Flame size={40} />
            </div>
            <div>
                <motion.strong
                    key={`streak-${streak}`} // Triggers animation on change
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                    {loading ? '...' : streak}
                </motion.strong>
                <span>Day Streak</span>
            </div>
        </motion.div>

        {/* Budget Card - White */}
        <motion.div
            className={`${styles.quickStatCard} ${styles.budgetCard}`}
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={styles.cardIcon}>
                <TrendingUp size={24} />
            </div>
            <div>
                <motion.strong
                    key={`budget-${budgetUsed}`} // Triggers animation on change
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                    {loading ? '...' : `${budgetUsed}%`}
                </motion.strong>
                <span>Budget Used</span>
            </div>
        </motion.div>
    </div>
);

// Category Pie Chart Component
// Category Pie Chart Component
const CategoryChart = ({ transactions, loading }: { transactions: SupabaseTransaction[]; loading: boolean }) => {
    const data = useMemo(() => {
        const categories: Record<string, number> = {};
        if (!transactions || transactions.length === 0) return [];

        transactions.forEach(t => {
            const catName = t.category || 'Other';
            categories[catName] = (categories[catName] || 0) + Math.abs(Number(t.amount));
        });
        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [transactions]);

    // Gen Z Neon Palette 🎨
    const COLORS = ['#A3E635', '#F472B6', '#22D3EE', '#FBBF24', '#C084FC'];

    const totalSpending = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.value, 0);
    }, [data]);

    if (loading) {
        return (
            <motion.div className={styles.chartCard} style={{ marginTop: '1.25rem' }}>
                <div className={styles.chartLoading}>Loading categories...</div>
            </motion.div>
        );
    }

    if (data.length === 0) return null;

    return (
        <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginTop: '1.25rem' }}
        >
            <div className={styles.chartHeader}>
                <div>
                    <h3>Spending DNA 🧬</h3>
                    <span className={styles.chartSubtitle}>Top Categories</span>
                </div>
            </div>

            <div className={styles.chartContainer} style={{ height: '220px', position: 'relative' }}>
                {/* Center Total Label */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>TOTAL</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000', fontFamily: 'Space Grotesk' }}>
                        Rs {totalSpending < 1000 ? totalSpending : `${(totalSpending / 1000).toFixed(1)}k`}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={3}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: '#fff',
                                border: '3px solid #000',
                                borderRadius: '8px',
                                color: '#000',
                                boxShadow: '4px 4px 0 #000',
                                fontWeight: 800,
                                fontFamily: 'Outfit',
                                padding: '8px 12px'
                            }}
                            itemStyle={{ color: '#000', fontSize: '0.9rem' }}
                            formatter={(value: number) => `Rs ${value.toFixed(0)}`}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                paddingTop: '10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#000',
                                fontFamily: 'JetBrains Mono',
                                textTransform: 'uppercase'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

// Goals Progress Card - NEW
const GoalsProgress = ({ goals, loading }: { goals: Goal[]; loading: boolean }) => {
    if (loading) {
        return (
            <motion.div className={styles.goalsCard}>
                <div className={styles.chartLoading}>Loading goals...</div>
            </motion.div>
        );
    }

    if (goals.length === 0) {
        return (
            <motion.div
                className={styles.goalsCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.sectionHeader}>
                    <h3><Target size={18} /> Goals</h3>
                    <Link to="/goals" className={styles.seeAllLink}>Add Goal</Link>
                </div>
                <div className={styles.emptyState}>
                    <span>🎯</span>
                    <p>No goals yet. Start saving!</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.goalsCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.sectionHeader}>
                <h3><Target size={18} /> Goals</h3>
                <Link to="/goals" className={styles.seeAllLink}>See All</Link>
            </div>
            <div className={styles.goalsList}>
                {goals.slice(0, 3).map(goal => {
                    const progress = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
                    return (
                        <div key={goal.id} className={styles.goalItem}>
                            <div className={styles.goalIcon}>{goal.icon}</div>
                            <div className={styles.goalInfo}>
                                <div className={styles.goalTop}>
                                    <strong>{goal.name}</strong>
                                    <span>{progress}%</span>
                                </div>
                                <div className={styles.goalProgress}>
                                    <motion.div
                                        className={styles.goalProgressFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        style={{ background: progress >= 100 ? '#10B981' : '#8B5CF6' }}
                                    />
                                </div>
                                <span className={styles.goalAmount}>
                                    {formatCurrency(goal.saved)} / {formatCurrency(goal.target)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

// Budget Alerts Card - NEW
const BudgetAlerts = ({ budgets, transactions, loading }: {
    budgets: Budget[];
    transactions: SupabaseTransaction[];
    loading: boolean
}) => {
    const alerts = useMemo(() => {
        if (!budgets.length || !transactions.length) return [];

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Get this month's transactions
        const monthTransactions = transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });

        // Calculate spending per category
        const categorySpending: Record<string, number> = {};
        monthTransactions.forEach(t => {
            const cat = t.category || 'Other';
            categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(t.amount);
        });

        // Check against budgets
        return budgets.map(budget => {
            const spent = categorySpending[budget.category] || 0;
            const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
            return {
                category: budget.category,
                spent,
                limit: budget.amount,
                percent,
                status: percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'safe'
            };
        }).filter(a => a.percent >= 50).sort((a, b) => b.percent - a.percent);
    }, [budgets, transactions]);

    if (loading) {
        return (
            <motion.div className={styles.alertsCard}>
                <div className={styles.chartLoading}>Checking budgets...</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.alertsCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.sectionHeader}>
                <h3><AlertTriangle size={18} /> Budget Pulse</h3>
                <Link to="/budgets" className={styles.seeAllLink}>Manage</Link>
            </div>
            {alerts.length === 0 ? (
                <div className={styles.alertSuccess}>
                    <CheckCircle size={24} color="#10B981" />
                    <p>All budgets looking healthy! 💪</p>
                </div>
            ) : (
                <div className={styles.alertsList}>
                    {alerts.slice(0, 3).map((alert, i) => (
                        <motion.div
                            key={alert.category}
                            className={`${styles.alertItem} ${styles[alert.status]}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className={styles.alertIcon}>
                                {alert.status === 'exceeded' ? '🚨' : '⚠️'}
                            </div>
                            <div className={styles.alertInfo}>
                                <strong>{alert.category}</strong>
                                <span>{formatCurrency(alert.spent)} / {formatCurrency(alert.limit)}</span>
                            </div>
                            <div className={`${styles.alertBadge} ${styles[alert.status]}`}>
                                {alert.percent}%
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// Subscriptions Preview Card - NEW
const SubscriptionsPreview = ({ subscriptions, loading }: { subscriptions: Subscription[]; loading: boolean }) => {
    const activeCount = subscriptions.filter(s => s.is_active).length;
    const monthlyTotal = subscriptions
        .filter(s => s.is_active)
        .reduce((sum, s) => {
            if (s.cycle === 'yearly') return sum + s.price / 12;
            if (s.cycle === 'weekly') return sum + s.price * 4;
            return sum + s.price;
        }, 0);

    const expiringSoon = subscriptions.filter(s => {
        if (!s.trial_end_date) return false;
        const daysRemaining = Math.ceil((new Date(s.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 0 && daysRemaining <= 7;
    });

    if (loading) {
        return (
            <motion.div className={styles.subsCard}>
                <div className={styles.chartLoading}>Loading subscriptions...</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.subsCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.sectionHeader}>
                <h3><Calendar size={18} /> Subscriptions</h3>
                <Link to="/subscriptions" className={styles.seeAllLink}>Manage</Link>
            </div>
            <div className={styles.subsStats}>
                <div className={styles.subsStat}>
                    <strong>{activeCount}</strong>
                    <span>Active</span>
                </div>
                <div className={styles.subsStat}>
                    <strong>{formatCurrency(monthlyTotal)}</strong>
                    <span>/month</span>
                </div>
            </div>
            {expiringSoon.length > 0 && (
                <div className={styles.trialAlert}>
                    <Clock size={16} />
                    <span>{expiringSoon.length} trial{expiringSoon.length > 1 ? 's' : ''} expiring soon!</span>
                </div>
            )}
        </motion.div>
    );
};

// Credit Card Mini
interface CardMiniProps {
    card: {
        id: string;
        theme?: string;
        number?: string;
    };
    onClick: () => void;
}

const CardMini = ({ card, onClick }: CardMiniProps) => {
    const theme = getThemeById(card.theme || 'default');
    const last4 = card.number?.slice(-4) || '****';

    return (
        <motion.div
            className={styles.cardMini}
            style={{ background: theme.gradient }}
            onClick={onClick}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className={styles.cardMiniTop}>
                <span>{theme.name?.split(' ')[0] || 'Card'}</span>
                <CreditCard size={16} />
            </div>
            <div className={styles.cardMiniNumber}>•••• {last4}</div>
        </motion.div>
    );
};

// Cards Section
interface CardsSectionProps {
    cards: any[];
    onAddCard: () => void;
    onSelectCard: (card: any) => void;
}

const CardsSection = ({ cards, onAddCard, onSelectCard }: CardsSectionProps) => (
    <motion.div
        className={styles.cardsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
    >
        <div className={styles.sectionHeader}>
            <h3><Wallet size={18} /> My Cards</h3>
            <button onClick={onAddCard} className={styles.addBtn}>
                <Plus size={16} />
            </button>
        </div>
        <div className={styles.cardsGrid}>
            {cards.length === 0 ? (
                <div className={styles.emptyCard} onClick={onAddCard}>
                    <Plus size={24} />
                    <span>Add Card</span>
                </div>
            ) : (
                cards.slice(0, 3).map((card) => (
                    <CardMini
                        key={card.id}
                        card={card}
                        onClick={() => onSelectCard(card)}
                    />
                ))
            )}
        </div>
        {cards.length > 0 && (
            <Link to="/cards" className={styles.viewAllLink}>
                {cards.length > 3 ? `View all ${cards.length} cards` : 'Manage Cards'} <ChevronRight size={14} />
            </Link>
        )}
    </motion.div>
);

// Transaction Item
const TransactionItem = ({ tx }: { tx: SupabaseTransaction }) => {
    const category = tx.category?.toLowerCase() || '';
    const emoji = category.includes('food') ? '🍔' :
        category.includes('coffee') ? '☕' :
            category.includes('shopping') ? '🛍️' :
                category.includes('transport') ? '🚗' :
                    category.includes('entertainment') ? '🎮' : '💳';

    return (
        <motion.div
            className={styles.txItem}
            whileHover={{ x: 4 }}
        >
            <div className={styles.txIcon}>{emoji}</div>
            <div className={styles.txInfo}>
                <strong>{tx.description || 'Transaction'}</strong>
                <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className={`${styles.txAmount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
            </div>
        </motion.div>
    );
};

// Recent Transactions
const RecentTransactions = ({ transactions, loading }: { transactions: SupabaseTransaction[]; loading: boolean }) => (
    <motion.div
        className={styles.transactionsCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
    >
        <div className={styles.sectionHeader}>
            <h3>Recent Activity</h3>
            <Link to="/transactions" className={styles.seeAllLink}>See all</Link>
        </div>
        <div className={styles.txList}>
            {loading ? (
                <div className={styles.chartLoading}>Loading transactions...</div>
            ) : transactions.length === 0 ? (
                <div className={styles.emptyState}>
                    <span>✨</span>
                    <p>No transactions yet</p>
                </div>
            ) : (
                transactions.slice(0, 7).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} />
                ))
            )}
        </div>
    </motion.div>
);

// Card Detail Modal with PIN Verification & Delete
interface CardModalProps {
    card: any;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

const CardModal = ({ card, onClose, onDelete }: CardModalProps) => {
    const theme = getThemeById(card?.theme || 'default');
    const [showCvv, setShowCvv] = useState(false);
    const [showPinPrompt, setShowPinPrompt] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    if (!card) return null;

    const handleRevealCvv = () => {
        if (showCvv) {
            // Already showing, hide it
            setShowCvv(false);
            return;
        }
        // Show PIN prompt
        setShowPinPrompt(true);
        setPinInput('');
        setPinError('');
    };

    const verifyPin = () => {
        if (!pinInput.trim()) {
            setPinError('Please enter your PIN');
            return;
        }

        // Compare with card's stored PIN
        if (pinInput === card.pin) {
            setShowCvv(true);
            setShowPinPrompt(false);
            setPinInput('');
            setPinError('');

            // Auto-hide CVV after 30 seconds for security
            setTimeout(() => {
                setShowCvv(false);
            }, 30000);
        } else {
            setPinError('Incorrect PIN. Try again.');
            setPinInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            verifyPin();
        }
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modalContent}
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalCard} style={{ background: theme.gradient }}>
                    <div className={styles.modalCardChip}></div>
                    <div className={styles.modalCardType}>{(card.type || 'VISA').toUpperCase()}</div>
                    <div className={styles.modalCardNum}>
                        •••• •••• •••• {card.number?.slice(-4) || '****'}
                    </div>
                    <div className={styles.modalCardBottom}>
                        <div>
                            <span>HOLDER</span>
                            <strong>{(card.holder || 'CARD HOLDER').toUpperCase()}</strong>
                        </div>
                        <div>
                            <span>EXPIRES</span>
                            <strong>{card.expiry || 'MM/YY'}</strong>
                        </div>
                    </div>
                </div>

                {/* PIN Prompt Modal */}
                {showPinPrompt && (
                    <motion.div
                        className={styles.pinPrompt}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.pinHeader}>
                            <Lock size={20} />
                            <span>Enter Card PIN to Reveal CVV</span>
                        </div>
                        <input
                            type="password"
                            className={styles.pinInput}
                            placeholder="••••"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyPress={handleKeyPress}
                            maxLength={6}
                            autoFocus
                        />
                        {pinError && <div className={styles.pinError}>{pinError}</div>}
                        <div className={styles.pinActions}>
                            <button
                                className={styles.pinCancelBtn}
                                onClick={() => {
                                    setShowPinPrompt(false);
                                    setPinInput('');
                                    setPinError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.pinVerifyBtn}
                                onClick={verifyPin}
                                disabled={pinInput.length < 4}
                            >
                                Verify
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className={styles.modalActions}>
                    <button
                        className={styles.cvvBtn}
                        onClick={handleRevealCvv}
                    >
                        {showCvv ? <EyeOff size={18} /> : <Eye size={18} />}
                        {showCvv ? `CVV: ${card.cvv || '***'}` : 'Show CVV'}
                    </button>
                    {onDelete && (
                        <button
                            className={styles.deleteCardBtn}
                            onClick={() => {
                                if (window.confirm('Delete this card permanently?')) {
                                    onDelete(card.id);
                                    onClose();
                                }
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button className={styles.closeBtn} onClick={onClose}>
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// === MAIN DASHBOARD ===
const DashboardPage = () => {
    const { user } = useAuthStore();
    const { removeCard } = useCardStore();
    const { openAddCard } = useModalStore();
    const { addNotification } = useNotificationStore();

    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [userCards, setUserCards] = useState<any[]>([]); // Cards from Supabase
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [metrics, setMetrics] = useState({ balance: 0, income: 0, expense: 0 });
    const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);

    // Load all data including cards from Supabase
    const loadDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Parallel fetch all data including cards from Supabase
            const [txData, budgetData, goalData, subData, streak, cardsData] = await Promise.all([
                supabaseTransactionService.getAll(user.id),
                budgetService.getAll(user.id),
                goalService.getAll(user.id),
                subscriptionService.getAll(user.id),
                streakService.getStreakData(user.id),
                cardService.getAll(user.id) // Fetch cards from Supabase
            ]);

            setTransactions(txData);
            setBudgets(budgetData);
            setGoals(goalData);
            setSubscriptions(subData);
            setStreakData(streak);
            setUserCards(cardsData); // Set cards from Supabase

            // Calculate metrics
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthTx = txData.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            const totalIncome = monthTx
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const totalExpense = monthTx
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            setMetrics({
                balance: totalIncome - totalExpense,
                income: totalIncome,
                expense: totalExpense
            });

            // Generate weekly chart data
            const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            const today = new Date();
            const weekData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = days[date.getDay()];

                const dayTotal = txData
                    .filter(t => t.date === dateStr && t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                weekData.push({ day: dayName, amount: dayTotal });
            }
            setChartData(weekData);

            // Check for budget alerts
            budgetData.forEach(budget => {
                const categorySpent = monthTx
                    .filter(t => t.category === budget.category && t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                const percent = budget.amount > 0 ? Math.round((categorySpent / budget.amount) * 100) : 0;

                if (percent >= 90 && percent < 100) {
                    notificationTriggers.onBudgetAlert(budget.category, percent);
                } else if (percent >= 100) {
                    notificationTriggers.onBudgetAlert(budget.category, percent);
                }
            });

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Handle card deletion from Supabase
    const handleDeleteCard = async (cardId: string) => {
        const success = await cardService.delete(cardId);
        if (success) {
            setUserCards(prev => prev.filter(c => c.id !== cardId));
            removeCard(cardId); // Also remove from local store if present
            // Toast is optional, we already have confirmation dialog
        }
    };

    useEffect(() => {
        loadDashboardData();

        // Listen for real-time transaction updates
        const handleNewTransaction = () => {
            loadDashboardData();
        };

        // Listen for new card added
        const handleNewCard = () => {
            loadDashboardData();
        };

        window.addEventListener('new-transaction', handleNewTransaction);
        window.addEventListener('new-card', handleNewCard);
        return () => {
            window.removeEventListener('new-transaction', handleNewTransaction);
            window.removeEventListener('new-card', handleNewCard);
        };
    }, [loadDashboardData]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const budgetUsedPercent = useMemo(() => {
        if (!budgets.length) return 0;
        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
        return totalBudget > 0 ? Math.round((metrics.expense / totalBudget) * 100) : 0;
    }, [budgets, metrics.expense]);

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1>{greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
                    <p>Here's your financial overview</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={openAddCard} className={styles.headerBtn}>
                        <Wallet size={18} /> Add Card
                    </button>
                    <button
                        onClick={() => setIsQuickAddOpen(true)}
                        className={styles.headerBtnPrimary}
                    >
                        <Plus size={18} /> New Transaction
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className={styles.grid}>
                {/* Left Column */}
                <div className={styles.leftCol}>
                    <HeroCard
                        balance={metrics.balance}
                        income={metrics.income}
                        expense={metrics.expense}
                        loading={loading}
                    />
                    <SpendingChart data={chartData} loading={loading} />

                    {/* Spending DNA + Quick Stats Row */}
                    <div className={styles.dnaStatsRow}>
                        <CategoryChart transactions={transactions.filter(t => t.type === 'expense')} loading={loading} />
                        <div className={styles.quickStatsVert}>
                            <QuickStats streak={streakData?.currentStreak || 0} budgetUsed={budgetUsedPercent} loading={loading} />
                        </div>
                    </div>
                </div>

                {/* Middle Column */}
                <div className={styles.middleCol}>
                    <CardsSection
                        cards={userCards}
                        onAddCard={openAddCard}
                        onSelectCard={setSelectedCard}
                    />
                    <RecentTransactions transactions={transactions} loading={loading} />
                    <GoalsProgress goals={goals} loading={loading} />
                </div>

                {/* Right Column */}
                <div className={styles.rightCol}>
                    <DarkPatternShield compact />
                    <UpcomingBills />
                    <BudgetAlerts budgets={budgets} transactions={transactions} loading={loading} />
                    <SubscriptionsPreview subscriptions={subscriptions} loading={loading} />
                </div>
            </div>

            {/* Card Modal */}
            <AnimatePresence>
                {selectedCard && (
                    <CardModal
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                        onDelete={handleDeleteCard}
                    />
                )}
            </AnimatePresence>

            {/* Quick Add Transaction Modal */}
            <QuickAddTransaction
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />
        </div>
    );
};

export default DashboardPage;
