// Spending Streak Widget - Gamified Budget Tracking
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, TrendingUp, Zap } from 'lucide-react';
import { streakService, StreakData } from '../services/streakService';
import { formatCurrency } from '../services/currencyService';
import { useAuthStore } from '../store/useStore';
import styles from './SpendingStreak.module.css';

const SpendingStreak = () => {
    const { user } = useAuthStore();
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStreak = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const data = await streakService.getStreakData(user.id);
                setStreakData(data);
            } catch (error) {
                console.error('Error fetching streak:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStreak();
    }, [user?.id]);

    if (loading) {
        return (
            <div className={styles.card}>
                <div className={styles.loading}>🔥 Loading streak...</div>
            </div>
        );
    }

    if (!streakData) {
        return null;
    }

    const { emoji, message } = streakService.getStreakMessage(streakData.currentStreak);
    const level = streakService.getStreakLevel(streakData.currentStreak);
    const progressToNextLevel = level.nextAt === Infinity
        ? 100
        : Math.min(100, (streakData.currentStreak / level.nextAt) * 100);

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Flame size={20} />
                    <h3>Budget Streak</h3>
                </div>
                <div className={styles.levelBadge}>
                    Lvl {level.level}
                </div>
            </div>

            <div className={styles.streakDisplay}>
                <motion.div
                    className={styles.streakNumber}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <span className={styles.emoji}>{emoji}</span>
                    <span className={styles.number}>{streakData.currentStreak}</span>
                    <span className={styles.label}>DAY STREAK</span>
                </motion.div>

                <div className={styles.streakMessage}>
                    {message}
                </div>
            </div>

            {/* Progress to next level */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <span className={styles.levelName}>{level.name}</span>
                    {level.nextAt !== Infinity && (
                        <span className={styles.nextLevel}>
                            {level.nextAt - streakData.currentStreak} days to next level
                        </span>
                    )}
                </div>
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNextLevel}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Week View */}
            <div className={styles.weekView}>
                <div className={styles.weekLabel}>This Week</div>
                <div className={styles.weekDays}>
                    {streakData.streakHistory.map((day, i) => {
                        const date = new Date(day.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                        const isToday = new Date().toISOString().split('T')[0] === day.date;

                        return (
                            <div
                                key={day.date}
                                className={`${styles.dayDot} ${day.underBudget ? styles.success : styles.fail} ${isToday ? styles.today : ''}`}
                                title={`${date.toLocaleDateString()}: ${day.underBudget ? 'Under budget!' : 'Over budget'}`}
                            >
                                <span className={styles.dayLabel}>{dayName}</span>
                                <div className={styles.dot}>
                                    {day.underBudget ? '✓' : '✗'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Today's Status */}
            <div className={styles.todayStatus}>
                <div className={styles.todayLabel}>Today</div>
                <div className={styles.todayInfo}>
                    <span>Spent: <strong>{formatCurrency(streakData.todaySpent)}</strong></span>
                    <span>Budget: <strong>{formatCurrency(streakData.dailyBudget)}</strong></span>
                </div>
                <div className={`${styles.statusBadge} ${styles[streakData.todayStatus]}`}>
                    {streakData.todayStatus === 'under' && '✅ On Track'}
                    {streakData.todayStatus === 'over' && '⚠️ Over Budget'}
                    {streakData.todayStatus === 'pending' && '⏳ No spending yet'}
                </div>
            </div>

            {/* Best Streak */}
            <div className={styles.bestStreak}>
                <Trophy size={16} />
                <span>Best: {streakData.longestStreak} days</span>
            </div>
        </div>
    );
};

export default SpendingStreak;
