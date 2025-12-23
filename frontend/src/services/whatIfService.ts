// What-If Scenario Service - Simulate Financial Decisions
// "If I canceled Netflix and Spotify, how much would I save in 2 years?"
import { subscriptionService, Subscription } from './subscriptionService';
import { budgetService, Budget } from './budgetService';
import { goalService, Goal } from './goalService';
import { moneyTwinService, SpendingPattern } from './moneyTwinService';
import { formatCurrency } from './currencyService';

// ==================== INTERFACES ====================

export type ScenarioType =
    | 'cancel_subscription'
    | 'add_subscription'
    | 'adjust_budget'
    | 'income_change'
    | 'savings_goal'
    | 'major_purchase'
    | 'reduce_category';

export interface WhatIfScenario {
    id: string;
    type: ScenarioType;
    name: string;
    description: string;
    parameters: ScenarioParameters;
    timeframeMonths: number;
    results: ScenarioResults;
    createdAt: string;
}

export interface ScenarioParameters {
    // For subscription scenarios
    subscriptionIds?: string[];
    newSubscriptionCost?: number;
    newSubscriptionName?: string;

    // For budget scenarios
    category?: string;
    budgetChange?: number; // Positive or negative
    newBudgetAmount?: number;

    // For income scenarios
    incomeChange?: number;

    // For savings goal
    targetAmount?: number;
    monthlyContribution?: number;

    // For major purchase
    purchaseCost?: number;
    financingMonths?: number;
    interestRate?: number;

    // For category reduction
    reductionPercent?: number;
}

export interface ScenarioResults {
    totalSavings: number;
    monthlyImpact: number;
    compoundGrowth: number; // If invested at average return
    goalImpact: GoalImpact[];
    timeline: MonthlyProjection[];
    summary: string;
    recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
    pros: string[];
    cons: string[];
}

export interface GoalImpact {
    goalId: string;
    goalName: string;
    originalMonthsToComplete: number;
    newMonthsToComplete: number;
    timeSaved: number; // Months
    additionalFunding: number;
}

export interface MonthlyProjection {
    month: string;
    baselineSpending: number;
    scenarioSpending: number;
    savings: number;
    cumulativeSavings: number;
    compoundValue: number; // With investment growth
}

// ==================== WHAT-IF SERVICE ====================

class WhatIfService {
    private readonly ANNUAL_RETURN = 0.07; // 7% average annual return for compound calc

    // Main entry - run a what-if scenario
    async runScenario(
        userId: string,
        type: ScenarioType,
        parameters: ScenarioParameters,
        timeframeMonths: number = 12
    ): Promise<WhatIfScenario> {
        const id = `scenario-${Date.now()}`;

        let results: ScenarioResults;
        let name: string;
        let description: string;

        switch (type) {
            case 'cancel_subscription':
                ({ results, name, description } = await this.simulateCancelSubscription(userId, parameters, timeframeMonths));
                break;
            case 'add_subscription':
                ({ results, name, description } = await this.simulateAddSubscription(userId, parameters, timeframeMonths));
                break;
            case 'adjust_budget':
                ({ results, name, description } = await this.simulateBudgetChange(userId, parameters, timeframeMonths));
                break;
            case 'income_change':
                ({ results, name, description } = await this.simulateIncomeChange(userId, parameters, timeframeMonths));
                break;
            case 'savings_goal':
                ({ results, name, description } = await this.simulateSavingsGoal(userId, parameters, timeframeMonths));
                break;
            case 'major_purchase':
                ({ results, name, description } = await this.simulateMajorPurchase(userId, parameters, timeframeMonths));
                break;
            case 'reduce_category':
                ({ results, name, description } = await this.simulateCategoryReduction(userId, parameters, timeframeMonths));
                break;
            default:
                throw new Error(`Unknown scenario type: ${type}`);
        }

        return {
            id,
            type,
            name,
            description,
            parameters,
            timeframeMonths,
            results,
            createdAt: new Date().toISOString()
        };
    }

    // ==================== SUBSCRIPTION SCENARIOS ====================

