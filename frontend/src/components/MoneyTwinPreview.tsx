// Money Twin Preview - Dashboard Widget
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moneyTwinService, MoneyTwinState } from '../services/moneyTwinService';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import styles from './MoneyTwinPreview.module.css';

const MoneyTwinPreview = () => {
    const { user } = useAuthStore();
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadMoneyTwin();
        }
    }, [user?.id]);

    const loadMoneyTwin = async () => {
        if (!user?.id) return;
        try {
            const state = await moneyTwinService.getMoneyTwin(user.id);
            setTwinState(state);
        } catch (error) {
            console.error('Failed to load Money Twin preview:', error);
        }
        setLoading(false);
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        if (score >= 40) return '#F97316';
        return '#EF4444';
    };

    const topRisk = twinState?.riskAlerts[0];

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <Brain size={20} />
                    <h3>Money Twin AI</h3>
                </div>
                <Link to="/money-twin" className={styles.viewAll}>
                    View Full <ArrowRight size={14} />
                </Link>
            </div>

            <div className={styles.healthSection}>
                <div className={styles.healthLabel}>Financial Health</div>
                <div
                    className={styles.healthScore}
                    style={{ color: getHealthColor(twinState?.healthScore || 0) }}
                >
                    {twinState?.healthScore || 0}/100
                </div>
                <div className={styles.healthBar}>
                    <div
                        className={styles.healthFill}
                        style={{
                            width: `${twinState?.healthScore || 0}%`,
                            backgroundColor: getHealthColor(twinState?.healthScore || 0)
                        }}
                    />
                </div>
            </div>

            <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                    <Sparkles size={16} />
                    <div>
                        <span className={styles.statValue}>{formatCurrency(twinState?.velocity.dailyRate || 0)}</span>
                        <span className={styles.statLabel}>Daily Burn</span>
                    </div>
                </div>
                <div className={styles.quickStat}>
                    <TrendingUp size={16} />
                    <div>
                        <span className={styles.statValue}>
                            {twinState?.velocity.daysUntilBroke !== null && twinState?.velocity.daysUntilBroke !== undefined
                                ? `${twinState.velocity.daysUntilBroke}d`
                                : '∞'}
                        </span>
                        <span className={styles.statLabel}>Runway</span>
                    </div>
                </div>
            </div>

            {topRisk && (
                <div className={styles.riskAlert}>
                    <AlertTriangle size={16} />
                    <div className={styles.riskContent}>
                        <span className={styles.riskTitle}>{topRisk.title}</span>
                        <span className={styles.riskMessage}>{topRisk.message}</span>
                    </div>
                </div>
            )}

            {!topRisk && (
                <div className={styles.allClear}>
                    ✨ No financial risks detected
                </div>
            )}
        </motion.div>
    );
};

export default MoneyTwinPreview;
