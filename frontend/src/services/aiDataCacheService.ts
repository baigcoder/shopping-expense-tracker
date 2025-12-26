// AI Data Cache Service - Persistent frontend cache with Supabase realtime sync
// Caches user financial data for instant AI chatbot responses

import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CachedUserData {
    userId: string;
    lastUpdated: number;

    // Transactions
    transactions: any[];
    monthlySpent: number;
    weeklySpent: number;
    topCategory: string;
    topCategoryAmount: number;
    categoryBreakdown: Record<string, number>;

    // Subscriptions
    subscriptions: any[];
    monthlySubCost: number;
    trialCount: number;

    // Goals
    goals: any[];

    // Budgets
    budgets: any[];

    // Reminders
    upcomingReminders: any[];
}

class AIDataCacheService {
    private cache: CachedUserData | null = null;
    private channel: RealtimeChannel | null = null;
    private isLoading = false;
    private loadPromise: Promise<CachedUserData> | null = null;
    private listeners: Set<() => void> = new Set();

    // Cache TTL (5 minutes - but realtime updates keep it fresh)
    private readonly CACHE_TTL = 5 * 60 * 1000;

    /**
     * Get cached data (loads if needed)
     */
    async getCachedData(userId: string): Promise<CachedUserData> {
        // Return cached data if valid
        if (this.cache && this.cache.userId === userId) {
            const age = Date.now() - this.cache.lastUpdated;
            if (age < this.CACHE_TTL) {
                console.log('✅ AI Cache HIT - returning instant data');
                return this.cache;
            }
        }

        // If already loading, wait for it
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        // Load fresh data
        console.log('🔄 AI Cache MISS - loading data...');
        this.loadPromise = this.loadFreshData(userId);
        return this.loadPromise;
    }

    /**
     * Force refresh cache (called on data changes)
     */
    async refreshCache(userId: string): Promise<void> {
        console.log('🔄 AI Cache REFRESH triggered');
        await this.loadFreshData(userId);
        this.notifyListeners();
    }

    /**
     * Invalidate cache (data changed)
     */
    invalidate(): void {
        if (this.cache) {
            this.cache.lastUpdated = 0; // Force reload on next access
        }
    }

