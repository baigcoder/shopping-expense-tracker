// MoneyTwinPage - Stark Gen Z Brutalist Intel Manager
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
import { MoneyTwinSkeleton } from '../components/LoadingSkeleton';

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

    const [loading, setLoading] = useState(true);
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [activeTab, setActiveTab] = useState<'forecast' | 'whatif' | 'parallel' | 'risks'>('forecast');
    const [healthScoreAnimating, setHealthScoreAnimating] = useState(false);

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
    const [scenarioResult, setScenarioResult] = useState<WhatIfScenario | null>(null);
    const [scenarioMonths, setScenarioMonths] = useState(12);
    const [runningScenario, setRunningScenario] = useState(false);

    const [universes, setUniverses] = useState<ParallelUniverse[]>([]);
    const [selectedUniverse, setSelectedUniverse] = useState<ParallelUniverse | null>(null);
    const [loadingUniverses, setLoadingUniverses] = useState(false);

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
            if (!silent) genZToast.error('TWIN_SYNC_FAILURE');
        }
        if (!silent) setLoading(false);
    };

    const loadSubscriptions = async () => {
        if (!user?.id) return;
        try {
            const subs = await subscriptionService.getAll(user.id);
            setSubscriptions(subs);
        } catch (e) {
            console.log('Zero streams found');
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
                    params.newSubscriptionName = 'New Stream';
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
            genZToast.success('SIMULATION_COMPLETE');
        } catch (error) {
            genZToast.error('SIMULATION_FAILURE');
        }
        setRunningScenario(false);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#E11D48';
            case 'danger': return '#000000';
            case 'warning': return '#000000';
            default: return '#000000';
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <MoneyTwinSkeleton />
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
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className={styles.scoreValue}>{twinState?.healthScore || 0}</span>
                                <span className={styles.scoreLabel}>INTEL</span>
                            </motion.div>
                        </div>
                        <div className={styles.titleSection}>
                            <h1>Money Twin</h1>
                            <p>
                                MISSION_FORECAST // ACTIVE_PIPELINE: {activeTab.toUpperCase()}
                                {(twinState?.pendingCandidateImpact?.count || 0) > 0
                                    ? ` // PENDING: ${twinState?.pendingCandidateImpact?.count}`
                                    : ''}
                            </p>
                        </div>
                    </div>
                    <button className={styles.refreshBtn} onClick={() => loadMoneyTwin()}>
                        <RefreshCw size={20} strokeWidth={3} className={cn(loading && styles.spin)} />
                        <span>Sync Twin</span>
                    </button>
                </motion.div>

                {/* Quick Stats Bento Grid */}
                <div className={styles.quickStats}>
                    {[
                        { icon: <Zap size={24} strokeWidth={3} />, label: "Daily Burn", value: formatCurrency(twinState?.velocity.dailyRate || 0) },
                        { icon: <TrendingUp size={24} strokeWidth={3} />, label: "Execution Rate", value: `${twinState?.velocity.burnRate || 0}%` },
                        { icon: <Clock size={24} strokeWidth={3} />, label: "Cash Runway", value: twinState?.velocity.daysUntilBroke ? `${twinState.velocity.daysUntilBroke}D` : 'UNLIMITED' },
                        { icon: <AlertTriangle size={24} strokeWidth={3} />, label: "Security Risks", value: twinState?.riskAlerts.length || 0 }
                    ].map((stat, i) => (
                        <motion.div key={stat.label} className={styles.statCard} variants={itemVariants} whileHover={{ y: -5 }}>
                            <div className={styles.statIcon}>
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
                <div className={styles.tabsContainer}>
                    {(['forecast', 'whatif', 'parallel', 'risks'] as const).map((tab) => (
                        <button
                            key={tab}
                            className={cn(styles.tab, activeTab === tab && styles.activeTab)}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === 'parallel' && universes.length === 0) loadUniverses();
                            }}
                        >
                            {tab === 'forecast' && <TrendingUp size={18} strokeWidth={3} />}
                            {tab === 'whatif' && <Calculator size={18} strokeWidth={3} />}
                            {tab === 'parallel' && <GitBranch size={18} strokeWidth={3} />}
                            {tab === 'risks' && <Shield size={18} strokeWidth={3} />}
                            <span>{tab}</span>
                        </button>
                    ))}
                </div>

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
                                <h2>Mission Forecast</h2>
                                <p className={styles.subtitle}>Predictive modeling based on active spend clusters</p>
                                <div className={styles.forecastGrid}>
                                    {twinState?.forecasts.map((forecast, index) => (
                                        <motion.div key={forecast.month} className={cn(styles.forecastCard, styles[forecast.riskLevel])} variants={itemVariants}>
                                            <div className={styles.forecastHeader}>
                                                <span className={styles.forecastMonth}>{forecast.month}</span>
                                                <span className={styles.riskBadge}>{forecast.riskLevel} MISSION_RISK</span>
                                            </div>
                                            <div className={styles.forecastStats}>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><TrendingDown size={20} strokeWidth={3} /><span>ESTIMATED_DEPLETION</span></div>
                                                    <strong>{formatCurrency(forecast.predictedExpenses)}</strong>
                                                </div>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><TrendingUp size={20} strokeWidth={3} /><span>PROJECTED_INFLOW</span></div>
                                                    <strong>{formatCurrency(forecast.predictedIncome)}</strong>
                                                </div>
                                                <div className={styles.forecastStat}>
                                                    <div className={styles.statLabelGroup}><Shield size={20} strokeWidth={3} /><span>NET_ACCUMULATION</span></div>
                                                    <strong className={forecast.predictedSavings < 0 ? styles.negative : styles.positive}>{formatCurrency(forecast.predictedSavings)}</strong>
                                                </div>
                                            </div>
                                            {forecast.predictedSavings < 0 && (
                                                <div className={styles.riskAlertBox}>
                                                    <AlertCircle size={18} strokeWidth={3} />
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
                                <h2>Scenario Simulation</h2>
                                <p className={styles.subtitle}>Test mission decisions against active intel data</p>
                                <div className={styles.scenarioSelector}>
                                    {[
                                        { id: 'cancel_subscription', icon: <CreditCard strokeWidth={3} />, label: 'TERMINATE STREAM' },
                                        { id: 'reduce_category', icon: <PieChart strokeWidth={3} />, label: 'REDUCE SECTOR' },
                                        { id: 'income_change', icon: <TrendingUp strokeWidth={3} />, label: 'INFLOW SHIFT' },
                                        { id: 'savings_goal', icon: <Target strokeWidth={3} />, label: 'TARGET GOAL' },
                                        { id: 'major_purchase', icon: <Wallet strokeWidth={3} />, label: 'MAJOR ACQUISITION' },
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
                                                <label>Target Streams:</label>
                                                <select multiple className={styles.formInput} value={selectedSubs} onChange={(e) => setSelectedSubs(Array.from(e.target.selectedOptions, option => option.value))}>
                                                    {subscriptions.map(sub => <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()} ({formatCurrency(sub.price)})</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {selectedScenario === 'reduce_category' && (
                                            <div className={styles.formGroup}>
                                                <label>Target Sector:</label>
                                                <select className={styles.formInput} value={scenarioCategory} onChange={(e) => setScenarioCategory(e.target.value)}>
                                                    <option value="">SELECT SECTOR...</option>
                                                    {twinState?.patterns.map(p => <option key={p.category} value={p.category}>{p.category.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {(selectedScenario && ['income_change', 'savings_goal', 'major_purchase'].includes(selectedScenario)) && (
                                            <div className={styles.formGroup}>
                                                <label>Mission Resource Amount:</label>
                                                <input type="number" className={styles.formInput} value={scenarioAmount} onChange={(e) => setScenarioAmount(e.target.value)} placeholder="0.00" />
                                            </div>
                                        )}
                                        <button className={styles.runBtn} onClick={runScenario} disabled={runningScenario}>
                                            {runningScenario ? <RefreshCw className={styles.spin} size={24} strokeWidth={4} /> : <Play size={24} strokeWidth={4} />}
                                            {runningScenario ? 'SIMULATING...' : 'EXECUTE SIMULATION'}
                                        </button>
                                    </motion.div>
                                )}
                                {scenarioResult && (
                                    <motion.div className={styles.scenarioResult} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="text-2xl font-black italic uppercase mb-6">{scenarioResult.name}</h3>
                                        <div className={styles.resultStats}>
                                            <div><span className={styles.resultLabel}>NET_IMPACT</span><div className={cn(styles.resultValue, scenarioResult.results.totalSavings >= 0 ? styles.positive : styles.negative)}>{formatCurrency(scenarioResult.results.totalSavings)}</div></div>
                                            <div><span className={styles.resultLabel}>CYCLE_CHANGE</span><div className={styles.resultValue}>{formatCurrency(scenarioResult.results.monthlyImpact)}/MO</div></div>
                                            <div><span className={styles.resultLabel}>GROWTH_POTENTIAL</span><div className={cn(styles.resultValue, styles.positive)}>+{formatCurrency(scenarioResult.results.compoundGrowth)}</div></div>
                                        </div>
                                        <div className={cn(styles.recommendation, (scenarioResult.results.recommendation === 'highly_recommended' || scenarioResult.results.recommendation === 'recommended') ? styles.positive : styles.negative)}>
                                            <Sparkles size={28} strokeWidth={3} /><span>{scenarioResult.results.summary.toUpperCase()}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {activeTab === 'parallel' && (
                            <>
                                <h2>Timeline Comparison</h2>
                                <p className={styles.subtitle}>Analyze alternative trajectories against mission history</p>
                                {loadingUniverses ? <div className={styles.loading}>SYNCING_TIMELINES...</div> : (
                                    <div className={styles.universeGrid}>
                                        {universes.map((uni) => (
                                            <motion.div key={uni.id} className={cn(styles.universeCard, selectedUniverse?.id === uni.id && styles.selected)} onClick={() => setSelectedUniverse(uni)} whileHover={{ y: -5 }}>
                                                <span className={styles.universeEmoji}>{uni.emoji}</span>
                                                <span className="font-black uppercase italic">{uni.name}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                {selectedUniverse && (
                                    <motion.div className={styles.universeDetails} initial={{ opacity: 0 }} layout animate={{ opacity: 1 }}>
                                        <div className={styles.comparisonStats}>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.resultLabel}>CURRENT_TIMELINE</span>
                                                <div className={styles.resultValue}>{formatCurrency(selectedUniverse.comparison.actualSpent)}</div>
                                            </div>
                                            <div className={styles.vsCircle}>VS</div>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.resultLabel}>{selectedUniverse.name.toUpperCase()}_TIMELINE</span>
                                                <div className={styles.resultValue}>{formatCurrency(selectedUniverse.comparison.parallelSpent)}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {activeTab === 'risks' && (
                            <>
                                <h2>Mission Risk Radar</h2>
                                <p className={styles.subtitle}>Counter-measures and protocol alerts</p>
                                {!twinState || twinState.riskAlerts.length === 0 ? (
                                    <div className={styles.loading}>
                                        <Shield size={80} className="text-black" strokeWidth={3} />
                                        <p>MISSION_SECURE: NO RISKS DETECTED</p>
                                    </div>
                                ) : (
                                    <div className={styles.forecastGrid}>
                                        {twinState.riskAlerts.map((risk) => (
                                            <motion.div key={risk.id} className={styles.forecastCard} variants={itemVariants}>
                                                <div className={styles.forecastHeader}>
                                                    <span className={styles.forecastMonth}>{risk.title}</span>
                                                    <span className={styles.riskBadge} style={{ color: '#E11D48', borderColor: '#E11D48' }}>{risk.severity.toUpperCase()}</span>
                                                </div>
                                                <p className="font-bold text-black/70 mb-6 uppercase text-sm leading-relaxed">{risk.message}</p>
                                                <div className={styles.riskAlertBox}>
                                                    <Lightbulb className="text-white" size={20} strokeWidth={3} />
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
