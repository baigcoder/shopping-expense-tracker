// Gen Z Dashboard Page - Ultra Clean with Dynamic Data
import { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, TrendingUp, Sparkles, Zap, AlertTriangle, Target, Flame, ArrowRight, CreditCard as CardIcon, X, Copy, Check, Eye, Lock, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore, useModalStore, useCardStore, CardBrand, Card } from '../store/useStore';
import { formatCurrency, formatCompact, getCurrencyCode } from '../services/currencyService';
import { budgetService, Budget } from '../services/budgetService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { getThemeById, cardService } from '../services/cardService';
import styles from './DashboardPage.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// Professional card brand gradients
const getBrandGradient = (brand: CardBrand | string): string => {
    switch (brand) {
        case 'visa':
            return 'linear-gradient(135deg, #1a1f71 0%, #2d3c8a 50%, #1a1f71 100%)';
        case 'mastercard':
            return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        case 'amex':
            return 'linear-gradient(135deg, #006fcf 0%, #0087d7 50%, #00a3e0 100%)';
        case 'discover':
            return 'linear-gradient(135deg, #ff6000 0%, #ff8c00 50%, #ff6000 100%)';
        case 'paypal':
            return 'linear-gradient(135deg, #003087 0%, #009cde 100%)';
        case 'jcb':
            return 'linear-gradient(135deg, #0865a8 0%, #1a3d5c 100%)';
        case 'unionpay':
            return 'linear-gradient(135deg, #02798b 0%, #065a6b 100%)';
        default:
            return 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)';
    }
};

// Card Details Modal Component for Dashboard
interface CardDetailsModalProps {
    card: Card;
    isOpen: boolean;
    onClose: () => void;
}

