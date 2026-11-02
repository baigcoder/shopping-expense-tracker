import { supabase } from '../config/supabase.js';
import { sendSimpleEmail } from './emailService.js';
import { getUserSettings } from './settingsService.js';
import { formatMoneyAmount } from '../utils/aiGrounding.js';

const REMIND_WITHIN_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const ymd = (date: Date) => date.toISOString().slice(0, 10);

export function reminderText(sub: { name: string; price: number; cycle: string; trial_end_date: string }, daysLeft: number, currency: string) {
    const when = daysLeft <= 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
    const cost = Number(sub.price) > 0 ? `${formatMoneyAmount(Number(sub.price), currency)}/${sub.cycle}` : 'the full price';
    return {
        subject: `Your ${sub.name} trial ends ${when}`,
        body: `Your ${sub.name} free trial ends ${when} (${sub.trial_end_date}).\n\nUnless you cancel before then, you will be billed ${cost}.\n\nOpen Cashly to review your trials and subscriptions.`,
    };
}

// Emails each user once per trial about trials that end within 3 days. The notifications table is the "already sent" record.
export async function sendTrialReminders(now = new Date()) {
    const today = ymd(now);
    const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, name, price, cycle, trial_end_date')
        .eq('is_trial', true)
        .eq('is_active', true)
        .neq('status', 'cancelled')
        .gte('trial_end_date', today)
        .lte('trial_end_date', ymd(new Date(now.getTime() + REMIND_WITHIN_DAYS * DAY_MS)));
    if (error) throw error;

    const result = { checked: subs?.length || 0, sent: 0, skipped: 0 };

    for (const sub of subs || []) {
        const marker = `trial_end:${sub.trial_end_date}`;
        const { data: already } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', sub.user_id)
            .eq('related_id', sub.id)
            .eq('related_type', marker)
            .maybeSingle();
        if (already) { result.skipped++; continue; }

        const settings = await getUserSettings(sub.user_id).catch(() => null);
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        const email = userData?.user?.email;
        const daysLeft = Math.round((Date.parse(sub.trial_end_date) - Date.parse(today)) / DAY_MS);
        const text = reminderText(sub, daysLeft, settings?.currency || 'USD');

        // Users who turned email off still get the marker so we do not re-check them every run.
        const wantsEmail = !!email && settings?.emailNotifications !== false;
        if (wantsEmail && !(await sendSimpleEmail(email!, text.subject, text.body))) { result.skipped++; continue; }

        await supabase.from('notifications').insert({
            user_id: sub.user_id,
            title: text.subject,
            message: text.body,
            type: 'trial_reminder',
            related_id: sub.id,
            related_type: marker,
        });
        if (wantsEmail) result.sent++; else result.skipped++;
    }
    return result;
}

let timer: NodeJS.Timeout | null = null;

// Long-lived servers (Railway) run the check on a timer; serverless deploys call POST /api/cron/trial-reminders instead.
export function startTrialReminderScheduler(everyMs = 6 * 60 * 60 * 1000) {
    if (timer || process.env.TRIAL_REMINDERS_DISABLED === 'true') return;
    const run = () => sendTrialReminders().then((r) => console.log('Trial reminders:', r)).catch((e) => console.warn('Trial reminders failed:', e?.message || e));
    setTimeout(run, 60_000).unref();
    timer = setInterval(run, everyMs);
    timer.unref();
}
