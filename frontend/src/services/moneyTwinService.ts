// Money Twin Service - Core Prediction Engine
// Creates a digital simulation of user's financial behavior
import { supabaseTransactionService, SupabaseTransaction } from './supabaseTransactionService';
import { subscriptionService, Subscription } from './subscriptionService';
import { budgetService, Budget } from './budgetService';
import { goalService, Goal } from './goalService';
import { formatCurrency } from './currencyService';
import api from './api';

// ==================== INTERFACES ====================

export interface SpendingPattern {
    category: string;
    avgMonthlySpend: number;
    avgDailySpend: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    trendPercentage: number; // % change per month
    volatility: number; // 0-1 scale (1 = highly unpredictable)
    seasonalPeaks: string[]; // Month names with higher spending
    dayOfMonthPattern: number[]; // Days with higher spending (1-31)
    predictedNextMonth: number;
    confidence: number; // 0-100% confidence in prediction
}

export interface FinancialForecast {
    month: string;
    predictedExpenses: number;
    predictedIncome: number;
    predictedSavings: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    warnings: string[];
    breakdown: Record<string, number>; // Category breakdown
}

export interface SpendingVelocity {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    acceleration: number; // Positive = spending increasing, negative = decreasing
    daysUntilBroke: number | null; // Based on current trajectory
    burnRate: number; // % of income being spent
}

export interface MoneyTwinState {
    userId: string;
    lastUpdated: string;
    patterns: SpendingPattern[];
    velocity: SpendingVelocity;
    forecasts: FinancialForecast[];
    healthScore: number; // 0-100
    riskAlerts: RiskAlert[];
}

export interface RiskAlert {
    id: string;
    type: 'overdraft' | 'budget_breach' | 'goal_miss' | 'unusual_spending' | 'subscription_creep';
    severity: 'info' | 'warning' | 'danger' | 'critical';
    title: string;
    message: string;
    daysUntil: number | null;
    probability: number; // 0-100%
    preventionTip: string;
    createdAt: string;
}

// ==================== MONEY TWIN SERVICE ====================

class MoneyTwinService {
    private cache: MoneyTwinState | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1 minute for fresher data

    // Try fetching AI-generated insights from backend (Groq-powered)
    private async fetchBackendAI(userId: string): Promise<{
        insights: any[] | null;
        forecast: any[] | null;
        risks: any[] | null;
    }> {
        try {
            const [insightsRes, forecastRes, risksRes] = await Promise.all([
                api.get('/ai/insights', { headers: { 'x-user-id': userId } }).catch(() => null),
                api.get('/ai/forecast', { headers: { 'x-user-id': userId } }).catch(() => null),
                api.get('/ai/risks', { headers: { 'x-user-id': userId } }).catch(() => null)
            ]);

            console.log('🤖 Backend AI fetched:', {
                insights: insightsRes?.data?.insights?.length || 0,
                forecast: forecastRes?.data?.forecast?.length || 0,
                risks: risksRes?.data?.risks?.length || 0
            });

            return {
                insights: insightsRes?.data?.insights || null,
                forecast: forecastRes?.data?.forecast || null,
                risks: risksRes?.data?.risks || null
            };
        } catch (error) {
            console.log('Backend AI unavailable, using local analysis');
            return { insights: null, forecast: null, risks: null };
        }
    }