const DashboardCardModal = ({ card, isOpen, onClose }: CardDetailsModalProps) => {
    const { user } = useAuthStore();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [cvvRevealed, setCvvRevealed] = useState(false);
    const [pin, setPin] = useState('');
    const [showPinInput, setShowPinInput] = useState(false);
    const [pinError, setPinError] = useState('');
    const [cvvExpiresAt, setCvvExpiresAt] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        if (!cvvRevealed || !cvvExpiresAt) return;
        const updateTimer = () => {
            const remaining = Math.max(0, Math.floor((cvvExpiresAt - Date.now()) / 1000));
            setRemainingTime(remaining);
            if (remaining <= 0) {
                setCvvRevealed(false);
                setCvvExpiresAt(null);
                toast.info('CVV hidden for security 🔒');
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [cvvRevealed, cvvExpiresAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success(`${field} copied! 📋`);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    const handleRevealCVV = () => {
        if (cvvRevealed) return;
        setShowPinInput(true);
    };

    const handlePinSubmit = () => {
        if (pin === card.pin) {
            setCvvRevealed(true);
            setShowPinInput(false);
            setCvvExpiresAt(Date.now() + 5 * 60 * 1000);
            setPin('');
            setPinError('');
            toast.success('CVV revealed for 5 minutes! 🔓');
        } else {
            setPinError('Incorrect PIN');
            setPin('');
        }
    };

    const handleClose = () => {
        setShowPinInput(false);
        setPin('');
        setPinError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className={styles.cardModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
        >
            <motion.div
                className={styles.cardDetailsModal}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.modalCloseBtn} onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className={styles.modalCardPreview} style={{ background: getBrandGradient(card.type) }}>
                    <div className={styles.cardShine}></div>
                    <div className={styles.modalCardTop}>
                        <div className={styles.cardChip}></div>
                        <span className={styles.modalCardBrand}>{card.type.toUpperCase()}</span>
                    </div>
                    <div className={styles.modalCardNumber}>{card.number}</div>
                    <div className={styles.modalCardInfo}>
                        <div>
                            <span className={styles.cardLabel}>HOLDER</span>
                            <span className={styles.cardValue}>{card.holder || user?.name}</span>
                        </div>
                        <div>
                            <span className={styles.cardLabel}>EXP</span>
                            <span className={styles.cardValue}>{card.expiry}</span>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showPinInput && (
                        <motion.div
                            className={styles.pinInputSection}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className={styles.pinLabel}>
                                <Lock size={16} /> Enter PIN to reveal CVV
                            </div>
                            <div className={styles.pinInputRow}>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="••••"
                                    className={styles.pinInput}
                                    autoFocus
                                />
                                <button
                                    className={styles.pinSubmitBtn}
                                    onClick={handlePinSubmit}
                                    disabled={pin.length < 4}
                                >
                                    Reveal
                                </button>
                            </div>
                            {pinError && <span className={styles.pinError}>{pinError}</span>}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={styles.cardDetailsList}>
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}><CardIcon size={16} /> Card Number</div>
                        <div className={styles.detailValue}>
                            <span>{card.number}</span>
                            <button className={styles.copyBtn} onClick={() => copyToClipboard(card.number.replace(/\s/g, ''), 'Card number')}>
                                {copiedField === 'Card number' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}><Shield size={16} /> Holder</div>
                        <div className={styles.detailValue}>
                            <span>{card.holder || user?.name}</span>
                            <button className={styles.copyBtn} onClick={() => copyToClipboard(card.holder || user?.name || '', 'Holder')}>
                                {copiedField === 'Holder' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}><Clock size={16} /> Expiry</div>
                        <div className={styles.detailValue}>
                            <span>{card.expiry}</span>
                            <button className={styles.copyBtn} onClick={() => copyToClipboard(card.expiry, 'Expiry')}>
                                {copiedField === 'Expiry' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}><Lock size={16} /> CVV</div>
                        <div className={styles.detailValue}>
                            {cvvRevealed ? (
                                <>
                                    <span className={styles.cvvRevealed}>{card.cvv}</span>
                                    <span className={styles.cvvTimer}><Clock size={12} /> {formatTime(remainingTime)}</span>
                                    <button className={styles.copyBtn} onClick={() => copyToClipboard(card.cvv, 'CVV')}>
                                        {copiedField === 'CVV' ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className={styles.cvvHidden}>•••</span>
                                    <button className={styles.revealCvvBtn} onClick={handleRevealCVV}>
                                        <Eye size={14} /> Reveal
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className={styles.copyAllBtn}
                    onClick={() => {
                        const text = `Card: ${card.number}\nHolder: ${card.holder || user?.name}\nExpiry: ${card.expiry}${cvvRevealed ? `\nCVV: ${card.cvv}` : ''}`;
                        copyToClipboard(text, 'All details');
                    }}
                >
                    <Copy size={16} /> Copy All Details
                </button>
            </motion.div>
        </motion.div>
    );
};

// Animated Progress Bar Component
const AnimatedBar = ({ value, maxValue, label, sublabel, color = '#000', delay = 0 }: {
    value: number; maxValue: number; label: string; sublabel: string; color?: string; delay?: number;
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
        <div className={styles.progressItem}>
            <div className={styles.progressHeader}>
                <span className={styles.progressValue}>{formatCompact(value)}</span>
            </div>
            <div className={styles.progressBarTrack}>
                <motion.div
                    className={styles.progressBarFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay, ease: "easeOut" }}
                    style={{ backgroundColor: color }}
                />
            </div>
            <span className={styles.progressLabel}>{sublabel}</span>
        </div>
    );
};

// Sparkline Chart Component
const SparklineChart = ({ data, color = '#10B981' }: { data: number[]; color?: string }) => {
    if (data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg className={styles.sparkline} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
            <polygon fill={`url(#gradient-${color})`} points={`0,100 ${points} 100,100`} />
        </svg>
    );
};

// Gauge Component
const GaugeChart = ({ percentage, color = '#FF6B6B' }: { percentage: number; color?: string }) => {
    const radius = 80;
    const circumference = Math.PI * radius;
    const progress = (percentage / 100) * circumference;

    return (
        <div className={styles.gaugeContainer}>
            <svg viewBox="0 0 200 120" className={styles.gaugeSvg}>
                <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#E5E7EB" strokeWidth="20" strokeLinecap="round" />
                <motion.path
                    d="M20,100 A80,80 0 0,1 180,100"
                    fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className={styles.gaugeEmoji}>💸</div>
        </div>
    );
};

const DashboardPage = () => {
    const { user } = useAuthStore();
    const { openAddCard } = useModalStore();
    const { cards } = useCardStore();

    const [budgetAlerts, setBudgetAlerts] = useState<string[]>([]);
    const [transactions, setTransactions] = useState<SupabaseTransaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [txData, budgetData] = await Promise.all([
                    supabaseTransactionService.getAll(user.id),
                    budgetService.getAll(user.id)
                ]);

                setTransactions(txData);
                setBudgets(budgetData);
                setLastUpdate(new Date());

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const spending: Record<string, number> = {};
                txData.forEach(t => {
                    const d = new Date(t.date);
                    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense') {
                        const cat = t.category || 'Uncategorized';
                        spending[cat] = (spending[cat] || 0) + t.amount;
                    }
                });

                const alerts = budgetData
                    .filter(b => (spending[b.category] || 0) > b.amount)
                    .map(b => b.category);
                setBudgetAlerts(alerts);
            } catch (e) {
                console.error("Dashboard data fetch failed", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const pollInterval = setInterval(async () => {
            if (!isMonitoring) return;
            try {
                const txData = await supabaseTransactionService.getAll(user.id);
                if (txData.length !== transactions.length) {
                    setTransactions(txData);
                    setLastUpdate(new Date());
                }
            } catch (e) {
                console.log('Polling error:', e);
            }
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [user, isMonitoring]);

    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        let currentMonthExpense = 0, currentMonthIncome = 0, lastMonthExpense = 0, lastMonthIncome = 0;
        const dailySpending: Record<number, number> = {};

        transactions.forEach(t => {
            const d = new Date(t.date);
            const tMonth = d.getMonth();
            const tYear = d.getFullYear();

            if (tMonth === currentMonth && tYear === currentYear) {
                if (t.type === 'expense') {
                    currentMonthExpense += t.amount;
                    const day = d.getDate();
                    dailySpending[day] = (dailySpending[day] || 0) + t.amount;
                } else {
                    currentMonthIncome += t.amount;
                }
            } else if (tMonth === lastMonth && tYear === lastMonthYear) {
                if (t.type === 'expense') lastMonthExpense += t.amount;
                else lastMonthIncome += t.amount;
            }
        });

        const totalBudgetGoal = budgets.reduce((sum, b) => sum + b.amount, 0) || 50000;
        const last7Days: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const day = now.getDate() - i;
            last7Days.push(dailySpending[day] || 0);
        }

        const expenseChange = lastMonthExpense > 0 ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
        const incomeChange = lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
        const balance = currentMonthIncome - currentMonthExpense;
        const budgetUsedPercent = (currentMonthExpense / totalBudgetGoal) * 100;

        return { currentMonthExpense, currentMonthIncome, lastMonthExpense, lastMonthIncome, totalBudgetGoal, balance, expenseChange, incomeChange, budgetUsedPercent, sparklineData: last7Days };
    }, [transactions, budgets]);

    const recentTx = useMemo(() => {
        return transactions.slice(0, 5).map(t => ({
            id: t.id, name: t.description, amount: t.type === 'expense' ? -t.amount : t.amount, category: t.category, date: t.date
        }));
    }, [transactions]);

    const getCategoryIcon = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'food': return '🍔';
            case 'transport': case 'transportation': return '🚗';
            case 'shopping': return '🛍️';
            case 'entertainment': return '🎮';
            case 'bills': case 'utilities': return '📱';
            case 'salary': case 'income': return '💰';
            default: return '💳';
        }
    };

    return (
        <div className={styles.container}>
            {/* Card Details Modal */}
            <AnimatePresence>
                {selectedCard && (
                    <DashboardCardModal
                        card={selectedCard}
                        isOpen={true}
                        onClose={() => setSelectedCard(null)}
                    />
                )}
            </AnimatePresence>

            {/* Top Row: Greeting + Add Button */}
            <div className={styles.pageHeader}>
                <div className={styles.greeting}>
                    <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        Yo, {user?.name?.split(' ')[0] || 'Fam'}! 👋
                    </motion.h1>
                    <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        Money moves only. Let's get it! 🚀
                    </motion.p>
                    <motion.div className={styles.liveMonitor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <span className={`${styles.liveDot} ${isMonitoring ? styles.active : ''}`}></span>
                        <span className={styles.liveText}>
                            {isMonitoring ? 'Live Monitoring' : 'Paused'}
                            {lastUpdate && <span className={styles.lastUpdate}> • {lastUpdate.toLocaleTimeString()}</span>}
                        </span>
                    </motion.div>
                </div>
                <motion.button className={styles.addBtn} onClick={openAddCard} whileHover={{ rotate: -2, scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Plus size={20} /> New Card
                </motion.button>
            </div>

            {/* Budget Alert Banner */}
            <AnimatePresence>
                {budgetAlerts.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.alertBanner}>
                        <AlertTriangle size={24} />
                        <div>
                            <div className={styles.alertTitle}>Budget Alert 🚨</div>
                            <div>You've exceeded limits for: {budgetAlerts.join(', ')}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Bento Grid */}
            <div className={styles.bentoGrid}>
                {/* Column 1 */}
                <div className={styles.column}>
                    <motion.div className={`${styles.card} ${styles.incomeCard}`} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>In tha Bank 💰</span>
                            <Link to="/transactions" className={styles.viewDetails}>History &gt;</Link>
                        </div>
                        <div className={styles.incomeAmount}>
                            {loading ? '...' : formatCurrency(metrics.currentMonthIncome)}
                            <span className={`${styles.badge} ${metrics.incomeChange >= 0 ? styles.badgePositive : styles.badgeNegative}`}>
                                {metrics.incomeChange >= 0 ? '+' : ''}{metrics.incomeChange.toFixed(1)}% {metrics.incomeChange >= 0 ? '📈' : '📉'}
                            </span>
                        </div>
                        <div className={styles.chartWrapper}>
                            <SparklineChart data={metrics.sparklineData} color="#10B981" />
                        </div>
                    </motion.div>

                    <motion.div className={`${styles.card} ${styles.spendingVibeCard}`} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>SPENDING VIBE</span>
                            <Link to="/expenses" className={styles.viewDetails}>Deetz &gt;</Link>
                        </div>
                        <div className={styles.vibeHero}>
                            <div className={styles.vibeAmount}>{loading ? '...' : formatCompact(metrics.currentMonthExpense)}</div>
                            <span className={styles.vibeSubtitle}>Monthly Burn <Flame size={18} className={styles.flameIcon} /></span>
                        </div>
                        <div className={styles.progressBars}>
                            <AnimatedBar value={metrics.lastMonthExpense} maxValue={Math.max(metrics.lastMonthExpense, metrics.currentMonthExpense, metrics.totalBudgetGoal)} label={formatCompact(metrics.lastMonthExpense)} sublabel="LAST" color="#000" delay={0.3} />
                            <AnimatedBar value={metrics.currentMonthExpense} maxValue={Math.max(metrics.lastMonthExpense, metrics.currentMonthExpense, metrics.totalBudgetGoal)} label={formatCompact(metrics.currentMonthExpense)} sublabel="NOW" color="#000" delay={0.5} />
                            <AnimatedBar value={metrics.totalBudgetGoal} maxValue={Math.max(metrics.lastMonthExpense, metrics.currentMonthExpense, metrics.totalBudgetGoal)} label={formatCompact(metrics.totalBudgetGoal)} sublabel="GOAL" color="#000" delay={0.7} />
                        </div>
                    </motion.div>
                </div>

                {/* Column 2 */}
                <div className={styles.column}>
                    <motion.div className={`${styles.card} ${styles.stashCard}`} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Stash 🏦</span>
                            <Link to="/analytics" className={styles.viewDetails}>More &gt;</Link>
                        </div>
                        <GaugeChart percentage={Math.min(metrics.budgetUsedPercent, 100)} color={metrics.budgetUsedPercent > 80 ? '#EF4444' : '#10B981'} />
                        <div className={styles.stashValue}>
                            <h2>{loading ? '...' : formatCurrency(metrics.balance)}</h2>
                            <p>Avail Balance</p>
                        </div>
                    </motion.div>

                    <motion.div className={`${styles.card} ${styles.cashFlowCard}`} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Cash Flow 🌊</span>
                            <div className={styles.flowBadge}>{metrics.expenseChange <= 0 ? '+' : '-'}{Math.abs(metrics.expenseChange).toFixed(0)}%</div>
                        </div>
                        <div className={styles.cashFlowAmount}>
                            <h2>{loading ? '...' : formatCurrency(metrics.currentMonthIncome - metrics.currentMonthExpense)}</h2>
                        </div>
                        <div className={styles.chartWrapper}>
                            <SparklineChart data={metrics.sparklineData} color="#3B82F6" />
                        </div>
                    </motion.div>
                </div>

                {/* Column 3 - Cards & Transactions */}
                <motion.div className={`${styles.card} ${styles.financesCard}`} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>My Cards 💳</span>
                        <button className={styles.addCardBtn} onClick={openAddCard}><Plus size={16} /></button>
                    </div>

                    <div className={styles.cardsScrollWrapper}>
                        <div className={styles.cardsScroll}>
                            {cards.length > 0 ? (
                                cards.map((card, index) => {
                                    const theme = getThemeById(card.theme);
                                    return (
                                        <motion.div
                                            key={card.id}
                                            className={styles.scrollCard}
                                            style={{ background: theme.gradient }}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            onClick={() => setSelectedCard(card)}
                                        >
                                            <div className={styles.cardShine}></div>
                                            <div className={styles.cardTop}>
                                                <div className={styles.cardChip}></div>
                                                <div className={styles.cardBrandName}>{card.type.toUpperCase()}</div>
                                            </div>
                                            <div className={styles.cardNumber}>{card.number}</div>
                                            <div className={styles.cardBottom}>
                                                <div>
                                                    <span className={styles.cardLabel}>HOLDER</span>
                                                    <span className={styles.cardValue}>{card.holder || user?.name}</span>
                                                </div>
                                                <div>
                                                    <span className={styles.cardLabel}>EXP</span>
                                                    <span className={styles.cardValue}>{card.expiry}</span>
                                                </div>
                                            </div>
                                            <div className={styles.cardClickHint}>
                                                <Eye size={14} /> View Details
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className={styles.emptyCardScroll} onClick={openAddCard}>
                                    <Wallet size={32} />
                                    <span>Add Card</span>
                                </div>
                            )}
                            {cards.length > 0 && (
                                <motion.div className={styles.addMoreCard} onClick={openAddCard} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Plus size={24} />
                                    <span>Add</span>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className={styles.recentTransactions}>
                        <h4>Recent Drops</h4>
                        {loading ? (
                            <div className={styles.loadingTx}>Loading...</div>
                        ) : recentTx.length === 0 ? (
                            <div className={styles.emptyTx}>No transactions yet</div>
                        ) : (
                            recentTx.map((tx) => (
                                <motion.div key={tx.id} className={styles.transactionItem} whileHover={{ x: 4 }}>
                                    <div className={styles.txLeft}>
                                        <div className={styles.txIcon}>{getCategoryIcon(tx.category)}</div>
                                        <span className={styles.txName}>{tx.name}</span>
                                    </div>
                                    <span className={`${styles.txAmount} ${tx.amount >= 0 ? styles.txPositive : styles.txNegative}`}>
                                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                                    </span>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <Link to="/transactions" className={styles.seeAllBtn}>
                        See All <ArrowRight size={16} />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardPage;
