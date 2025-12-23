// Money Twin Page - AI Predictive Financial Clone
// Your digital financial simulation with what-if scenarios and parallel universes
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Zap, TrendingUp, TrendingDown, AlertTriangle, Target,
    Sparkles, Clock, DollarSign, PieChart, ArrowRight, RefreshCw,
    Play, Pause, ChevronDown, ChevronUp, Lightbulb, Shield,
    GitBranch, Calculator, Wallet, CreditCard
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { moneyTwinService, MoneyTwinState, RiskAlert, FinancialForecast } from '../services/moneyTwinService';
import { whatIfService, WhatIfScenario, ScenarioType } from '../services/whatIfService';
import { parallelUniverseService, ParallelUniverse } from '../services/parallelUniverseService';
import { subscriptionService, Subscription } from '../services/subscriptionService';
import { formatCurrency } from '../services/currencyService';
import genZToast from '../services/genZToast';
import styles from './MoneyTwinPage.module.css';

const MoneyTwinPage = () => {
    const { user } = useAuthStore();

    // Core state
    const [loading, setLoading] = useState(true);
    const [twinState, setTwinState] = useState<MoneyTwinState | null>(null);
    const [activeTab, setActiveTab] = useState<'forecast' | 'whatif' | 'parallel' | 'risks'>('forecast');

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

    // Load data on mount
    useEffect(() => {
        if (user?.id) {
            loadMoneyTwin();
            loadSubscriptions();
        }
    }, [user?.id]);

    const loadMoneyTwin = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const state = await moneyTwinService.getMoneyTwin(user.id);
            setTwinState(state);
        } catch (error) {
            console.error('Failed to load Money Twin:', error);
            genZToast.error('Could not load your Money Twin 😢');
        }
        setLoading(false);
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

    // Run a what-if scenario
    const runScenario = async () => {
        if (!user?.id || !selectedScenario) return;
        setRunningScenario(true);

        try {
            let params: any = {};

            switch (selectedScenario) {
                case 'cancel_subscription':
                    params.subscriptionIds = selectedSubs;
                    break;
                case 'add_subscription':
                    params.newSubscriptionCost = parseFloat(scenarioAmount) || 0;
                    params.newSubscriptionName = 'New Subscription';
                    break;
                case 'adjust_budget':
                case 'reduce_category':
                    params.category = scenarioCategory;
                    params.reductionPercent = parseFloat(scenarioAmount) || 20;
                    break;
                case 'income_change':
                    params.incomeChange = parseFloat(scenarioAmount) || 0;
                    break;
                case 'savings_goal':
                    params.targetAmount = parseFloat(scenarioAmount) || 10000;
                    break;
                case 'major_purchase':
                    params.purchaseCost = parseFloat(scenarioAmount) || 0;
                    params.financingMonths = 12;
                    break;
            }

            const result = await whatIfService.runScenario(user.id, selectedScenario, params, scenarioMonths);
            setScenarioResult(result);
            genZToast.success('Scenario calculated! 🔮');
        } catch (error) {
            console.error('Scenario failed:', error);
            genZToast.error('Could not run scenario');
        }
        setRunningScenario(false);
    };

    // Get health score color
    const getHealthColor = (score: number) => {
        if (score >= 80) return '#10B981'; // Emerald 500
        if (score >= 60) return '#F59E0B'; // Amber 500
        if (score >= 40) return '#F97316'; // Orange 500
        return '#EF4444'; // Red 500
    };

    // Get risk severity color
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#DC2626'; // Red 600
            case 'danger': return '#EF4444';   // Red 500
            case 'warning': return '#F59E0B';  // Amber 500
            default: return '#3B82F6';         // Blue 500
        }
    };

    // Render loading state
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain size={48} />
                    </motion.div>
                    <p>Syncing with your Money Twin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerContent}>
                    <div className={styles.healthScore}>
                        <div
                            className={styles.scoreCircle}
                            style={{ borderColor: getHealthColor(twinState?.healthScore || 0) }}
                        >
                            <span className={styles.scoreValue}>{twinState?.healthScore || 0}</span>
                            <span className={styles.scoreLabel}>Health</span>
                        </div>
                    </div>
                    <div className={styles.titleSection}>
                        <h1>Money Twin</h1>
                        <p>AI-Powered Financial Simulation</p>
                    </div>
                </div>
                <button className={styles.refreshBtn} onClick={loadMoneyTwin}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                className={styles.quickStats}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className={styles.statCard}>
                    <Zap size={20} />
                    <div>
                        <span className={styles.statValue}>{formatCurrency(twinState?.velocity.dailyRate || 0)}</span>
                        <span className={styles.statLabel}>Daily Burn</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <TrendingUp size={20} />
                    <div>
                        <span className={styles.statValue}>{twinState?.velocity.burnRate || 0}%</span>
                        <span className={styles.statLabel}>Burn Rate</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Clock size={20} />
                    <div>
                        <span className={styles.statValue}>
                            {twinState?.velocity.daysUntilBroke !== null && twinState?.velocity.daysUntilBroke !== undefined ? `${twinState.velocity.daysUntilBroke}d` : '∞'}
                        </span>
                        <span className={styles.statLabel}>Runway</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <AlertTriangle size={20} color={twinState?.riskAlerts.length ? '#F59E0B' : '#10B981'} />
                    <div>
                        <span className={styles.statValue}>{twinState?.riskAlerts.length || 0}</span>
                        <span className={styles.statLabel}>Risks</span>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'forecast' ? styles.active : ''}`}
                    onClick={() => setActiveTab('forecast')}
                >
                    <TrendingUp size={16} /> Forecast
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'whatif' ? styles.active : ''}`}
                    onClick={() => setActiveTab('whatif')}
                >
                    <Calculator size={16} /> What If
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'parallel' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab('parallel');
                        if (universes.length === 0) loadUniverses();
                    }}
                >
                    <GitBranch size={16} /> Parallel You
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'risks' ? styles.active : ''}`}
                    onClick={() => setActiveTab('risks')}
                >
                    <Shield size={16} /> Risks
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {/* Forecast Tab */}
                {activeTab === 'forecast' && (
                    <motion.div
                        key="forecast"
                        className={styles.tabContent}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <h2>2-Month AI Financial Forecast</h2>
                        <p className={styles.forecastSubheading}>High-accuracy predictions based on your actual spending patterns</p>
                        <div className={styles.forecastGrid}>
                            {twinState?.forecasts.map((forecast, index) => (
                                <motion.div
                                    key={forecast.month}
                                    className={`${styles.forecastCard} ${styles[forecast.riskLevel]}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={styles.forecastHeader}>
                                        <span className={styles.forecastMonth}>{forecast.month}</span>
                                        <span className={`${styles.riskBadge} ${styles[forecast.riskLevel]}`}>
                                            {forecast.riskLevel}
                                        </span>
                                    </div>
                                    <div className={styles.forecastStats}>
                                        <div className={styles.forecastStat}>
                                            <span>Expenses</span>
                                            <strong>{formatCurrency(forecast.predictedExpenses)}</strong>
                                        </div>
                                        <div className={styles.forecastStat}>
                                            <span>Income</span>
                                            <strong>{formatCurrency(forecast.predictedIncome)}</strong>
                                        </div>
                                        <div className={`${styles.forecastStat} ${forecast.predictedSavings < 0 ? styles.negative : styles.positive}`}>
                                            <span>Savings</span>
                                            <strong>{formatCurrency(forecast.predictedSavings)}</strong>
                                        </div>
                                    </div>
                                    {forecast.warnings.length > 0 && (
                                        <div className={styles.warnings}>
                                            {forecast.warnings.map((w, i) => (
                                                <div key={i} className={styles.warning}>
                                                    <AlertTriangle size={14} /> {w}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* What-If Tab */}
                {activeTab === 'whatif' && (
                    <motion.div
                        key="whatif"
                        className={styles.tabContent}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <h2>What-If Scenarios</h2>
                        <p className={styles.subtitle}>Test decisions before you make them</p>

                        {/* Scenario Selector */}
                        <div className={styles.scenarioSelector}>
                            <button
                                className={`${styles.scenarioBtn} ${selectedScenario === 'cancel_subscription' ? styles.active : ''}`}
                                onClick={() => setSelectedScenario('cancel_subscription')}
                            >
                                <CreditCard size={16} /> Cancel Subs
                            </button>
                            <button
                                className={`${styles.scenarioBtn} ${selectedScenario === 'reduce_category' ? styles.active : ''}`}
                                onClick={() => setSelectedScenario('reduce_category')}
                            >
                                <PieChart size={16} /> Cut Category
                            </button>
                            <button
                                className={`${styles.scenarioBtn} ${selectedScenario === 'income_change' ? styles.active : ''}`}
                                onClick={() => setSelectedScenario('income_change')}
                            >
                                <TrendingUp size={16} /> Income Change
                            </button>
                            <button
                                className={`${styles.scenarioBtn} ${selectedScenario === 'savings_goal' ? styles.active : ''}`}
                                onClick={() => setSelectedScenario('savings_goal')}
                            >
                                <Target size={16} /> Savings Goal
                            </button>
                            <button
                                className={`${styles.scenarioBtn} ${selectedScenario === 'major_purchase' ? styles.active : ''}`}
                                onClick={() => setSelectedScenario('major_purchase')}
                            >
                                <Wallet size={16} /> Big Purchase
                            </button>
                        </div>

                        {/* Scenario Form */}
                        {selectedScenario && (
                            <motion.div
                                className={styles.scenarioForm}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                {selectedScenario === 'cancel_subscription' && (
                                    <div className={styles.formGroup}>
                                        <label>Select subscriptions to cancel:</label>
                                        <div className={styles.subsList}>
                                            {subscriptions.map(sub => (
                                                <label key={sub.id} className={styles.subItem}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubs.includes(sub.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSubs([...selectedSubs, sub.id]);
                                                            } else {
                                                                setSelectedSubs(selectedSubs.filter(id => id !== sub.id));
                                                            }
                                                        }}
                                                    />
                                                    <span>{sub.name}</span>
                                                    <span className={styles.subPrice}>{formatCurrency(sub.price)}/{sub.cycle}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedScenario === 'reduce_category' && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label>Category to reduce:</label>
                                            <select
                                                value={scenarioCategory}
                                                onChange={(e) => setScenarioCategory(e.target.value)}
                                            >
                                                <option value="">Select category...</option>
                                                {twinState?.patterns.map(p => (
                                                    <option key={p.category} value={p.category}>
                                                        {p.category} ({formatCurrency(p.avgMonthlySpend)}/mo)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Reduction %:</label>
                                            <input
                                                type="number"
                                                value={scenarioAmount}
                                                onChange={(e) => setScenarioAmount(e.target.value)}
                                                placeholder="20"
                                            />
                                        </div>
                                    </>
                                )}

                                {(selectedScenario === 'income_change' || selectedScenario === 'savings_goal' || selectedScenario === 'major_purchase') && (
                                    <div className={styles.formGroup}>
                                        <label>
                                            {selectedScenario === 'income_change' && 'Monthly income change (+/-)'}
                                            {selectedScenario === 'savings_goal' && 'Target amount'}
                                            {selectedScenario === 'major_purchase' && 'Purchase cost'}
                                        </label>
                                        <input
                                            type="number"
                                            value={scenarioAmount}
                                            onChange={(e) => setScenarioAmount(e.target.value)}
                                            placeholder="Enter amount..."
                                        />
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label>Timeframe: {scenarioMonths} months</label>
                                    <input
                                        type="range"
                                        min="3"
                                        max="36"
                                        value={scenarioMonths}
                                        onChange={(e) => setScenarioMonths(parseInt(e.target.value))}
                                    />
                                </div>

                                <button
                                    className={styles.runBtn}
                                    onClick={runScenario}
                                    disabled={runningScenario}
                                >
                                    {runningScenario ? (
                                        <><RefreshCw size={16} className={styles.spin} /> Calculating...</>
                                    ) : (
                                        <><Play size={16} /> Run Scenario</>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* Scenario Results */}
                        {scenarioResult && (
                            <motion.div
                                className={styles.scenarioResult}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3>{scenarioResult.name}</h3>
                                <p className={styles.scenarioDesc}>{scenarioResult.description}</p>

                                <div className={styles.resultStats}>
                                    <div>
                                        <span className={styles.resultLabel}>Total Impact</span>
                                        <span className={`${styles.resultValue} ${scenarioResult.results.totalSavings >= 0 ? styles.positive : styles.negative}`}>
                                            {scenarioResult.results.totalSavings >= 0 ? '+' : ''}{formatCurrency(scenarioResult.results.totalSavings)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={styles.resultLabel}>Monthly</span>
                                        <span className={styles.resultValue}>{formatCurrency(Math.abs(scenarioResult.results.monthlyImpact))}/mo</span>
                                    </div>
                                    {scenarioResult.results.compoundGrowth > 0 && (
                                        <div>
                                            <span className={styles.resultLabel}>If Invested</span>
                                            <span className={`${styles.resultValue} ${styles.positive}`}>+{formatCurrency(scenarioResult.results.compoundGrowth)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={`${styles.recommendation} ${styles[scenarioResult.results.recommendation]}`}>
                                    <Lightbulb size={20} />
                                    <span>{scenarioResult.results.summary}</span>
                                </div>

                                <div className={styles.prosConsGrid}>
                                    <div className={styles.pros}>
                                        <h4>Pros</h4>
                                        <ul>
                                            {scenarioResult.results.pros.map((pro, i) => (
                                                <li key={i}>{pro}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={styles.cons}>
                                        <h4>Cons</h4>
                                        <ul>
                                            {scenarioResult.results.cons.map((con, i) => (
                                                <li key={i}>{con}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Parallel Universe Tab */}
                {activeTab === 'parallel' && (
                    <motion.div
                        key="parallel"
                        className={styles.tabContent}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <h2>Parallel Universes</h2>
                        <p className={styles.subtitle}>Explore alternate versions of your financial life</p>

                        {loadingUniverses ? (
                            <div className={styles.loading}>
                                <Sparkles size={24} className={styles.spin} />
                                <span>Opening portals to alternate realities...</span>
                            </div>
                        ) : (
                            <>
                                {/* Universe Selector */}
                                <div className={styles.universeGrid}>
                                    {universes.map((uni, index) => (
                                        <motion.div
                                            key={uni.id}
                                            className={`${styles.universeCard} ${selectedUniverse?.id === uni.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedUniverse(uni)}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <span className={styles.universeEmoji}>{uni.emoji}</span>
                                            <span style={{ fontWeight: 600 }}>{uni.name}</span>
                                            {uni.comparison.difference > 0 && (
                                                <span className={styles.universeDiff}>
                                                    +{formatCurrency(uni.comparison.difference)}
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Selected Universe Details */}
                                {selectedUniverse && (
                                    <motion.div
                                        className={styles.universeDetails}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className={styles.universeHeader}>
                                            <span className={styles.bigEmoji}>{selectedUniverse.emoji}</span>
                                            <div>
                                                <h3>{selectedUniverse.name}</h3>
                                                <p>{selectedUniverse.description}</p>
                                            </div>
                                        </div>

                                        <div className={styles.comparisonStats}>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.compLabel}>You Spent</span>
                                                <span className={styles.compValue}>{formatCurrency(selectedUniverse.comparison.actualSpent)}</span>
                                            </div>
                                            <div className={styles.vsCircle}>VS</div>
                                            <div style={{ textAlign: 'center' }}>
                                                <span className={styles.compLabel}>{selectedUniverse.name} Spent</span>
                                                <span className={styles.compValue}>{formatCurrency(selectedUniverse.comparison.parallelSpent)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.differenceBox}>
                                            <span className={styles.diffLabel}>Difference</span>
                                            <span className={`${styles.diffValue} ${selectedUniverse.comparison.difference > 0 ? styles.positive : ''}`}>
                                                {selectedUniverse.comparison.difference > 0 ? '+' : ''}{formatCurrency(selectedUniverse.comparison.difference)}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 style={{ marginBottom: 16, color: '#475569' }}>💡 Insights</h4>
                                            {selectedUniverse.insights.map((insight, i) => (
                                                <div key={i} className={styles.insightItem}>
                                                    <Lightbulb size={16} />
                                                    <span>{insight}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ marginTop: 24 }}>
                                            <h4 style={{ marginBottom: 16, color: '#475569' }}>📋 Action Items</h4>
                                            {selectedUniverse.actionItems.map((action, i) => (
                                                <div key={i} className={styles.actionItem}>
                                                    <ArrowRight size={16} />
                                                    <span>{action}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {/* Risks Tab */}
                {activeTab === 'risks' && (
                    <motion.div
                        key="risks"
                        className={styles.tabContent}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <h2>Risk Radar</h2>

                        {twinState?.riskAlerts.length === 0 ? (
                            <div className={styles.loading}>
                                <Shield size={48} color="#10B981" />
                                <h3>All Clear!</h3>
                                <p>No financial risks detected. Keep up the good work!</p>
                            </div>
                        ) : (
                            <div className={styles.risksList}>
                                {twinState?.riskAlerts.map((risk, index) => (
                                    <motion.div
                                        key={risk.id}
                                        className={styles.riskCard}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div
                                            className={styles.riskIndicator}
                                            style={{ backgroundColor: getSeverityColor(risk.severity) }}
                                        />
                                        <div className={styles.riskHeader}>
                                            <span className={styles.riskTitle}>{risk.title}</span>
                                            {risk.daysUntil !== null && (
                                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> {risk.daysUntil}d
                                                </span>
                                            )}
                                        </div>
                                        <p className={styles.riskMessage}>{risk.message}</p>
                                        <div className={styles.riskProbability}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                                                <span>Probability</span>
                                                <span>{risk.probability}%</span>
                                            </div>
                                            <div className={styles.probBar}>
                                                <div
                                                    className={styles.probFill}
                                                    style={{
                                                        width: `${risk.probability}%`,
                                                        backgroundColor: getSeverityColor(risk.severity)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', color: '#475569' }}>
                                            <Lightbulb size={16} color="#F59E0B" />
                                            <span>{risk.preventionTip}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoneyTwinPage;