    // Main entry point - get the user's Money Twin analysis
    async getMoneyTwin(userId: string, forceRefresh = false): Promise<MoneyTwinState> {
        const now = Date.now();

        if (!forceRefresh && this.cache && this.cache.userId === userId && now < this.cacheExpiry) {
            return this.cache;
        }

        // Fetch all user data AND backend AI in parallel
        const [transactions, subscriptions, budgets, goals, backendAI] = await Promise.all([
            supabaseTransactionService.getAll(userId),
            subscriptionService.getAll(userId).catch(() => []),
            budgetService.getAll(userId).catch(() => []),
            goalService.getAll(userId).catch(() => []),
            this.fetchBackendAI(userId) // Try backend Groq AI
        ]);

        // Analyze patterns locally
        const patterns = this.analyzeSpendingPatterns(transactions);
        const velocity = this.calculateSpendingVelocity(transactions);
        const forecasts = this.generateForecasts(transactions, patterns, subscriptions);
        const healthScore = this.calculateHealthScore(velocity, patterns, budgets, goals);
        let riskAlerts = this.detectRisks(transactions, velocity, budgets, forecasts);

        // Merge backend AI risks if available (they have better suggestions)
        if (backendAI.risks && backendAI.risks.length > 0) {
            const aiRisks: RiskAlert[] = backendAI.risks.map((r: any, i: number) => ({
                id: `ai-risk-${i}`,
                type: 'unusual_spending' as const,
                severity: r.confidence > 0.8 ? 'danger' : 'warning' as const,
                title: r.title || 'AI Risk Alert',
                message: r.message || 'Potential financial risk detected',
                daysUntil: null,
                probability: Math.round((r.confidence || 0.7) * 100),
                preventionTip: r.message || 'Review your spending patterns',
                createdAt: r.generatedAt || new Date().toISOString()
            }));
            // Prepend AI risks to local risks
            riskAlerts = [...aiRisks, ...riskAlerts];
        }

        const state: MoneyTwinState = {
            userId,
            lastUpdated: new Date().toISOString(),
            patterns,
            velocity,
            forecasts,
            healthScore,
            riskAlerts
        };

        this.cache = state;
        this.cacheExpiry = now + this.CACHE_TTL;

        return state;
    }

    // ==================== PATTERN ANALYSIS ====================

    analyzeSpendingPatterns(transactions: SupabaseTransaction[]): SpendingPattern[] {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length < 2) return []; // Reduced for faster initial patterns

        // Group by category
        const categoryGroups: Record<string, SupabaseTransaction[]> = {};
        expenses.forEach(t => {
            const cat = t.category || 'Other';
            if (!categoryGroups[cat]) categoryGroups[cat] = [];
            categoryGroups[cat].push(t);
        });

