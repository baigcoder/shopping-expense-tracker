// Parallel Universe Service - Alternate Reality Financial Comparisons
// "If you had followed your budget for the last 6 months, you'd have Rs 45,000 saved"
import { supabaseTransactionService, SupabaseTransaction } from './supabaseTransactionService';
import { subscriptionService, Subscription } from './subscriptionService';
import { budgetService, Budget } from './budgetService';
import { formatCurrency } from './currencyService';

// ==================== INTERFACES ====================

export type UniverseType =
    | 'perfect_budget'     // If you followed all budgets exactly
    | 'no_impulse'         // Without impulse purchases
    | 'investor_you'       // If excess went to investments
    | 'subscription_free'  // If you had no subscriptions
    | 'saver_you'          // If you saved 20% of income
    | 'frugal_you';        // If you spent 30% less overall

export interface ParallelUniverse {
    id: string;
    type: UniverseType;
    name: string;
    emoji: string;
    description: string;
    comparison: UniverseComparison;
    monthlyBreakdown: MonthlyComparison[];
    insights: string[];
    actionItems: string[];
    createdAt: string;
}

export interface UniverseComparison {
    actualSavings: number;
    parallelSavings: number;
    difference: number;
    differencePercent: number;
    actualSpent: number;
    parallelSpent: number;
    potentialInvestmentValue: number; // If difference was invested
}

export interface MonthlyComparison {
    month: string;
    actualSpent: number;
    parallelSpent: number;
    actualSaved: number;
    parallelSaved: number;
    difference: number;
    cumulativeDifference: number;
}

// Impulse indicators - categories/patterns that suggest impulse buys
const IMPULSE_INDICATORS = [
    'entertainment', 'shopping', 'food', 'dining', 'restaurant',
    'fast food', 'coffee', 'snacks', 'games', 'apps', 'streaming'
];

const IMPULSE_KEYWORDS = [
    'uber', 'doordash', 'grubhub', 'amazon', 'wish', 'aliexpress',
    'starbucks', 'mcdonald', 'pizza', 'netflix', 'spotify', 'gaming'
];

// ==================== PARALLEL UNIVERSE SERVICE ====================

class ParallelUniverseService {
    private readonly ANNUAL_RETURN = 0.07; // 7% for investment calculations
    private readonly DEFAULT_SAVINGS_RATE = 0.20; // 20% recommended savings
    private readonly FRUGAL_REDUCTION = 0.30; // 30% spending reduction

    // Get all parallel universes for a user
    async getAllUniverses(userId: string, monthsBack: number = 6): Promise<ParallelUniverse[]> {
        const universeTypes: UniverseType[] = [
            'perfect_budget',
            'no_impulse',
            'investor_you',
            'subscription_free',
            'saver_you',
            'frugal_you'
        ];

        const universes = await Promise.all(
            universeTypes.map(type => this.getUniverse(userId, type, monthsBack))
        );

        // Sort by potential savings (most impactful first)
        return universes.sort((a, b) => b.comparison.difference - a.comparison.difference);
    }

    // Get a specific parallel universe
    async getUniverse(userId: string, type: UniverseType, monthsBack: number = 6): Promise<ParallelUniverse> {
        const [transactions, subscriptions, budgets] = await Promise.all([
            supabaseTransactionService.getAll(userId),
            subscriptionService.getAll(userId).catch(() => []),
            budgetService.getAll(userId).catch(() => [])
        ]);

        // Filter to the specified time range
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
        const filteredTx = transactions.filter(t => new Date(t.date) >= cutoffDate);

        switch (type) {
            case 'perfect_budget':
                return this.perfectBudgetUniverse(filteredTx, budgets, monthsBack);
            case 'no_impulse':
                return this.noImpulseUniverse(filteredTx, monthsBack);
            case 'investor_you':
                return this.investorUniverse(filteredTx, monthsBack);
            case 'subscription_free':
                return this.subscriptionFreeUniverse(filteredTx, subscriptions, monthsBack);
            case 'saver_you':
                return this.saverUniverse(filteredTx, monthsBack);
            case 'frugal_you':
                return this.frugalUniverse(filteredTx, monthsBack);
        }
    }

    // ==================== UNIVERSE GENERATORS ====================