    /**
     * Subscribe to cache changes
     */
    subscribe(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(): void {
        this.listeners.forEach(cb => cb());
    }

    /**
     * Setup Supabase realtime for auto-refresh
     */
    setupRealtime(userId: string): void {
        // Cleanup existing channel
        if (this.channel) {
            this.channel.unsubscribe();
        }

        this.channel = supabase.channel(`ai-cache-${userId}`);

        // Listen to all relevant tables
        const tables = ['transactions', 'subscriptions', 'goals', 'budgets', 'bill_reminders'];

        tables.forEach(table => {
            this.channel!.on(
                'postgres_changes',
                { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
                () => {
                    console.log(`📡 ${table} changed - refreshing AI cache`);
                    this.refreshCache(userId);
                }
            );
        });

        this.channel.subscribe((status) => {
            console.log('🔌 AI Cache realtime:', status);
        });
    }

    /**
     * Cleanup realtime subscription
     */
    cleanup(): void {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.cache = null;
    }

    /**
     * Load fresh data from Supabase
     */
    private async loadFreshData(userId: string): Promise<CachedUserData> {
        this.isLoading = true;
        const startTime = Date.now();

        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            const next7Days = new Date();
            next7Days.setDate(next7Days.getDate() + 7);

            // Parallel fetch all data (bill_reminders is optional - may not exist)
            const [
                transactionsResult,
                subscriptionsResult,
                goalsResult,
                budgetsResult
            ] = await Promise.all([
                supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })
                    .limit(100),
                supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', userId),
                supabase
                    .from('goals')
                    .select('*')
                    .eq('user_id', userId),
                supabase
                    .from('budgets')
                    .select('*')
                    .eq('user_id', userId)
            ]);

            // Try to fetch bill_reminders separately (optional table)
            let reminders: any[] = [];
            try {
                const remindersResult = await supabase
                    .from('bill_reminders')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('due_date', now.toISOString())
                    .lte('due_date', next7Days.toISOString())
                    .order('due_date', { ascending: true });
                reminders = remindersResult.data || [];
            } catch {
                // Table may not exist - ignore
            }

            const transactions = transactionsResult.data || [];
            const subscriptions = subscriptionsResult.data || [];
            const goals = goalsResult.data || [];
            const budgets = budgetsResult.data || [];

            // Calculate stats
            const expenses = transactions.filter(t => t.type === 'expense');
            const monthlyExpenses = expenses.filter(t => new Date(t.date) >= monthStart);
            const weeklyExpenses = expenses.filter(t => new Date(t.date) >= weekStart);

            const monthlySpent = monthlyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const weeklySpent = weeklyExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            // Category breakdown
            const categoryBreakdown: Record<string, number> = {};
            monthlyExpenses.forEach(t => {
                const cat = t.category || 'Other';
                categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Math.abs(t.amount);
            });

            const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
            const topCategory = sortedCategories[0]?.[0] || 'None';
            const topCategoryAmount = sortedCategories[0]?.[1] || 0;

            // Subscription costs
            const activeSubscriptions = subscriptions.filter(s => s.is_active !== false);
            const monthlySubCost = activeSubscriptions.reduce((sum, s) => {
                if (s.cycle === 'yearly') return sum + (s.price || 0) / 12;
                if (s.cycle === 'weekly') return sum + (s.price || 0) * 4;
                return sum + (s.price || 0);
            }, 0);
            const trialCount = activeSubscriptions.filter(s => s.is_trial).length;

            // Build cache
            this.cache = {
                userId,
                lastUpdated: Date.now(),
                transactions,
                monthlySpent,
                weeklySpent,
                topCategory,
                topCategoryAmount,
                categoryBreakdown,
                subscriptions: activeSubscriptions,
                monthlySubCost,
                trialCount,
                goals,
                budgets,
                upcomingReminders: reminders
            };

            const loadTime = Date.now() - startTime;
            console.log(`✅ AI Cache loaded in ${loadTime}ms`);

            return this.cache;
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    /**
     * Build context string for AI prompt
     */
    buildContextString(data: CachedUserData): string {
        const now = new Date();

        // Format subscriptions
        const subscriptionsList = data.subscriptions.slice(0, 8).map(s =>
            `• ${s.name}: Rs ${(s.price || 0).toLocaleString()}/${s.cycle || 'monthly'}${s.is_trial ? ' (TRIAL)' : ''}`
        ).join('\n');

        // Format goals
        const goalsList = data.goals.map(g => {
            const progress = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
            const remaining = Math.max(0, g.target - g.saved);
            return `• ${g.name}: ${progress}% done (Rs ${g.saved?.toLocaleString()} / Rs ${g.target?.toLocaleString()}, need Rs ${remaining.toLocaleString()} more)`;
        }).join('\n');

        // Format budgets
        const budgetsList = data.budgets.map(b => {
            const spent = data.categoryBreakdown[b.category] || 0;
            const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
            const status = percent >= 100 ? '🔴 OVER' : percent >= 80 ? '🟡 CLOSE' : '🟢 OK';
            return `• ${b.category}: Rs ${spent.toLocaleString()} / Rs ${b.amount?.toLocaleString()} (${percent}%) ${status}`;
        }).join('\n');

        // Format reminders
        const upcomingBills = data.upcomingReminders.slice(0, 5).map(r => {
            const dueDate = new Date(r.due_date);
            const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `• ${r.title}: Rs ${(r.amount || 0).toLocaleString()} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        }).join('\n');

        // Format recent transactions
        const recentTx = data.transactions.slice(0, 10).map(t => {
            const type = t.type === 'expense' ? '💸' : '💰';
            return `${type} ${t.description || t.category}: Rs ${Math.abs(t.amount).toLocaleString()} (${t.category})`;
        }).join('\n');

        // Category breakdown
        const categoryList = Object.entries(data.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, amt]) => `• ${cat}: Rs ${amt.toLocaleString()}`)
            .join('\n');

        return `
═══════════════════════════════════════════════════════════
                    USER'S REAL FINANCIAL DATA
═══════════════════════════════════════════════════════════

📊 SPENDING OVERVIEW:
• This Month: Rs ${data.monthlySpent.toLocaleString()}
• This Week: Rs ${data.weeklySpent.toLocaleString()}
• Top Category: ${data.topCategory} (Rs ${data.topCategoryAmount.toLocaleString()})
• Total Transactions: ${data.transactions.length}

📱 SUBSCRIPTIONS (${data.subscriptions.length} active, ~Rs ${Math.round(data.monthlySubCost).toLocaleString()}/month):
${subscriptionsList || '• No subscriptions tracked yet'}
${data.trialCount > 0 ? `⚠️ ${data.trialCount} trial(s) active - watch for charges!` : ''}

🎯 SAVINGS GOALS (${data.goals.length} goals):
${goalsList || '• No goals set yet'}

📊 BUDGETS:
${budgetsList || '• No budgets set yet'}

📅 UPCOMING BILLS (Next 7 days):
${upcomingBills || '• No bills due soon'}

📝 RECENT TRANSACTIONS:
${recentTx || '• No recent transactions'}

CATEGORY SPENDING BREAKDOWN THIS MONTH:
${categoryList || '• No spending data'}
═══════════════════════════════════════════════════════════`;
    }
}

// Singleton instance
export const aiDataCache = new AIDataCacheService();
export default aiDataCache;