        return Object.entries(categoryGroups).map(([category, txs]) => {
            const monthlyData = this.groupByMonth(txs);
            const avgMonthlySpend = this.calculateAverage(Object.values(monthlyData));
            const trend = this.detectTrend(Object.values(monthlyData));
            const volatility = this.calculateVolatility(Object.values(monthlyData));
            const seasonalPeaks = this.detectSeasonalPeaks(monthlyData);
            const dayPatterns = this.detectDayPatterns(txs);
            const prediction = this.predictNextMonth(monthlyData, trend);

            return {
                category,
                avgMonthlySpend,
                avgDailySpend: avgMonthlySpend / 30,
                trend: trend.direction,
                trendPercentage: trend.percentage,
                volatility,
                seasonalPeaks,
                dayOfMonthPattern: dayPatterns,
                predictedNextMonth: prediction.amount,
                confidence: prediction.confidence
            };
        }).sort((a, b) => b.avgMonthlySpend - a.avgMonthlySpend);
    }

    private groupByMonth(transactions: SupabaseTransaction[]): Record<string, number> {
        const grouped: Record<string, number> = {};
        transactions.forEach(t => {
            const month = t.date.substring(0, 7); // YYYY-MM
            grouped[month] = (grouped[month] || 0) + Math.abs(t.amount);
        });
        return grouped;
    }

    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private detectTrend(monthlyValues: number[]): { direction: 'increasing' | 'stable' | 'decreasing', percentage: number } {
        if (monthlyValues.length < 2) return { direction: 'stable', percentage: 0 };

        const recent = monthlyValues.slice(-3);
        const older = monthlyValues.slice(0, -3);

        if (recent.length === 0 || older.length === 0) {
            // Compare last two values
            const last = monthlyValues[monthlyValues.length - 1];
            const prev = monthlyValues[monthlyValues.length - 2];
            const change = prev > 0 ? ((last - prev) / prev) * 100 : 0;

            return {
                direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
                percentage: change
            };
        }

        const recentAvg = this.calculateAverage(recent);
        const olderAvg = this.calculateAverage(older);
        const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        return {
            direction: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
            percentage: change
        };
    }

    private calculateVolatility(values: number[]): number {
        if (values.length < 2) return 0;
        const avg = this.calculateAverage(values);
        if (avg === 0) return 0;

        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Normalize to 0-1 scale (coefficient of variation)
        return Math.min(stdDev / avg, 1);
    }

    private detectSeasonalPeaks(monthlyData: Record<string, number>): string[] {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthTotals: Record<number, number[]> = {};

        Object.entries(monthlyData).forEach(([key, value]) => {
            const month = parseInt(key.split('-')[1]) - 1;
            if (!monthTotals[month]) monthTotals[month] = [];
            monthTotals[month].push(value);
        });

        const monthAvgs = Object.entries(monthTotals).map(([month, values]) => ({
            month: parseInt(month),
            avg: this.calculateAverage(values)
        }));

        const overallAvg = this.calculateAverage(monthAvgs.map(m => m.avg));

        return monthAvgs
            .filter(m => m.avg > overallAvg * 1.2) // 20% above average
            .map(m => monthNames[m.month]);
    }

    private detectDayPatterns(transactions: SupabaseTransaction[]): number[] {
        const dayTotals: Record<number, number> = {};

        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            dayTotals[day] = (dayTotals[day] || 0) + 1;
        });

        const avgCount = Object.values(dayTotals).reduce((a, b) => a + b, 0) / 31;

        return Object.entries(dayTotals)
            .filter(([_, count]) => count > avgCount * 1.5)
            .map(([day]) => parseInt(day))
            .sort((a, b) => a - b);
    }

    private predictNextMonth(monthlyData: Record<string, number>, trend: { direction: string, percentage: number }): { amount: number, confidence: number } {
        const values = Object.values(monthlyData);
        if (values.length === 0) return { amount: 0, confidence: 0 };

        const recentValues = values.slice(-3);
        const baseAmount = this.calculateAverage(recentValues);

        // Apply trend
        const trendFactor = 1 + (trend.percentage / 100);
        const predicted = baseAmount * trendFactor;

        // Confidence based on data consistency
        const volatility = this.calculateVolatility(recentValues);
        const dataPointsBonus = Math.min(values.length / 6, 1) * 20; // Max 20 points for 6+ months
        const confidence = Math.max(0, Math.min(100, (1 - volatility) * 80 + dataPointsBonus));

        return { amount: Math.round(predicted), confidence: Math.round(confidence) };
    }

    // ==================== VELOCITY CALCULATION ====================

    calculateSpendingVelocity(transactions: SupabaseTransaction[]): SpendingVelocity {
        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentExpenses = expenses.filter(t => new Date(t.date) >= thirtyDaysAgo);
        const olderExpenses = expenses.filter(t => new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo);
        const recentIncome = income.filter(t => new Date(t.date) >= thirtyDaysAgo);

        const recentTotal = recentExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const olderTotal = olderExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const incomeTotal = recentIncome.reduce((s, t) => s + t.amount, 0);

        const dailyRate = recentTotal / 30;
        const weeklyRate = dailyRate * 7;
        const monthlyRate = recentTotal;

        // Calculate acceleration (change in spending rate)
        const acceleration = olderTotal > 0 ? ((recentTotal - olderTotal) / olderTotal) * 100 : 0;

        // Calculate burn rate
        const burnRate = incomeTotal > 0 ? (recentTotal / incomeTotal) * 100 : 100;

        // Days until broke (simplified - assumes current balance of remaining income)
        const remainingIncome = incomeTotal - recentTotal;
        const daysUntilBroke = dailyRate > 0 && remainingIncome > 0
            ? Math.round(remainingIncome / dailyRate)
            : remainingIncome <= 0 ? 0 : null;

        return {
            dailyRate: Math.round(dailyRate),
            weeklyRate: Math.round(weeklyRate),
            monthlyRate: Math.round(monthlyRate),
            acceleration: Math.round(acceleration),
            daysUntilBroke,
            burnRate: Math.round(burnRate)
        };
    }

    // ==================== FORECAST GENERATION - ENHANCED 2-MONTH ACCURACY ====================

    generateForecasts(
        transactions: SupabaseTransaction[],
        patterns: SpendingPattern[],
        subscriptions: Subscription[]
    ): FinancialForecast[] {
        const forecasts: FinancialForecast[] = [];
        const now = new Date();

        // Get actual expense data for accurate predictions
        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income');

        // Calculate actual monthly averages from real data
        const expensesByMonth = this.groupByMonth(expenses);
        const incomeByMonth = this.groupByMonth(income);

        const monthKeys = Object.keys(expensesByMonth).sort().slice(-3); // Last 3 months
        const incomeKeys = Object.keys(incomeByMonth).sort().slice(-3);

        // Calculate weighted average (recent months weighted more heavily)
        const calculateWeightedAvg = (monthData: Record<string, number>, keys: string[]) => {
            if (keys.length === 0) return 0;
            const weights = [0.2, 0.3, 0.5]; // Older to newer
            let total = 0;
            let weightSum = 0;

            keys.forEach((key, idx) => {
                const weight = weights[Math.max(0, weights.length - keys.length + idx)] || 0.33;
                total += (monthData[key] || 0) * weight;
                weightSum += weight;
            });

            return weightSum > 0 ? total / weightSum : 0;
        };

        // Get actual averages from real transaction data
        const actualMonthlyExpense = calculateWeightedAvg(expensesByMonth, monthKeys);
        const actualMonthlyIncome = calculateWeightedAvg(incomeByMonth, incomeKeys);

        // Fallback to pattern-based if no direct expense data
        const patternBasedExpense = patterns.reduce((sum, p) => sum + p.avgMonthlySpend, 0);
        const baseExpense = actualMonthlyExpense > 0 ? actualMonthlyExpense : patternBasedExpense;

        // Calculate monthly subscription costs
        const monthlySubCost = subscriptions
            .filter(s => s.is_active)
            .reduce((sum, s) => {
                if (s.cycle === 'yearly') return sum + s.price / 12;
                if (s.cycle === 'weekly') return sum + s.price * 4;
                return sum + s.price;
            }, 0);

        // Calculate trend from recent months
        const recentExpenses = monthKeys.map(k => expensesByMonth[k] || 0);
        const expenseTrend = this.detectTrend(recentExpenses);

        // Generate 2-month HIGH ACCURACY forecast (more reliable than 6 months)
        for (let i = 1; i <= 2; i++) {
            const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthName = forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' });

            // Apply trend factor (smaller for short-term = more accurate)
            const trendMultiplier = Math.pow(1 + (expenseTrend.percentage / 100) * 0.5, i);

            // Build category breakdown from patterns or estimate
            const breakdown: Record<string, number> = {};
            let categoryTotal = 0;

            if (patterns.length > 0) {
                patterns.forEach(p => {
                    const predicted = p.avgMonthlySpend * trendMultiplier;
                    breakdown[p.category] = Math.round(predicted);
                    categoryTotal += predicted;
                });
            } else {
                // Estimate category breakdown from actual transactions
                const categoryExpenses: Record<string, number> = {};
                expenses.slice(-50).forEach(t => {
                    const cat = t.category || 'General';
                    categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Math.abs(t.amount);
                });

                const topCategories = Object.entries(categoryExpenses)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                topCategories.forEach(([cat, amount]) => {
                    const avgAmount = amount / Math.max(1, monthKeys.length);
                    breakdown[cat] = Math.round(avgAmount * trendMultiplier);
                    categoryTotal += avgAmount * trendMultiplier;
                });
            }

            // Add subscriptions
            if (monthlySubCost > 0) {
                breakdown['Subscriptions'] = Math.round(monthlySubCost);
            }

            // Use actual expense base with trend for prediction
            const predictedExpenses = Math.round(
                (baseExpense > 0 ? baseExpense * trendMultiplier : categoryTotal) + monthlySubCost
            );

            const predictedIncome = Math.round(actualMonthlyIncome);
            const predictedSavings = predictedIncome - predictedExpenses;

            // Generate warnings based on real analysis
            const warnings: string[] = [];
            let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

            const savingsRate = predictedIncome > 0 ? (predictedSavings / predictedIncome) * 100 : 0;

            if (predictedSavings < 0) {
                riskLevel = 'critical';
                warnings.push(`Projected deficit: ${formatCurrency(Math.abs(predictedSavings))}`);
            } else if (savingsRate < 10) {
                riskLevel = 'high';
                warnings.push('Tight budget - savings below 10%');
            } else if (savingsRate < 20) {
                riskLevel = 'medium';
                warnings.push('Consider increasing savings rate');
            } else {
                warnings.push('Healthy budget projected');
            }

            // Add trend-based warnings
            if (expenseTrend.direction === 'increasing' && expenseTrend.percentage > 10) {
                warnings.push(`Spending up ${Math.round(expenseTrend.percentage)}% recently`);
            }

            forecasts.push({
                month: monthName,
                predictedExpenses,
                predictedIncome,
                predictedSavings,
                riskLevel,
                warnings,
                breakdown
            });
        }

        // Fallback: If no forecasts generated, create sample projections
        if (forecasts.length === 0) {
            for (let i = 1; i <= 2; i++) {
                const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
                const monthName = forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                forecasts.push({
                    month: monthName,
                    predictedExpenses: 0,
                    predictedIncome: 0,
                    predictedSavings: 0,
                    riskLevel: 'low',
                    warnings: ['Add transactions to enable AI forecasting'],
                    breakdown: {}
                });
            }
        }

        return forecasts;
    }

    private getMonthsOfData(transactions: SupabaseTransaction[]): number {
        if (transactions.length === 0) return 0;
        const dates = transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        return Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    }

    // ==================== HEALTH SCORE ====================

    calculateHealthScore(
        velocity: SpendingVelocity,
        patterns: SpendingPattern[],
        budgets: Budget[],
        goals: Goal[]
    ): number {
        let score = 100;

        // Deduct for high burn rate
        if (velocity.burnRate > 100) score -= 30;
        else if (velocity.burnRate > 90) score -= 20;
        else if (velocity.burnRate > 80) score -= 10;

        // Deduct for increasing spending trends
        const increasingPatterns = patterns.filter(p => p.trend === 'increasing');
        score -= increasingPatterns.length * 3;

        // Deduct for high volatility
        const highVolatility = patterns.filter(p => p.volatility > 0.5);
        score -= highVolatility.length * 2;

        // Deduct for acceleration (spending increasing faster)
        if (velocity.acceleration > 20) score -= 15;
        else if (velocity.acceleration > 10) score -= 10;
        else if (velocity.acceleration > 5) score -= 5;

        // Bonus for having goals
        score += Math.min(goals.length * 3, 10);

        // Bonus for having budgets
        score += Math.min(budgets.length * 2, 10);

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    // ==================== RISK DETECTION ====================

    detectRisks(
        transactions: SupabaseTransaction[],
        velocity: SpendingVelocity,
        budgets: Budget[],
        forecasts: FinancialForecast[]
    ): RiskAlert[] {
        const alerts: RiskAlert[] = [];
        const now = new Date();

        // 1. Overdraft Risk
        if (velocity.daysUntilBroke !== null && velocity.daysUntilBroke <= 15) {
            alerts.push({
                id: `overdraft-${now.getTime()}`,
                type: 'overdraft',
                severity: velocity.daysUntilBroke <= 5 ? 'critical' : velocity.daysUntilBroke <= 10 ? 'danger' : 'warning',
                title: '💸 Overdraft Risk Detected!',
                message: `At your current spending rate, you may run out of funds in ${velocity.daysUntilBroke} days.`,
                daysUntil: velocity.daysUntilBroke,
                probability: Math.min(100, 100 - velocity.daysUntilBroke * 5),
                preventionTip: `Try reducing daily spending by ${formatCurrency(velocity.dailyRate * 0.3)} to extend your runway.`,
                createdAt: now.toISOString()
            });
        }

        // 2. Budget Breach Predictions
        const expenses = transactions.filter(t => t.type === 'expense');
        budgets.forEach(budget => {
            const categoryExpenses = expenses.filter(t =>
                t.category?.toLowerCase() === budget.category.toLowerCase() &&
                new Date(t.date).getMonth() === now.getMonth()
            );
            const spent = categoryExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
            const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const dayOfMonth = now.getDate();
            const expectedPercent = (dayOfMonth / daysInMonth) * 100;

            if (percentUsed > expectedPercent * 1.3 && percentUsed < 100) {
                const daysLeft = daysInMonth - dayOfMonth;
                const dailyBudget = (budget.amount - spent) / daysLeft;

                alerts.push({
                    id: `budget-${budget.category}-${now.getTime()}`,
                    type: 'budget_breach',
                    severity: percentUsed > 90 ? 'danger' : 'warning',
                    title: `📊 ${budget.category} Budget at Risk`,
                    message: `You've used ${Math.round(percentUsed)}% of your ${budget.category} budget with ${daysLeft} days left.`,
                    daysUntil: dailyBudget > 0 ? Math.round((budget.amount - spent) / velocity.dailyRate) : 0,
                    probability: Math.min(100, percentUsed + 10),
                    preventionTip: `Limit ${budget.category} spending to ${formatCurrency(dailyBudget)}/day for the rest of the month.`,
                    createdAt: now.toISOString()
                });
            }
        });

        // 3. Unusual Spending Detection
        const recentWeek = expenses.filter(t => {
            const txDate = new Date(t.date);
            return (now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        });
        const weeklyTotal = recentWeek.reduce((s, t) => s + Math.abs(t.amount), 0);

        if (weeklyTotal > velocity.weeklyRate * 1.5) {
            alerts.push({
                id: `unusual-${now.getTime()}`,
                type: 'unusual_spending',
                severity: 'warning',
                title: '⚡ Unusual Spending Spike',
                message: `This week's spending is ${Math.round((weeklyTotal / velocity.weeklyRate - 1) * 100)}% above your average.`,
                daysUntil: null,
                probability: 80,
                preventionTip: 'Review this week\'s transactions for any unnecessary purchases.',
                createdAt: now.toISOString()
            });
        }

        // 4. Forecast-based risks
        const criticalMonths = forecasts.filter(f => f.riskLevel === 'critical');
        if (criticalMonths.length > 0) {
            alerts.push({
                id: `forecast-critical-${now.getTime()}`,
                type: 'budget_breach',
                severity: 'danger',
                title: '🔮 Future Deficit Predicted',
                message: `Based on your patterns, ${criticalMonths[0].month} may have a deficit of ${formatCurrency(Math.abs(criticalMonths[0].predictedSavings))}.`,
                daysUntil: 30,
                probability: 70,
                preventionTip: 'Start adjusting spending now to avoid the predicted shortfall.',
                createdAt: now.toISOString()
            });
        }

        // If no risks detected, add a sample "info" tip
        if (alerts.length === 0) {
            alerts.push({
                id: `tip-${now.getTime()}`,
                type: 'goal_miss',
                severity: 'info',
                title: '✨ Financial Health Tip',
                message: 'Your spending patterns look stable. Consider setting up a new savings goal to boost your financial health.',
                daysUntil: null,
                probability: 100,
                preventionTip: 'Create a savings goal in the Goals section to start building wealth.',
                createdAt: now.toISOString()
            });
        }

        return alerts.sort((a, b) => {
            const severityOrder = { critical: 0, danger: 1, warning: 2, info: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }

    // Clear cache
    clearCache() {
        this.cache = null;
        this.cacheExpiry = 0;
    }
}

export const moneyTwinService = new MoneyTwinService();
