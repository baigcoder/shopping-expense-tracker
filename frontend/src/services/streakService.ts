// Spending Streak Service - Track consecutive days of staying under budget
import { supabase } from '../config/supabase';
import { budgetService } from './budgetService';
import { supabaseTransactionService } from './supabaseTransactionService';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastUpdated: string;
    streakHistory: { date: string; underBudget: boolean }[];
    dailyBudget: number;
    todaySpent: number;
    todayStatus: 'under' | 'over' | 'pending';
}

export const streakService = {
    // Get streak data for user
    getStreakData: async (userId: string): Promise<StreakData> => {
        try {
            // Get user's budgets to calculate daily limit
            const budgets = await budgetService.getAll(userId);
            const totalMonthlyBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
            const dailyBudget = totalMonthlyBudget > 0 ? totalMonthlyBudget / 30 : 100; // Default daily budget if none set

            // Get transactions for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const transactions = await supabaseTransactionService.getAll(userId);
            const recentTransactions = transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= thirtyDaysAgo && t.type === 'expense';
            });

            // Group transactions by date
            const dailySpending = new Map<string, number>();
            recentTransactions.forEach(t => {
                const dateKey = new Date(t.date).toISOString().split('T')[0];
                const current = dailySpending.get(dateKey) || 0;
                dailySpending.set(dateKey, current + t.amount);
            });

            // Calculate streak history (last 30 days)
            const streakHistory: { date: string; underBudget: boolean }[] = [];
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;

            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                const spent = dailySpending.get(dateKey) || 0;
                const underBudget = spent <= dailyBudget;

                streakHistory.push({ date: dateKey, underBudget });

                if (underBudget) {
                    tempStreak++;
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                } else {
                    tempStreak = 0;
                }
            }

            // Current streak is from today going back
            currentStreak = 0;
            for (let i = streakHistory.length - 1; i >= 0; i--) {
                if (streakHistory[i].underBudget) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // Today's spending
            const today = new Date().toISOString().split('T')[0];
            const todaySpent = dailySpending.get(today) || 0;
            const todayStatus = todaySpent === 0 ? 'pending' : todaySpent <= dailyBudget ? 'under' : 'over';

            return {
                currentStreak,
                longestStreak,
                lastUpdated: new Date().toISOString(),
                streakHistory: streakHistory.slice(-7), // Return last 7 days
                dailyBudget,
                todaySpent,
                todayStatus
            };
        } catch (error) {
            console.error('Error getting streak data:', error);
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastUpdated: new Date().toISOString(),
                streakHistory: [],
                dailyBudget: 0,
                todaySpent: 0,
                todayStatus: 'pending'
            };
        }
    },

    // Get motivational message based on streak
    getStreakMessage: (streak: number): { emoji: string; message: string } => {
        if (streak === 0) {
            return { emoji: '😤', message: "Fresh start. Let's go!" };
        } else if (streak <= 2) {
            return { emoji: '🌱', message: 'Building momentum...' };
        } else if (streak <= 5) {
            return { emoji: '🔥', message: "You're on fire!" };
        } else if (streak <= 10) {
            return { emoji: '💪', message: 'Beast mode activated!' };
        } else if (streak <= 20) {
            return { emoji: '🚀', message: 'Unstoppable!' };
        } else {
            return { emoji: '👑', message: 'Budget KING/QUEEN!' };
        }
    },

    // Calculate streak level (for gamification)
    getStreakLevel: (streak: number): { level: number; name: string; nextAt: number } => {
        const levels = [
            { level: 1, name: 'Beginner Saver', nextAt: 3 },
            { level: 2, name: 'Budget Buddy', nextAt: 7 },
            { level: 3, name: 'Money Master', nextAt: 14 },
            { level: 4, name: 'Finance Wizard', nextAt: 21 },
            { level: 5, name: 'Wealth Legend', nextAt: 30 },
            { level: 6, name: 'Budget God', nextAt: Infinity }
        ];

        for (const lvl of levels) {
            if (streak < lvl.nextAt) {
                return lvl;
            }
        }
        return levels[levels.length - 1];
    }
};

export default streakService;
