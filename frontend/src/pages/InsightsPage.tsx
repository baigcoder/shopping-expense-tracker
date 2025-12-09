// Insights Page - Dynamic AI-powered spending analysis
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Trophy, Zap, Brain, RefreshCw, Sparkles, Target, PiggyBank, Loader2, MessageCircle } from 'lucide-react';
import { getAIResponse, analyzeSpending, optimizeBudget, predictSpending, getProviderStatus } from '../services/aiService';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { supabase } from '../config/supabase';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import styles from './InsightsPage.module.css';

interface Insight {
    id: string;
    type: 'tip' | 'alert' | 'achievement' | 'trend';
    cardType: 'warning' | 'success' | 'danger' | 'info';
    icon: string;
    title: string;
    description: string;
    value?: string;
    comparison?: { direction: 'up' | 'down'; text: string };
    action?: string;
}

const AILoader = () => {
    const [textIndex, setTextIndex] = useState(0);
    const loadingTexts = [
        "Summoning the AI bestie... 👯‍♀️",
        "Checking the vibes... ✨",
        "Fixing your wallet... 💸",
        "Predicting your era... 🔮",
        "Spilling the tea... ☕️"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % loadingTexts.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className={styles.aiLoaderContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={styles.aiBrainContainer}>
                <Brain size={48} className={styles.aiBrain} />
            </div>
            <motion.h3
                key={textIndex}
                className={styles.loadingText}
                initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                exit={{ opacity: 0, scale: 1.2, rotate: 3 }}
            >
                {loadingTexts[textIndex]}
            </motion.h3>
            <p className={styles.loadingSubtext}>Powered by immaculate vibes ✨</p>
        </motion.div>
    );
};


const InsightsPage = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [budgetSuggestions, setBudgetSuggestions] = useState<any>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'insights' | 'analysis' | 'budget' | 'forecast'>('insights');
    const [aiProvider, setAiProvider] = useState<string>('');
    const [dynamicTip, setDynamicTip] = useState<string>('');
    const [isLoadingTip, setIsLoadingTip] = useState(false);

    // Generate dynamic insights using AI
    const generateDynamicInsights = async () => {
        setIsAnalyzing(true);
        try {
            // Get current user
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.log('No user session found');
                setIsAnalyzing(false);
                return;
            }

            // Fetch real transactions
            const transactions = await supabaseTransactionService.getAll(session.user.id);
            console.log('Fetched transactions for AI:', transactions.length);

            // Calculate stats for AI context
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0) || 5000; // Default if no income logged

            // Group spending by category
            const categoryMap = new Map<string, number>();
            transactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const current = categoryMap.get(t.category) || 0;
                    categoryMap.set(t.category, current + t.amount);
                });

            const currentSpending = Array.from(categoryMap.entries()).map(([category, amount]) => ({
                category,
                amount
            }));

            // Get dynamic tip from AI
            setIsLoadingTip(true);
            const categoriesList = currentSpending.map(c => c.category).join(', ') || 'general spending';
            const tipResponse = await getAIResponse(`Give me one quick personalized spending tip based on these categories: ${categoriesList}. If empty, give a general financial tip. Keep it under 50 words.`);
            setDynamicTip(tipResponse);
            setAiProvider(getProviderStatus());
            setIsLoadingTip(false);

            // Generate insights based on AI analysis
            const [analysis, budget, predict] = await Promise.all([
                analyzeSpending(transactions),
                optimizeBudget(income, currentSpending),
                predictSpending(transactions)
            ]);

            setAiAnalysis(analysis);
            setBudgetSuggestions(budget);
            setPrediction(predict);

            // Create dynamic insight cards from AI data
            const dynamicInsights: Insight[] = [
                {
                    id: '1',
                    type: 'tip',
                    cardType: 'info',
                    icon: '🤖',
                    title: 'AI Tip of the Day',
                    description: tipResponse || 'Getting your personalized tip...',
                },
                ...analysis.warnings.map((warning: string, i: number) => ({
                    id: `warning-${i}`,
                    type: 'alert' as const,
                    cardType: 'danger' as const,
                    icon: '⚠️',
                    title: 'Spending Alert',
                    description: warning,
                })),
                ...analysis.opportunities.slice(0, 2).map((opp: string, i: number) => ({
                    id: `opp-${i}`,
                    type: 'achievement' as const,
                    cardType: 'success' as const,
                    icon: '💡',
                    title: 'Savings Opportunity',
                    description: opp,
                })),
                {
                    id: 'forecast',
                    type: 'trend' as const,
                    cardType: predict.trend === 'down' ? 'success' as const : 'warning' as const,
                    icon: predict.trend === 'down' ? '📉' : '📈',
                    title: `Next Month: ${formatCurrency(predict.nextMonth)}`,
                    description: `Spending is trending ${predict.trend}. AI confidence: ${Math.round(predict.confidence * 100)}%`,
                    value: predict.trend === 'down' ? 'Looking good!' : 'Watch out!',
                    comparison: {
                        direction: predict.trend as 'up' | 'down',
                        text: `${predict.trend === 'down' ? 'decreasing' : 'increasing'} trend`
                    },
                },
                {
                    id: 'savings',
                    type: 'achievement' as const,
                    cardType: 'success' as const,
                    icon: '🏆',
                    title: `Potential Savings: ${formatCurrency(budget.totalSavings)}/mo`,
                    description: 'Based on AI budget optimization analysis',
                    value: formatCurrency(budget.totalSavings),
                },
            ];

            setInsights(dynamicInsights);
        } catch (error) {
            console.error('AI Analysis error:', error);
            // Fallback to static insights
            setInsights([
                {
                    id: '1',
                    type: 'tip',
                    cardType: 'info',
                    icon: '💡',
                    title: 'Quick Tip',
                    description: 'Track every expense, no matter how small. Small purchases add up fast!',
                },
            ]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Get AI-generated analysis for a specific question
    const getAIAnalysisResponse = async (question: string) => {
        try {
            const response = await getAIResponse(question);
            return response;
        } catch (error) {
            console.error('AI Response error:', error);
            return 'Unable to get AI response. Please try again.';
        }
    };

    useEffect(() => {
        generateDynamicInsights();
    }, []);

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.headerLeft}>
                    <h1>
                        Insights 🧠
                        <span className={styles.aiBadge}>
                            <Brain size={12} /> {aiProvider ? `via ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)}` : 'AI Powered'}
                        </span>
                    </h1>
                    <p>Real-time AI analysis of your spending patterns</p>
                </div>
                <motion.button
                    className={styles.refreshBtn}
                    onClick={generateDynamicInsights}
                    disabled={isAnalyzing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isAnalyzing ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
                    {isAnalyzing ? 'Analyzing...' : 'Refresh AI'}
                </motion.button>
            </motion.div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'insights' ? styles.active : ''}`}
                    onClick={() => setActiveTab('insights')}
                >
                    <Sparkles size={16} /> Insights
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    <Brain size={16} /> AI Analysis
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'budget' ? styles.active : ''}`}
                    onClick={() => setActiveTab('budget')}
                >
                    <PiggyBank size={16} /> Budget AI
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'forecast' ? styles.active : ''}`}
                    onClick={() => setActiveTab('forecast')}
                >
                    <Target size={16} /> Forecast
                </button>
            </div>

            {/* Loading State */}
            {isAnalyzing && <AILoader />}

            {/* Content Area - Hidden while analyzing */}
            {!isAnalyzing && (
                <>
                    {/* Tab Content */}
                    {activeTab === 'insights' && (
                        <div className={styles.insightsGrid}>
                            {insights.map((insight, index) => (
                                <motion.div
                                    key={insight.id}
                                    className={`${styles.insightCard} ${styles[insight.cardType]}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className={styles.insightHeader}>
                                        <span className={styles.insightIcon}>{insight.icon}</span>
                                        <span className={`${styles.insightType} ${styles[insight.type]}`}>
                                            {insight.type}
                                        </span>
                                    </div>

                                    <h3 className={styles.insightTitle}>{insight.title}</h3>
                                    <p className={styles.insightDescription}>{insight.description}</p>

                                    {insight.value && (
                                        <span className={styles.insightValue}>{insight.value}</span>
                                    )}

                                    {insight.comparison && (
                                        <div className={`${styles.insightComparison} ${styles[insight.comparison.direction]}`}>
                                            {insight.comparison.direction === 'up' ? (
                                                <TrendingUp size={16} />
                                            ) : (
                                                <TrendingDown size={16} />
                                            )}
                                            {insight.comparison.text}
                                        </div>
                                    )}

                                    {insight.action && (
                                        <button className={styles.actionBtn}>
                                            {insight.action}
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'analysis' && aiAnalysis && (
                        <div className={styles.analysisContent}>
                            <motion.div
                                className={styles.summaryCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h3>📊 AI Summary</h3>
                                <p>{aiAnalysis.summary}</p>
                            </motion.div>

                            <div className={styles.analysisGrid}>
                                <motion.div
                                    className={styles.analysisSection}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h4><Lightbulb size={18} /> Key Insights</h4>
                                    <ul>
                                        {aiAnalysis.insights.map((insight: string, i: number) => (
                                            <li key={i}>{insight}</li>
                                        ))}
                                    </ul>
                                </motion.div>

                                <motion.div
                                    className={`${styles.analysisSection} ${styles.warnings}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h4><AlertTriangle size={18} /> Warnings</h4>
                                    <ul>
                                        {aiAnalysis.warnings.map((warning: string, i: number) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </motion.div>

                                <motion.div
                                    className={`${styles.analysisSection} ${styles.opportunities}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h4><Zap size={18} /> Savings Opportunities</h4>
                                    <ul>
                                        {aiAnalysis.opportunities.map((opp: string, i: number) => (
                                            <li key={i}>{opp}</li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </div>

                            {/* AI Chat Section */}
                            <motion.div
                                className={styles.aiChatSection}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h4><MessageCircle size={18} /> Ask AI Anything</h4>
                                <p className={styles.aiChatHint}>Use the floating chat button in the bottom right to ask personalized questions!</p>
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'budget' && budgetSuggestions && (
                        <div className={styles.budgetContent}>
                            <motion.div
                                className={styles.savingsHighlight}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <span className={styles.savingsAmount}>{formatCurrency(budgetSuggestions.totalSavings)}</span>
                                <span className={styles.savingsLabel}>potential monthly savings</span>
                            </motion.div>

                            <div className={styles.budgetTable}>
                                <div className={styles.budgetHeader}>
                                    <span>Category</span>
                                    <span>Suggested</span>
                                    <span>Change</span>
                                    <span>Reason</span>
                                </div>
                                {budgetSuggestions.suggested.map((item: any, i: number) => (
                                    <motion.div
                                        key={item.category}
                                        className={styles.budgetRow}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <span className={styles.budgetCategory}>{item.category}</span>
                                        <span className={styles.budgetAmount}>{formatCurrency(item.amount)}</span>
                                        <span className={`${styles.budgetChange} ${item.adjustment >= 0 ? styles.positive : styles.negative}`}>
                                            {item.adjustment >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.adjustment))}
                                        </span>
                                        <span className={styles.budgetReason}>{item.reason}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className={styles.methodsSection}>
                                <h4>💡 Recommended Methods</h4>
                                <div className={styles.methods}>
                                    {budgetSuggestions.methods.map((method: string, i: number) => (
                                        <div key={i} className={styles.methodCard}>
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'forecast' && prediction && (
                        <div className={styles.forecastContent}>
                            <motion.div
                                className={styles.forecastHighlight}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className={styles.forecastMain}>
                                    <span className={styles.forecastAmount}>{formatCurrency(prediction.nextMonth)}</span>
                                    <span className={styles.forecastLabel}>predicted next month</span>
                                </div>
                                <div className={`${styles.forecastTrend} ${styles[prediction.trend]}`}>
                                    {prediction.trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    <span>{prediction.trend === 'up' ? 'Trending Up' : 'Trending Down'}</span>
                                </div>
                                <div className={styles.confidence}>
                                    <span>AI Confidence: {Math.round(prediction.confidence * 100)}%</span>
                                </div>
                            </motion.div>

                            <div className={styles.breakdownSection}>
                                <h4>📊 Predicted Breakdown</h4>
                                <div className={styles.breakdownGrid}>
                                    {prediction.breakdown.map((item: any, i: number) => (
                                        <motion.div
                                            key={item.category}
                                            className={styles.breakdownCard}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <span className={styles.breakdownCategory}>{item.category}</span>
                                            <span className={styles.breakdownAmount}>{formatCurrency(item.predicted)}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InsightsPage;
