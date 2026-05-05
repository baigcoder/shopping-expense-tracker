import { supabase } from '../config/supabase.js';
import { GenerateReportInput } from '../validators/schemas.js';

const asRows = (value: unknown): any[] => Array.isArray(value) ? value : [];
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

async function safeRows(table: string, userId: string, orderColumn = 'created_at') {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order(orderColumn, { ascending: false });

    if (error) {
        console.warn(`Optional table ${table} unavailable: ${error.message}`);
        return [];
    }
    return asRows(data);
}

export async function getCashflowCalendar(userId: string) {
    const [transactions, bills, subscriptions, goals, recurring] = await Promise.all([
        safeRows('transactions', userId, 'date'),
        safeRows('bills', userId, 'created_at'),
        safeRows('subscriptions', userId, 'created_at'),
        safeRows('goals', userId, 'created_at'),
        safeRows('recurring_transactions', userId, 'next_due_date'),
    ]);

    const events = [
        ...transactions.map((tx) => ({
            id: `tx-${tx.id}`,
            type: tx.type === 'income' ? 'income' : 'expense',
            title: tx.description,
            amount: Number(tx.amount || 0),
            date: tx.date || tx.created_at,
            source: 'transactions',
            raw: tx,
        })),
        ...bills.map((bill) => ({
            id: `bill-${bill.id}`,
            type: 'bill',
            title: bill.name,
            amount: Number(bill.amount || 0),
            date: bill.next_due_date || bill.due_date || today(),
            source: 'bills',
            raw: bill,
        })),
        ...subscriptions.filter((sub) => sub.is_active !== false).map((sub) => ({
            id: `sub-${sub.id}`,
            type: 'subscription',
            title: sub.name,
            amount: Number(sub.price || 0),
            date: sub.next_payment_date || sub.renew_date || sub.trial_end_date || today(),
            source: 'subscriptions',
            raw: sub,
        })),
        ...goals.map((goal) => ({
            id: `goal-${goal.id}`,
            type: 'goal',
            title: goal.name || goal.title,
            amount: Number(goal.target_amount || goal.target || 0),
            date: goal.deadline || goal.target_date || today(),
            source: 'goals',
            raw: goal,
        })),
        ...recurring.filter((item) => item.is_active !== false).map((item) => ({
            id: `recurring-${item.id}`,
            type: 'predicted',
            title: item.name,
            amount: Number(item.amount || 0),
            date: item.next_due_date,
            source: 'recurring_transactions',
            raw: item,
        })),
    ].filter((event) => event.date);

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return events;
}

export async function getSubscriptionCommandCenter(userId: string) {
    const [subscriptions, transactions] = await Promise.all([
        safeRows('subscriptions', userId, 'created_at'),
        safeRows('transactions', userId, 'date'),
    ]);

    const active = subscriptions.filter((sub) => sub.is_active !== false && sub.status !== 'cancelled');
    const now = new Date();
    const soon = addDays(now, 7);
    const trialsEndingSoon = active.filter((sub) => sub.is_trial && sub.trial_end_date && new Date(sub.trial_end_date) <= soon);

    const byMerchant = new Map<string, any[]>();
    transactions.forEach((tx) => {
        const key = String(tx.store_name || tx.description || '').toLowerCase();
        if (!key) return;
        byMerchant.set(key, [...(byMerchant.get(key) || []), tx]);
    });

    const priceIncreases = active.flatMap((sub) => {
        const key = String(sub.name || '').toLowerCase();
        const matches = [...byMerchant.entries()]
            .filter(([merchant]) => merchant.includes(key) || key.includes(merchant))
            .flatMap(([, rows]) => rows)
            .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
        if (matches.length < 2) return [];
        const latest = Number(matches[0].amount || 0);
        const previous = Number(matches[1].amount || 0);
        return latest > previous ? [{ subscription: sub, latest, previous, delta: latest - previous }] : [];
    });

    const unusedAlerts = active.filter((sub) => {
        const key = String(sub.name || '').toLowerCase();
        return !transactions.some((tx) => String(tx.description || tx.store_name || '').toLowerCase().includes(key));
    }).map((sub) => ({
        subscription: sub,
        reason: 'No matching transaction activity found in recent data',
    }));

    const monthlyCost = active.reduce((sum, sub) => {
        const price = Number(sub.price || 0);
        if (sub.cycle === 'yearly') return sum + price / 12;
        if (sub.cycle === 'weekly') return sum + price * 4;
        return sum + price;
    }, 0);

    return {
        active,
        trialsEndingSoon,
        priceIncreases,
        unusedAlerts,
        cancellationHints: active.map((sub) => ({
            subscriptionId: sub.id,
            name: sub.name,
            hint: `Open ${sub.name} account billing settings and look for cancellation or plan management.`,
        })),
        totals: {
            activeCount: active.length,
            monthlyCost,
            yearlyCost: monthlyCost * 12,
        },
    };
}