    private async simulateCancelSubscription(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const subscriptions = await subscriptionService.getAll(userId);
        const toCancel = subscriptions.filter(s => params.subscriptionIds?.includes(s.id));

        if (toCancel.length === 0) {
            return this.emptyResults('No subscriptions selected', 'Select subscriptions to cancel');
        }

        const monthlySavings = toCancel.reduce((sum, s) => {
            if (s.cycle === 'yearly') return sum + s.price / 12;
            if (s.cycle === 'weekly') return sum + s.price * 4;
            return sum + s.price;
        }, 0);

        const subNames = toCancel.map(s => s.name).join(', ');
        const name = `Cancel ${subNames}`;
        const description = `What if you canceled ${toCancel.length} subscription(s)?`;

        const results = this.calculateResults(monthlySavings, months, userId, await goalService.getAll(userId).catch(() => []));

        return { results, name, description };
    }

    private async simulateAddSubscription(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const cost = params.newSubscriptionCost || 0;
        const name = `Add ${params.newSubscriptionName || 'New Subscription'}`;
        const description = `What if you added a ${formatCurrency(cost)}/month subscription?`;

        const results = this.calculateResults(-cost, months, userId, await goalService.getAll(userId).catch(() => []));

        return { results, name, description };
    }

    // ==================== BUDGET SCENARIOS ====================

    private async simulateBudgetChange(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const twin = await moneyTwinService.getMoneyTwin(userId);
        const category = params.category || 'Unknown';
        const pattern = twin.patterns.find(p => p.category.toLowerCase() === category.toLowerCase());

        if (!pattern) {
            return this.emptyResults('Category not found', `No spending data for ${category}`);
        }

        const currentSpend = pattern.avgMonthlySpend;
        const newBudget = params.newBudgetAmount || (currentSpend + (params.budgetChange || 0));
        const monthlySavings = currentSpend - newBudget;

        const direction = monthlySavings > 0 ? 'reduce' : 'increase';
        const name = `${direction === 'reduce' ? 'Reduce' : 'Increase'} ${category} budget`;
        const description = `What if you ${direction}d ${category} spending by ${formatCurrency(Math.abs(monthlySavings))}/month?`;

        const results = this.calculateResults(monthlySavings, months, userId, await goalService.getAll(userId).catch(() => []));

        return { results, name, description };
    }

    // ==================== INCOME SCENARIOS ====================

    private async simulateIncomeChange(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const change = params.incomeChange || 0;
        const direction = change > 0 ? 'increase' : 'decrease';
        const name = `${direction === 'increase' ? 'Raise' : 'Income drop'} of ${formatCurrency(Math.abs(change))}`;
        const description = `What if your monthly income ${direction}d by ${formatCurrency(Math.abs(change))}?`;

        const results = this.calculateResults(change, months, userId, await goalService.getAll(userId).catch(() => []));

        return { results, name, description };
    }

    // ==================== SAVINGS GOAL SCENARIOS ====================

    private async simulateSavingsGoal(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const target = params.targetAmount || 10000;
        const contribution = params.monthlyContribution || target / months;

        const name = `Save ${formatCurrency(target)}`;
        const description = `What if you saved ${formatCurrency(contribution)}/month toward ${formatCurrency(target)}?`;

        const timeline: MonthlyProjection[] = [];
        let cumulative = 0;
        const now = new Date();

        for (let i = 1; i <= months; i++) {
            cumulative += contribution;
            const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

            // Compound growth
            const monthlyRate = this.ANNUAL_RETURN / 12;
            const compoundValue = cumulative * Math.pow(1 + monthlyRate, i);

            timeline.push({
                month: monthName,
                baselineSpending: 0,
                scenarioSpending: contribution,
                savings: contribution,
                cumulativeSavings: cumulative,
                compoundValue: Math.round(compoundValue)
            });
        }

        const monthsToGoal = Math.ceil(target / contribution);
        const canAchieve = monthsToGoal <= months;

        const results: ScenarioResults = {
            totalSavings: cumulative,
            monthlyImpact: -contribution, // Negative because it's money saved, not spent
            compoundGrowth: Math.round(timeline[timeline.length - 1].compoundValue - cumulative),
            goalImpact: [],
            timeline,
            summary: canAchieve
                ? `You'll reach ${formatCurrency(target)} in ${monthsToGoal} months!`
                : `In ${months} months, you'll have ${formatCurrency(cumulative)} (${Math.round(cumulative / target * 100)}% of goal)`,
            recommendation: canAchieve ? 'highly_recommended' : 'recommended',
            pros: [
                `Build ${formatCurrency(cumulative)} in savings`,
                `Earn ~${formatCurrency(timeline[timeline.length - 1].compoundValue - cumulative)} from compound growth`,
                'Creates financial security'
            ],
            cons: [
                `Reduces monthly spending by ${formatCurrency(contribution)}`,
                'Requires consistent discipline'
            ]
        };

        return { results, name, description };
    }

