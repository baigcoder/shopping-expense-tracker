// Money Twin Page - Premium AI Redesign
// Midnight Coral Theme - 3px Borders & Morphing Glass
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Zap, TrendingUp, TrendingDown, AlertTriangle, Target,
    Sparkles, Clock, DollarSign, PieChart, ArrowRight, RefreshCw,
    Play, Pause, ChevronDown, ChevronUp, Lightbulb, Shield,
    GitBranch, Calculator, Wallet, CreditCard, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { moneyTwinService, MoneyTwinState, RiskAlert, FinancialForecast } from '../services/moneyTwinService';
import { whatIfService, WhatIfScenario, ScenarioType } from '../services/whatIfService';
import { parallelUniverseService, ParallelUniverse } from '../services/parallelUniverseService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { useDataRealtime } from '../hooks/useDataRealtime';
import genZToast from '../services/genZToast';
import { cn } from '@/lib/utils';
import styles from './MoneyTwinPage.module.css';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
};

const MoneyTwinPage = () => {
    const { user } = useAuthStore();
    const currencySymbol = getCurrencySymbol();

    // Core state
    const [loading, setLoading] = useState(true);
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [activeTab, setActiveTab] = useState<'forecast' | 'whatif' | 'parallel' | 'risks'>('forecast');
    const [healthScoreAnimating, setHealthScoreAnimating] = useState(false);

    // What-If state
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
    const [scenarioResult, setScenarioResult] = useState<WhatIfScenario | null>(null);
    const [scenarioMonths, setScenarioMonths] = useState(12);
    const [runningScenario, setRunningScenario] = useState(false);

    // Parallel Universe state
    const [universes, setUniverses] = useState<ParallelUniverse[]>([]);
    const [selectedUniverse, setSelectedUniverse] = useState<ParallelUniverse | null>(null);
    const [loadingUniverses, setLoadingUniverses] = useState(false);

    // Scenario form state
    const [scenarioCategory, setScenarioCategory] = useState('');
    const [scenarioAmount, setScenarioAmount] = useState('');
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

    const loadMoneyTwin = async (silent = false) => {
        if (!user?.id) return;
        if (!silent) setLoading(true);
        try {
            const state = await moneyTwinService.getMoneyTwin(user.id, !silent);
            setTwinState(state);
        } catch (error) {
            console.error('Failed to load Money Twin:', error);
            if (!silent) genZToast.error('Could not load your Money Twin 😢');
        }
        if (!silent) setLoading(false);
    };

    const loadSubscriptions = async () => {
        if (!user?.id) return;
        try {
            const subs = await subscriptionService.getAll(user.id);
            setSubscriptions(subs);
        } catch (e) {
            console.log('No subscriptions found');
        }
    };

    const loadUniverses = async () => {
        if (!user?.id) return;
        setLoadingUniverses(true);
        try {
            const unis = await parallelUniverseService.getAllUniverses(user.id, 6);
            setUniverses(unis);
            if (unis.length > 0) setSelectedUniverse(unis[0]);
        } catch (error) {
            console.error('Failed to load parallel universes:', error);
        }
        setLoadingUniverses(false);
    };

    useEffect(() => {
        if (user?.id) {
            loadMoneyTwin();
            loadSubscriptions();
        }
    }, [user?.id]);

    useDataRealtime({
        onMoneyTwinRefresh: () => loadMoneyTwin(true),
        onHealthScoreChange: () => {
            setHealthScoreAnimating(true);
            setTimeout(() => setHealthScoreAnimating(false), 1000);
        }
    });

    const runScenario = async () => {
        if (!user?.id || !selectedScenario) return;
        setRunningScenario(true);
        try {
            let params: any = {};
            switch (selectedScenario) {
                case 'cancel_subscription': params.subscriptionIds = selectedSubs; break;
                case 'add_subscription':
                    params.newSubscriptionCost = parseFloat(scenarioAmount) || 0;
                    params.newSubscriptionName = 'New Subscription';
                    break;
                case 'adjust_budget':
                case 'reduce_category':
                    params.category = scenarioCategory;
                    params.reductionPercent = parseFloat(scenarioAmount) || 20;
                    break;
                case 'income_change': params.incomeChange = parseFloat(scenarioAmount) || 0; break;
                case 'savings_goal': params.targetAmount = parseFloat(scenarioAmount) || 10000; break;
                case 'major_purchase':
                    params.purchaseCost = parseFloat(scenarioAmount) || 0;
                    params.financingMonths = 12;
                    break;
            }
            const result = await whatIfService.runScenario(user.id, selectedScenario, params, scenarioMonths);
            setScenarioResult(result);
            genZToast.success('Simulation Complete! 🔮');
        } catch (error) {
            genZToast.error('Simulation Failed');
        }
        setRunningScenario(false);
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        if (score >= 40) return '#F97316';
        return '#EF4444';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#EF4444';
            case 'danger': return '#F97316';
            case 'warning': return '#F59E0B';
            default: return '#3B82F6';
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
                        <Brain size={64} className="text-blue-600/30" strokeWidth={1.5} />
                    </motion.div>
                    <p>QUANTUM SYNC IN PROGRESS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div className={styles.contentWrapper} variants={containerVariants} initial="hidden" animate="visible">
                {/* Header */}
                <motion.div className={styles.header} variants={itemVariants}>
                    <div className={styles.headerContent}>
                        <div className={styles.healthScore}>
                            <motion.div
                                className={cn(styles.scoreCircle, healthScoreAnimating && styles.animating)}
                                style={{ borderColor: getHealthColor(twinState?.healthScore || 0) }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className={styles.scoreValue}>{twinState?.healthScore || 0}</span>
                                <span className={styles.scoreLabel}>HEALTH</span>
                            </motion.div>
                        </div>
                        <div className={styles.titleSection}>
                            <h1>Money Twin</h1>
                            <p>Neural spending patterns • AI Financial Alter-Ego</p>
                        </div>
                    </div>
                    <button className={styles.refreshBtn} onClick={() => loadMoneyTwin()}>
                        <RefreshCw size={18} className={cn(loading && styles.spin)} />
                        <span>RE-SYNC QUANTUM</span>
                    </button>
                </motion.div>

                {/* Quick Stats Bento Grid */}
                <div className={styles.quickStats}>
                    {[
                        { icon: <Zap size={24} />, label: "Daily Burn", value: formatCurrency(twinState?.velocity.dailyRate || 0), color: "#10B981" },
                        { icon: <TrendingUp size={24} />, label: "Burn Rate", value: `${twinState?.velocity.burnRate || 0}%`, color: "#7C3AED" },
                        { icon: <Clock size={24} />, label: "Runway", value: twinState?.velocity.daysUntilBroke ? `${twinState.velocity.daysUntilBroke}D` : '∞', color: "#3B82F6" },
                        { icon: <AlertTriangle size={24} />, label: "Threats", value: twinState?.riskAlerts.length || 0, color: twinState?.riskAlerts.length ? '#EF4444' : '#10B981' }
                    ].map((stat, i) => (
                        <motion.div key={stat.label} className={styles.statCard} variants={itemVariants} whileHover={{ y: -5 }}>
                            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div>
                                <span className={styles.statLabel}>{stat.label}</span>
                                <div className={styles.statValue}>{stat.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <motion.div className={styles.tabsContainer} variants={itemVariants}>
                    {(['forecast', 'whatif', 'parallel', 'risks'] as const).map((tab) => (
                        <button
                            key={tab}
                            className={cn(styles.tab, activeTab === tab && styles.activeTab)}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === 'parallel' && universes.length === 0) loadUniverses();
                            }}
                        >
                            {tab === 'forecast' && <TrendingUp size={16} />}
                            {tab === 'whatif' && <Calculator size={16} />}
                            {tab === 'parallel' && <GitBranch size={16} />}
                            {tab === 'risks' && <Shield size={16} />}
                            <span>{tab}</span>
                            {activeTab === tab && (
                                <motion.div layoutId="activeTab" className={styles.tabIndicator} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={styles.tabContent}
                    >
                        {activeTab === 'forecast' && (
                            <>
                                <h2>Financial Forecast</h2>
                                <p className={styles.subtitle}>Predictive model based on spend clusters</p>
                                <div className={styles.forecastGrid}>
                                    {twinState?.forecasts.map((forecast, index) => (
                                        <motion.div key={forecast.month} className={cn(styles.forecastCard, styles[forecast.riskLevel])} variants={itemVariants}>
                                            <div className={styles.forecastHeader}>
                                                <span className={styles.forecastMonth}>{forecast.month}</span>
                                                <span className={styles.riskBadge}>{forecast.riskLevel} RISK</span>
                                            </div>
                                            <div className={styles.forecastStats}>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><TrendingDown size={18} /><span>Estimated Spend</span></div>
                                                    <strong>{formatCurrency(forecast.predictedExpenses)}</strong>
                                                </div>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><TrendingUp size={18} /><span>Projected Income</span></div>
                                                    <strong>{formatCurrency(forecast.predictedIncome)}</strong>
                                                </div>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><Shield size={18} /><span>Net Accumulation</span></div>
                                                    <strong className={forecast.predictedSavings < 0 ? styles.negative : styles.positive}>{formatCurrency(forecast.predictedSavings)}</strong>
                                                </div>
                                            </div>
                                            {forecast.predictedSavings < 0 && (
                                                <div className={styles.riskAlertBox}>
                                                    <AlertCircle size={16} />
                                                    <span>PROJECTED DEFICIT: {formatCurrency(Math.abs(forecast.predictedSavings))}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'whatif' && (
                            <>
                                <h2>Simulation Nexus</h2>
                                <p className={styles.subtitle}>Execute hypothetical scenarios to visualize ripple effects</p>
                                <div className={styles.scenarioSelector}>
                                    {[
                                        { id: 'cancel_subscription', icon: <CreditCard />, label: 'Nullify Subs' },
                                        { id: 'reduce_category', icon: <PieChart />, label: 'Optimal Cut' },
                                        { id: 'income_change', icon: <TrendingUp />, label: 'Income Shift' },
                                        { id: 'savings_goal', icon: <Target />, label: 'Goal Target' },
                                        { id: 'major_purchase', icon: <Wallet />, label: 'Big Purchase' },
                                    ].map(item => (
                                        <button key={item.id} className={cn(styles.scenarioBtn, selectedScenario === item.id && styles.active)} onClick={() => setSelectedScenario(item.id as any)}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedScenario && (
                                    <motion.div className={styles.scenarioForm} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                        {selectedScenario === 'cancel_subscription' && (
                                            <div className={styles.formGroup}>
                                                <label>Subscriptions to nullify:</label>
                                                <select multiple className={styles.formInput} value={selectedSubs} onChange={(e) => setSelectedSubs(Array.from(e.target.selectedOptions, option => option.value))}>
                                                    {subscriptions.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({formatCurrency(sub.price)})</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {selectedScenario === 'reduce_category' && (
                                            <div className={styles.formGroup}>
                                                <label>Target cluster:</label>
                                                <select className={styles.formInput} value={scenarioCategory} onChange={(e) => setScenarioCategory(e.target.value)}>
                                                    <option value="">Select Category...</option>
                                                    {twinState?.patterns.map(p => <option key={p.category} value={p.category}>{p.category}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {(selectedScenario && ['income_change', 'savings_goal', 'major_purchase'].includes(selectedScenario)) && (
                                            <div className={styles.formGroup}>
                                                <label>Parametric Value:</label>
                                                <input type="number" className={styles.formInput} value={scenarioAmount} onChange={(e) => setScenarioAmount(e.target.value)} placeholder="0.00" />
                                            </div>
                                        )}
                                        <button className={styles.runBtn} onClick={runScenario} disabled={runningScenario}>
                                            {runningScenario ? <RefreshCw className={styles.spin} /> : <Play />}
                                            {runningScenario ? 'SIMULATING...' : 'EXECUTE SIMULATION'}
                                        </button>
                                    </motion.div>
                                )}
                                {scenarioResult && (
                                    <motion.div className={styles.scenarioResult} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3>{scenarioResult.name}</h3>
                                        <div className={styles.resultStats}>
                                            <div><span className={styles.resultLabel}>Net Impact</span><div className={cn(styles.resultValue, scenarioResult.results.totalSavings >= 0 ? styles.positive : styles.negative)}>{formatCurrency(scenarioResult.results.totalSavings)}</div></div>
                                            <div><span className={styles.resultLabel}>Monthly Delta</span><div className={styles.resultValue}>{formatCurrency(scenarioResult.results.monthlyImpact)}/MO</div></div>
                                            <div><span className={styles.resultLabel}>Compound Prop</span><div className={cn(styles.resultValue, styles.positive)}>+{formatCurrency(scenarioResult.results.compoundGrowth)}</div></div>
                                        </div>
                                        <div className={cn(styles.recommendation, (scenarioResult.results.recommendation === 'highly_recommended' || scenarioResult.results.recommendation === 'recommended') ? styles.positive : styles.negative)}>
                                            <Sparkles size={24} /><span>{scenarioResult.results.summary}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {activeTab === 'parallel' && (
                            <>
                                <h2>Parallel Realities</h2>
                                <p className={styles.subtitle}>Observe diverge timelines from your financial history</p>
                                {loadingUniverses ? <div className={styles.loading}>QUANTUM DECOHERENCE...</div> : (
                                    <div className={styles.universeGrid}>
                                        {universes.map((uni) => (
                                            <motion.div key={uni.id} className={cn(styles.universeCard, selectedUniverse?.id === uni.id && styles.selected)} onClick={() => setSelectedUniverse(uni)} whileHover={{ y: -5 }}>
                                                <span className={styles.universeEmoji}>{uni.emoji}</span>
                                                <span style={{ fontWeight: 950 }}>{uni.name}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                {selectedUniverse && (
                                    <motion.div className={styles.universeDetails} initial={{ opacity: 0 }} layout animate={{ opacity: 1 }}>
                                        <div className={styles.comparisonStats}>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.resultLabel}>CURRENT REALITY</span>
                                                <div className={styles.resultValue}>{formatCurrency(selectedUniverse.comparison.actualSpent)}</div>
                                            </div>
                                            <div className={styles.vsCircle}>VS</div>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.resultLabel}>{selectedUniverse.name.toUpperCase()} REALITY</span>
                                                <div className={styles.resultValue}>{formatCurrency(selectedUniverse.comparison.parallelSpent)}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {activeTab === 'risks' && (
                            <>
                                <h2>Threat Mitigation Radar</h2>
                                <p className={styles.subtitle}>Neutralizing risks to stability</p>
                                {!twinState || twinState.riskAlerts.length === 0 ? (
                                    <div className={styles.loading}>
                                        <Shield size={64} className="text-emerald-500" />
                                        <p>SYSTEM NOMINAL — No Threats Detected</p>
                                    </div>
                                ) : (
                                    <div className={styles.forecastGrid}>
                                        {twinState.riskAlerts.map((risk) => (
                                            <motion.div key={risk.id} className={styles.forecastCard} style={{ borderLeft: `6px solid ${getSeverityColor(risk.severity)}` }} variants={itemVariants}>
                                                <div className={styles.forecastHeader}>
                                                    <span className={styles.forecastMonth}>{risk.title}</span>
                                                    <span className={styles.riskBadge} style={{ color: getSeverityColor(risk.severity), borderColor: getSeverityColor(risk.severity) }}>{risk.severity.toUpperCase()}</span>
                                                </div>
                                                <p style={{ color: '#64748B', fontWeight: 700, margin: '1rem 0' }}>{risk.message}</p>
                                                <div className={styles.riskAlertBox} style={{ background: '#f8fafc', color: '#1e293b', border: '2px solid #f1f5f9' }}>
                                                    <Lightbulb className="text-amber-500" size={16} />
                                                    <span>PROTOCOL: {risk.preventionTip}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MoneyTwinPage;