    private perfectBudgetUniverse(transactions: SupabaseTransaction[], budgets: Budget[], months: number): ParallelUniverse {
        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income');

        const monthlyData = this.groupByMonth(expenses);
        const monthlyIncome = this.groupByMonth(income);
        const budgetMap = new Map(budgets.map(b => [b.category.toLowerCase(), b.amount]));

        let actualTotal = 0;
        let parallelTotal = 0;
        const breakdown: MonthlyComparison[] = [];
        let cumDiff = 0;

        Object.keys(monthlyData).sort().forEach(month => {
            const monthExpenses = expenses.filter(t => t.date.startsWith(month));
            const monthIncome = monthlyIncome[month] || 0;

            let actualSpent = 0;
            let parallelSpent = 0;

            // Group by category
            const categorySpending: Record<string, number> = {};
            monthExpenses.forEach(t => {
                const cat = (t.category || 'Other').toLowerCase();
                categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(t.amount);
            });

            // Calculate parallel spending (capped at budget)
            Object.entries(categorySpending).forEach(([cat, amount]) => {
                actualSpent += amount;
                const budget = budgetMap.get(cat);
                parallelSpent += budget ? Math.min(amount, budget) : amount;
            });

            actualTotal += actualSpent;
            parallelTotal += parallelSpent;
            const diff = actualSpent - parallelSpent;
            cumDiff += diff;

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent,
                parallelSpent,
                actualSaved: monthIncome - actualSpent,
                parallelSaved: monthIncome - parallelSpent,
                difference: diff,
                cumulativeDifference: cumDiff
            });
        });

        const difference = actualTotal - parallelTotal;
        const investmentValue = this.calculateInvestmentGrowth(difference, months);

        return {
            id: `universe-perfect-${Date.now()}`,
            type: 'perfect_budget',
            name: 'Perfect Budget You',
            emoji: '📊',
            description: 'A universe where you stuck to your budgets perfectly',
            comparison: {
                actualSavings: this.getTotalIncome(transactions) - actualTotal,
                parallelSavings: this.getTotalIncome(transactions) - parallelTotal,
                difference,
                differencePercent: actualTotal > 0 ? (difference / actualTotal) * 100 : 0,
                actualSpent: actualTotal,
                parallelSpent: parallelTotal,
                potentialInvestmentValue: investmentValue
            },
            monthlyBreakdown: breakdown,
            insights: this.generateInsights('perfect_budget', difference, actualTotal),
            actionItems: this.generateActionItems('perfect_budget', difference, budgets),
            createdAt: new Date().toISOString()
        };
    }

    private noImpulseUniverse(transactions: SupabaseTransaction[], months: number): ParallelUniverse {
        const expenses = transactions.filter(t => t.type === 'expense');
        const monthlyData = this.groupByMonth(expenses);

        let actualTotal = 0;
        let parallelTotal = 0;
        const breakdown: MonthlyComparison[] = [];
        let cumDiff = 0;

        Object.keys(monthlyData).sort().forEach(month => {
            const monthExpenses = expenses.filter(t => t.date.startsWith(month));

            let actualSpent = 0;
            let impulseSpent = 0;

            monthExpenses.forEach(t => {
                const amount = Math.abs(t.amount);
                actualSpent += amount;

                // Check if impulse purchase
                const isImpulse = this.isImpulsePurchase(t);
                if (isImpulse) {
                    impulseSpent += amount;
                }
            });

            const parallelSpent = actualSpent - impulseSpent;
            actualTotal += actualSpent;
            parallelTotal += parallelSpent;
            const diff = impulseSpent;
            cumDiff += diff;

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent,
                parallelSpent,
                actualSaved: 0,
                parallelSaved: diff,
                difference: diff,
                cumulativeDifference: cumDiff
            });
        });

        const difference = actualTotal - parallelTotal;
        const investmentValue = this.calculateInvestmentGrowth(difference, months);

        return {
            id: `universe-impulse-${Date.now()}`,
            type: 'no_impulse',
            name: 'No Impulse You',
            emoji: '🧘',
            description: 'A universe where you resisted all impulse purchases',
            comparison: {
                actualSavings: this.getTotalIncome(transactions) - actualTotal,
                parallelSavings: this.getTotalIncome(transactions) - parallelTotal,
                difference,
                differencePercent: actualTotal > 0 ? (difference / actualTotal) * 100 : 0,
                actualSpent: actualTotal,
                parallelSpent: parallelTotal,
                potentialInvestmentValue: investmentValue
            },
            monthlyBreakdown: breakdown,
            insights: this.generateInsights('no_impulse', difference, actualTotal),
            actionItems: this.generateActionItems('no_impulse', difference),
            createdAt: new Date().toISOString()
        };
    }

    private investorUniverse(transactions: SupabaseTransaction[], months: number): ParallelUniverse {
        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');

        const totalIncome = income.reduce((s, t) => s + t.amount, 0);
        const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const actualSavings = totalIncome - totalExpenses;

        // In investor universe, all savings are invested monthly
        const monthlyData = this.groupByMonth(transactions);
        const breakdown: MonthlyComparison[] = [];
        let cumInvested = 0;
        let investedValue = 0;
        const monthlyRate = this.ANNUAL_RETURN / 12;

        Object.keys(monthlyData).sort().forEach((month, index) => {
            const monthIncome = income.filter(t => t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
            const monthExpenses = expenses.filter(t => t.date.startsWith(month)).reduce((s, t) => s + Math.abs(t.amount), 0);
            const monthSaved = monthIncome - monthExpenses;

            cumInvested += monthSaved;
            // Compound growth
            investedValue = (investedValue + monthSaved) * (1 + monthlyRate);

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent: monthExpenses,
                parallelSpent: monthExpenses,
                actualSaved: monthSaved,
                parallelSaved: monthSaved,
                difference: investedValue - cumInvested,
                cumulativeDifference: investedValue - cumInvested
            });
        });

        const investmentGains = investedValue - actualSavings;

        return {
            id: `universe-investor-${Date.now()}`,
            type: 'investor_you',
            name: 'Investor You',
            emoji: '📈',
            description: 'A universe where you invested all your savings',
            comparison: {
                actualSavings,
                parallelSavings: investedValue,
                difference: investmentGains,
                differencePercent: actualSavings > 0 ? (investmentGains / actualSavings) * 100 : 0,
                actualSpent: totalExpenses,
                parallelSpent: totalExpenses,
                potentialInvestmentValue: investedValue
            },
            monthlyBreakdown: breakdown,
            insights: this.generateInsights('investor_you', investmentGains, actualSavings),
            actionItems: this.generateActionItems('investor_you', investmentGains),
            createdAt: new Date().toISOString()
        };
    }

    private subscriptionFreeUniverse(
        transactions: SupabaseTransaction[],
        subscriptions: Subscription[],
        months: number
    ): ParallelUniverse {
        const expenses = transactions.filter(t => t.type === 'expense');

        // Calculate monthly subscription cost
        const monthlySubCost = subscriptions
            .filter(s => s.is_active)
            .reduce((sum, s) => {
                if (s.cycle === 'yearly') return sum + s.price / 12;
                if (s.cycle === 'weekly') return sum + s.price * 4;
                return sum + s.price;
            }, 0);

        const totalSubCost = monthlySubCost * months;
        const actualTotal = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const parallelTotal = actualTotal - totalSubCost;
        const investmentValue = this.calculateInvestmentGrowth(totalSubCost, months);

        const breakdown: MonthlyComparison[] = [];
        const monthlyData = this.groupByMonth(expenses);
        let cumDiff = 0;

        Object.keys(monthlyData).sort().forEach(month => {
            const monthSpent = monthlyData[month];
            cumDiff += monthlySubCost;

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent: monthSpent,
                parallelSpent: monthSpent - monthlySubCost,
                actualSaved: 0,
                parallelSaved: monthlySubCost,
                difference: monthlySubCost,
                cumulativeDifference: cumDiff
            });
        });

        return {
            id: `universe-subfree-${Date.now()}`,
            type: 'subscription_free',
            name: 'Subscription-Free You',
            emoji: '🔓',
            description: 'A universe with zero subscriptions',
            comparison: {
                actualSavings: this.getTotalIncome(transactions) - actualTotal,
                parallelSavings: this.getTotalIncome(transactions) - parallelTotal,
                difference: totalSubCost,
                differencePercent: actualTotal > 0 ? (totalSubCost / actualTotal) * 100 : 0,
                actualSpent: actualTotal,
                parallelSpent: parallelTotal,
                potentialInvestmentValue: investmentValue
            },
            monthlyBreakdown: breakdown,
            insights: [
                `You spend ${formatCurrency(monthlySubCost)}/month on subscriptions`,
                `That's ${formatCurrency(totalSubCost)} over ${months} months`,
                subscriptions.length > 3 ? `${subscriptions.length} subscriptions might be too many` : 'Your subscription count is reasonable'
            ],
            actionItems: [
                'Review which subscriptions you actually use weekly',
                'Cancel any trials before they renew',
                'Consider family/shared plans to reduce costs'
            ],
            createdAt: new Date().toISOString()
        };
    }

    private saverUniverse(transactions: SupabaseTransaction[], months: number): ParallelUniverse {
        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');

        const totalIncome = income.reduce((s, t) => s + t.amount, 0);
        const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const actualSavings = totalIncome - totalExpenses;
        const targetSavings = totalIncome * this.DEFAULT_SAVINGS_RATE;
        const parallelExpenses = totalIncome * (1 - this.DEFAULT_SAVINGS_RATE);
        const difference = targetSavings - actualSavings;

        const breakdown: MonthlyComparison[] = [];
        const monthlyData = this.groupByMonth(expenses);
        let cumDiff = 0;

        Object.keys(monthlyData).sort().forEach(month => {
            const monthIncome = income.filter(t => t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
            const monthExpenses = monthlyData[month];
            const targetMonthSave = monthIncome * this.DEFAULT_SAVINGS_RATE;
            const actualMonthSave = monthIncome - monthExpenses;
            const diff = targetMonthSave - actualMonthSave;
            cumDiff += diff;

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent: monthExpenses,
                parallelSpent: monthIncome * (1 - this.DEFAULT_SAVINGS_RATE),
                actualSaved: actualMonthSave,
                parallelSaved: targetMonthSave,
                difference: diff,
                cumulativeDifference: cumDiff
            });
        });

        const investmentValue = this.calculateInvestmentGrowth(Math.max(0, difference), months);

        return {
            id: `universe-saver-${Date.now()}`,
            type: 'saver_you',
            name: '20% Saver You',
            emoji: '💰',
            description: 'A universe where you saved 20% of every paycheck',
            comparison: {
                actualSavings,
                parallelSavings: targetSavings,
                difference: Math.max(0, difference),
                differencePercent: totalIncome > 0 ? (Math.max(0, difference) / totalIncome) * 100 : 0,
                actualSpent: totalExpenses,
                parallelSpent: parallelExpenses,
                potentialInvestmentValue: investmentValue
            },
            monthlyBreakdown: breakdown,
            insights: this.generateInsights('saver_you', difference, totalIncome),
            actionItems: this.generateActionItems('saver_you', difference),
            createdAt: new Date().toISOString()
        };
    }

    private frugalUniverse(transactions: SupabaseTransaction[], months: number): ParallelUniverse {
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
        const parallelExpenses = totalExpenses * (1 - this.FRUGAL_REDUCTION);
        const difference = totalExpenses - parallelExpenses;

        const breakdown: MonthlyComparison[] = [];
        const monthlyData = this.groupByMonth(expenses);
        let cumDiff = 0;

        Object.keys(monthlyData).sort().forEach(month => {
            const monthSpent = monthlyData[month];
            const parallelSpent = monthSpent * (1 - this.FRUGAL_REDUCTION);
            const diff = monthSpent - parallelSpent;
            cumDiff += diff;

            breakdown.push({
                month: this.formatMonth(month),
                actualSpent: monthSpent,
                parallelSpent,
                actualSaved: 0,
                parallelSaved: diff,
                difference: diff,
                cumulativeDifference: cumDiff
            });
        });

        const investmentValue = this.calculateInvestmentGrowth(difference, months);

        return {
            id: `universe-frugal-${Date.now()}`,
            type: 'frugal_you',
            name: 'Frugal You',
            emoji: '🪙',
            description: 'A universe where you spent 30% less on everything',
            comparison: {
                actualSavings: this.getTotalIncome(transactions) - totalExpenses,
                parallelSavings: this.getTotalIncome(transactions) - parallelExpenses,
                difference,
                differencePercent: 30,
                actualSpent: totalExpenses,
                parallelSpent: parallelExpenses,
                potentialInvestmentValue: investmentValue
            },
            monthlyBreakdown: breakdown,
            insights: this.generateInsights('frugal_you', difference, totalExpenses),
            actionItems: this.generateActionItems('frugal_you', difference),
            createdAt: new Date().toISOString()
        };
    }

    // ==================== HELPERS ====================

    private groupByMonth(transactions: SupabaseTransaction[]): Record<string, number> {
        const grouped: Record<string, number> = {};
        transactions.forEach(t => {
            const month = t.date.substring(0, 7);
            grouped[month] = (grouped[month] || 0) + Math.abs(t.amount);
        });
        return grouped;
    }

    private formatMonth(monthStr: string): string {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }

    private getTotalIncome(transactions: SupabaseTransaction[]): number {
        return transactions
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0);
    }

    private isImpulsePurchase(t: SupabaseTransaction): boolean {
        const category = (t.category || '').toLowerCase();
        const description = (t.description || '').toLowerCase();

        // Check category
        if (IMPULSE_INDICATORS.some(ind => category.includes(ind))) {
            // Small purchases in these categories are likely impulse
            if (Math.abs(t.amount) < 50) return true;
        }

        // Check description keywords
        if (IMPULSE_KEYWORDS.some(kw => description.includes(kw))) {
            return true;
        }

        // Weekend purchases are more likely impulse
        const day = new Date(t.date).getDay();
        if ((day === 0 || day === 6) && Math.abs(t.amount) < 100) {
            if (IMPULSE_INDICATORS.some(ind => category.includes(ind))) {
                return true;
            }
        }

        return false;
    }

    private calculateInvestmentGrowth(principal: number, months: number): number {
        if (principal <= 0) return 0;
        const monthlyRate = this.ANNUAL_RETURN / 12;
        return Math.round(principal * Math.pow(1 + monthlyRate, months));
    }

    private generateInsights(type: UniverseType, difference: number, base: number): string[] {
        const insights: string[] = [];
        const percent = base > 0 ? Math.round((difference / base) * 100) : 0;

        if (difference > 0) {
            insights.push(`You could have saved ${formatCurrency(difference)} more`);
            insights.push(`That's ${percent}% of your spending/income`);
        }

        switch (type) {
            case 'perfect_budget':
                insights.push('Budgets are guidelines, but consistency pays off');
                break;
            case 'no_impulse':
                insights.push('Impulse control is a muscle - it gets stronger with practice');
                break;
            case 'investor_you':
                insights.push('Time in the market beats timing the market');
                break;
            case 'saver_you':
                if (difference > 0) {
                    insights.push('The 20% rule is challenging but rewarding');
                } else {
                    insights.push('You\'re already hitting your savings targets! 🎉');
                }
                break;
        }

        return insights;
    }

    private generateActionItems(type: UniverseType, difference: number, budgets?: Budget[]): string[] {
        const items: string[] = [];

        if (difference > 0) {
            items.push(`Set a goal to save ${formatCurrency(difference / 6)}/month`);
        }

        switch (type) {
            case 'perfect_budget':
                items.push('Review and adjust unrealistic budgets');
                items.push('Set up budget alerts at 80% threshold');
                break;
            case 'no_impulse':
                items.push('Wait 24 hours before purchases over $50');
                items.push('Unsubscribe from marketing emails');
                items.push('Delete saved payment methods from shopping sites');
                break;
            case 'investor_you':
                items.push('Set up automatic investment transfers');
                items.push('Consider low-cost index funds');
                break;
            case 'saver_you':
                items.push('Automate transfers on payday');
                items.push('Start with 10% if 20% feels too aggressive');
                break;
            case 'frugal_you':
                items.push('Try a no-spend week challenge');
                items.push('Cook at home one more day per week');
                break;
        }

        return items;
    }
}

export const parallelUniverseService = new ParallelUniverseService();