    // ==================== MAJOR PURCHASE SCENARIOS ====================

    private async simulateMajorPurchase(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const cost = params.purchaseCost || 0;
        const financingMonths = params.financingMonths || 12;
        const rate = (params.interestRate || 0) / 100;

        let totalCost = cost;
        let monthlyPayment = cost / financingMonths;

        // Calculate with interest if applicable
        if (rate > 0) {
            const monthlyRate = rate / 12;
            monthlyPayment = cost * (monthlyRate * Math.pow(1 + monthlyRate, financingMonths)) /
                (Math.pow(1 + monthlyRate, financingMonths) - 1);
            totalCost = monthlyPayment * financingMonths;
        }

        const name = `Purchase for ${formatCurrency(cost)}`;
        const description = `What if you made a ${formatCurrency(cost)} purchase${rate > 0 ? ` at ${params.interestRate}% interest` : ''}?`;

        const interestPaid = totalCost - cost;
        const timeline: MonthlyProjection[] = [];
        let spent = 0;
        const now = new Date();

        for (let i = 1; i <= Math.min(financingMonths, months); i++) {
            spent += monthlyPayment;
            const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

            timeline.push({
                month: monthName,
                baselineSpending: 0,
                scenarioSpending: monthlyPayment,
                savings: -monthlyPayment,
                cumulativeSavings: -spent,
                compoundValue: -spent
            });
        }

        const results: ScenarioResults = {
            totalSavings: -totalCost,
            monthlyImpact: -monthlyPayment,
            compoundGrowth: -interestPaid,
            goalImpact: [],
            timeline,
            summary: rate > 0
                ? `Total cost with interest: ${formatCurrency(totalCost)} (${formatCurrency(interestPaid)} in interest)`
                : `Monthly payment: ${formatCurrency(monthlyPayment)} for ${financingMonths} months`,
            recommendation: rate > 15 ? 'not_recommended' : rate > 5 ? 'neutral' : 'recommended',
            pros: ['Acquire desired item now'],
            cons: [
                `Reduces monthly budget by ${formatCurrency(monthlyPayment)}`,
                ...(interestPaid > 0 ? [`Pay ${formatCurrency(interestPaid)} in interest`] : [])
            ]
        };

        return { results, name, description };
    }

    // ==================== CATEGORY REDUCTION ====================

    private async simulateCategoryReduction(
        userId: string,
        params: ScenarioParameters,
        months: number
    ): Promise<{ results: ScenarioResults; name: string; description: string }> {
        const twin = await moneyTwinService.getMoneyTwin(userId);
        const category = params.category || 'Unknown';
        const pattern = twin.patterns.find(p => p.category.toLowerCase() === category.toLowerCase());

        if (!pattern) {
            return this.emptyResults('Category not found', `No spending data for ${category}`);
        }

        const reductionPercent = params.reductionPercent || 20;
        const monthlySavings = pattern.avgMonthlySpend * (reductionPercent / 100);

        const name = `Cut ${category} by ${reductionPercent}%`;
        const description = `What if you reduced ${category} spending by ${reductionPercent}%?`;

        const results = this.calculateResults(monthlySavings, months, userId, await goalService.getAll(userId).catch(() => []));

        return { results, name, description };
    }

    // ==================== HELPERS ====================

    private calculateResults(
        monthlySavings: number,
        months: number,
        userId: string,
        goals: Goal[]
    ): ScenarioResults {
        const timeline: MonthlyProjection[] = [];
        let cumulative = 0;
        const now = new Date();
        const monthlyRate = this.ANNUAL_RETURN / 12;

        for (let i = 1; i <= months; i++) {
            cumulative += monthlySavings;
            const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });
            const compoundValue = monthlySavings > 0
                ? cumulative * Math.pow(1 + monthlyRate, i)
                : cumulative;