export async function recordExtensionHealthEvent(userId: string, input: Record<string, any>) {
    const eventType = input.eventType || input.event_type || 'status';
    const siteHostname = input.siteHostname || input.site_hostname || null;
    const siteName = input.siteName || input.site_name || siteHostname;
    const payload = {
        user_id: userId,
        event_type: eventType,
        status: input.status || 'info',
        site_hostname: siteHostname,
        queued_count: input.queuedCount ?? input.queued_count ?? 0,
        failed_count: input.failedCount ?? input.failed_count ?? 0,
        permission_status: input.permissionStatus || input.permission_status || null,
        message: input.message || null,
        details: input.details || input,
    };

    const { data, error } = await supabase
        .from('extension_health_events')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    if (siteHostname) {
        await supabase
            .from('extension_site_stats')
            .upsert({
                user_id: userId,
                hostname: siteHostname,
                site_name: siteName,
                visit_count: eventType === 'site_visit' ? 1 : 0,
                detection_count: eventType === 'detected_transaction' ? 1 : 0,
                last_visited: new Date().toISOString(),
                last_detection_at: eventType === 'detected_transaction' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,hostname' });
    }

    return data;
}

export async function getExtensionHealth(userId: string) {
    const [eventsResult, sitesResult] = await Promise.all([
        supabase.from('extension_health_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('extension_site_stats').select('*').eq('user_id', userId).order('last_visited', { ascending: false }).limit(100),
    ]);

    if (eventsResult.error) throw eventsResult.error;
    if (sitesResult.error) throw sitesResult.error;

    const events = asRows(eventsResult.data);
    return {
        sites: asRows(sitesResult.data),
        recentEvents: events,
        queuedSyncs: events.find((event) => Number(event.queued_count) > 0)?.queued_count || 0,
        failedDetections: events.filter((event) => event.status === 'error' || Number(event.failed_count) > 0).length,
        lastSuccessfulSync: events.find((event) => event.event_type === 'sync' && event.status === 'success')?.created_at || null,
        permissionStatus: events.find((event) => event.permission_status)?.permission_status || 'unknown',
    };
}

export async function generateReport(userId: string, input: GenerateReportInput) {
    const reportType = input.reportType || input.report_type || 'monthly_summary';
    const startDate = input.startDate || input.start_date;
    const endDate = input.endDate || input.end_date;

    let query = supabase.from('transactions').select('*').eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    const transactions = asRows(data);

    const expenseRows = transactions.filter((tx) => tx.type !== 'income');
    const incomeRows = transactions.filter((tx) => tx.type === 'income');
    const groupBy = (keyFn: (tx: any) => string) => expenseRows.reduce((acc, tx) => {
        const key = keyFn(tx) || 'Other';
        acc[key] = (acc[key] || 0) + Number(tx.amount || 0);
        return acc;
    }, {} as Record<string, number>);

    const summary = {
        reportType,
        transactionCount: transactions.length,
        totalIncome: incomeRows.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
        totalExpense: expenseRows.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
        byCategory: groupBy((tx) => tx.category),
        byMerchant: groupBy((tx) => tx.store_name || String(tx.description || '').split(' ')[0]),
        deductibleCandidates: reportType === 'tax'
            ? expenseRows.filter((tx) => ['Business', 'Office', 'Travel', 'Healthcare', 'Education'].includes(tx.category))
            : [],
    };

    const { data: exportRow, error: exportError } = await supabase
        .from('report_exports')
        .insert({
            user_id: userId,
            report_type: reportType,
            name: `${reportType.replace(/_/g, ' ')} report`,
            start_date: startDate || null,
            end_date: endDate || null,
            format: input.format || 'preview',
            summary,
        })
        .select()
        .single();

    if (exportError) throw exportError;
    return { report: exportRow, summary, transactions };
}

export async function getReportExports(userId: string) {
    const { data, error } = await supabase
        .from('report_exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return asRows(data);
}

const weekBounds = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    const end = addDays(start, 6);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
};

export async function getCurrentCoachPlan(userId: string) {
    const week = weekBounds();
    const { data: plan, error } = await supabase
        .from('coach_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', week.start)
        .maybeSingle();

    if (error) throw error;
    if (!plan) return null;

    const { data: actions, error: actionsError } = await supabase
        .from('coach_actions')
        .select('*')
        .eq('plan_id', plan.id)
        .order('created_at', { ascending: true });

    if (actionsError) throw actionsError;
    return { plan, actions: asRows(actions) };
}

export async function generateWeeklyCoachPlan(userId: string) {
    const existing = await getCurrentCoachPlan(userId);
    if (existing) return existing;

    const [transactions, subscriptions, goals] = await Promise.all([
        safeRows('transactions', userId, 'date'),
        safeRows('subscriptions', userId, 'created_at'),
        safeRows('goals', userId, 'created_at'),
    ]);
    const week = weekBounds();
    const totalExpense = transactions.filter((tx) => tx.type !== 'income').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const monthlySubs = subscriptions.reduce((sum, sub) => sum + Number(sub.price || 0), 0);

    const { data: plan, error } = await supabase
        .from('coach_plans')
        .insert({
            user_id: userId,
            week_start: week.start,
            week_end: week.end,
            summary: 'Three focused actions for this week.',
            streak: 0,
        })
        .select()
        .single();

    if (error) throw error;

    const actions = [
        {
            plan_id: plan.id,
            user_id: userId,
            action_type: 'spending',
            title: 'Review top spending category',
            description: `Check your largest recent expense group and cut one avoidable purchase. Recent expense baseline: ${totalExpense.toFixed(2)}.`,
            target_amount: Math.max(5, Math.round(totalExpense * 0.03)),
        },
        {
            plan_id: plan.id,
            user_id: userId,
            action_type: 'savings',
            title: goals.length ? 'Move progress toward one goal' : 'Create one savings goal',
            description: goals.length ? 'Add a small contribution to your most important active goal.' : 'Create a simple emergency or purchase goal to anchor savings behavior.',
            target_amount: 10,
        },
        {
            plan_id: plan.id,
            user_id: userId,
            action_type: 'subscription',
            title: 'Audit subscriptions',
            description: `Review active subscriptions and cancel or downgrade one low-value service. Current monthly subscription baseline: ${monthlySubs.toFixed(2)}.`,
            target_amount: Math.max(5, Math.round(monthlySubs * 0.1)),
        },
    ];

    const { data: createdActions, error: actionError } = await supabase
        .from('coach_actions')
        .insert(actions)
        .select();

    if (actionError) throw actionError;
    return { plan, actions: asRows(createdActions) };
}

export async function updateCoachAction(userId: string, id: string, status: 'pending' | 'done' | 'skipped') {
    const { data, error } = await supabase
        .from('coach_actions')
        .update({
            status,
            completed_at: status === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}