            timeline.push({
                month: monthName,
                baselineSpending: 0,
                scenarioSpending: -monthlySavings,
                savings: monthlySavings,
                cumulativeSavings: cumulative,
                compoundValue: Math.round(compoundValue)
            });
        }

        const totalSavings = cumulative;
        const compoundGrowth = monthlySavings > 0
            ? Math.round(timeline[timeline.length - 1].compoundValue - cumulative)
            : 0;

        // Calculate goal impacts
        const goalImpact: GoalImpact[] = goals.map(goal => {
            const remaining = goal.target - goal.saved;
            const currentMonthly = goal.saved / Math.max(1, this.monthsSinceCreated(goal));
            const originalMonths = currentMonthly > 0 ? Math.ceil(remaining / currentMonthly) : 999;
            const newMonthly = currentMonthly + (monthlySavings > 0 ? monthlySavings * 0.5 : 0); // Assume 50% goes to goals
            const newMonths = newMonthly > 0 ? Math.ceil(remaining / newMonthly) : 999;

            return {
                goalId: goal.id,
                goalName: goal.name,
                originalMonthsToComplete: Math.min(originalMonths, 999),
                newMonthsToComplete: Math.min(newMonths, 999),
                timeSaved: Math.max(0, originalMonths - newMonths),
                additionalFunding: monthlySavings * months * 0.5
            };
        });

        const recommendation = this.getRecommendation(monthlySavings, months);

        return {
            totalSavings,
            monthlyImpact: monthlySavings,
            compoundGrowth,
            goalImpact,
            timeline,
            summary: this.generateSummary(totalSavings, compoundGrowth, months),
            recommendation,
            pros: this.generatePros(monthlySavings, totalSavings, compoundGrowth),
            cons: this.generateCons(monthlySavings)
        };
    }

    private monthsSinceCreated(goal: Goal): number {
        const created = new Date(goal.created_at || Date.now());
        const now = new Date();
        return Math.max(1, Math.floor((now.getTime() - created.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    }

    private getRecommendation(monthlySavings: number, months: number): ScenarioResults['recommendation'] {
        const total = monthlySavings * months;
        if (monthlySavings > 100) return 'highly_recommended';
        if (monthlySavings > 0) return 'recommended';
        if (monthlySavings > -50) return 'neutral';
        return 'not_recommended';
    }

    private generateSummary(total: number, compound: number, months: number): string {
        if (total > 0) {
            return `Save ${formatCurrency(total)} over ${months} months. With investment growth: ${formatCurrency(total + compound)}`;
        } else {
            return `This would cost ${formatCurrency(Math.abs(total))} over ${months} months.`;
        }
    }

    private generatePros(monthly: number, total: number, compound: number): string[] {
        const pros: string[] = [];
        if (monthly > 0) {
            pros.push(`Save ${formatCurrency(monthly)} every month`);
            pros.push(`Total savings: ${formatCurrency(total)}`);
            if (compound > 0) pros.push(`Potential investment growth: ${formatCurrency(compound)}`);
        }
        return pros.length > 0 ? pros : ['Minimal financial impact'];
    }

    private generateCons(monthly: number): string[] {
        const cons: string[] = [];
        if (monthly > 0) {
            cons.push('Requires lifestyle adjustment');
        } else if (monthly < 0) {
            cons.push(`Increases monthly expenses by ${formatCurrency(Math.abs(monthly))}`);
        }
        return cons.length > 0 ? cons : ['No significant drawbacks'];
    }

    private emptyResults(name: string, description: string): { results: ScenarioResults; name: string; description: string } {
        return {
            name,
            description,
            results: {
                totalSavings: 0,
                monthlyImpact: 0,
                compoundGrowth: 0,
                goalImpact: [],
                timeline: [],
                summary: 'Unable to calculate scenario',
                recommendation: 'neutral',
                pros: [],
                cons: []
            }
        };
    }

    // ==================== QUICK SCENARIOS ====================

    // Convenience method: Cancel all trial subscriptions
    async cancelAllTrials(userId: string, months: number = 24): Promise<WhatIfScenario> {
        const subs = await subscriptionService.getAll(userId);
        const trials = subs.filter(s => s.is_trial);
        return this.runScenario(userId, 'cancel_subscription', {
            subscriptionIds: trials.map(s => s.id)
        }, months);
    }

    // Convenience method: Cut top spending category by 20%
    async cutTopCategory(userId: string, months: number = 12): Promise<WhatIfScenario> {
        const twin = await moneyTwinService.getMoneyTwin(userId);
        const topCategory = twin.patterns[0]?.category || 'Other';
        return this.runScenario(userId, 'reduce_category', {
            category: topCategory,
            reductionPercent: 20
        }, months);
    }
}

export const whatIfService = new WhatIfService();
