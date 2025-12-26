// Bill Reminder Service with Push Notifications, Email, and Calendar
import { supabase } from '@/config/supabase';

export interface BillReminder {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    due_date: string;
    frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    category: string;
    notes?: string;
    notification_enabled: boolean;
    notification_days_before: number;
    email_enabled: boolean;
    sms_enabled: boolean;
    is_paid: boolean;
    last_paid_date?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateReminderInput {
    name: string;
    amount: number;
    due_date: string;
    frequency?: BillReminder['frequency'];
    category?: string;
    notes?: string;
    notification_enabled?: boolean;
    notification_days_before?: number;
    email_enabled?: boolean;
    sms_enabled?: boolean;
}

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Send browser push notification
export function sendPushNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
    }
}

// Get all reminders for a user
export async function getReminders(): Promise<BillReminder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Failed to fetch reminders:', error);
        return [];
    }

    return data || [];
}

// Get reminders due soon (for notification checking)
export async function getRemindersDueSoon(daysAhead: number = 7): Promise<BillReminder[]> {
    const reminders = await getReminders();
    const today = new Date();
    const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return reminders.filter(r => {
        if (r.is_paid) return false;
        const dueDate = new Date(r.due_date);
        return dueDate <= cutoff && dueDate >= today;
    });
}

// Get overdue reminders
export async function getOverdueReminders(): Promise<BillReminder[]> {
    const reminders = await getReminders();
    const today = new Date();

    return reminders.filter(r => {
        if (r.is_paid) return false;
        const dueDate = new Date(r.due_date);
        return dueDate < today;
    });
}

// Create a new reminder
export async function createReminder(input: CreateReminderInput): Promise<BillReminder | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('bills')
        .insert({
            user_id: user.id,
            name: input.name,
            amount: input.amount,
            due_date: input.due_date,
            frequency: input.frequency || 'monthly',
            category: input.category || 'Bills',
            notes: input.notes,
            notification_enabled: input.notification_enabled ?? true,
            notification_days_before: input.notification_days_before ?? 3,
            email_enabled: input.email_enabled ?? false,
            sms_enabled: input.sms_enabled ?? false,
            is_paid: false
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create reminder:', error);
        return null;
    }

    return data;
}

// Update a reminder
export async function updateReminder(id: string, updates: Partial<CreateReminderInput & { is_paid: boolean }>): Promise<BillReminder | null> {
    const { data, error } = await supabase
        .from('bills')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Failed to update reminder:', error);
        return null;
    }

    return data;
}

// Mark reminder as paid
export async function markAsPaid(id: string): Promise<BillReminder | null> {
    const reminder = await updateReminder(id, {
        is_paid: true
    });

    if (reminder && reminder.frequency !== 'once') {
        // If recurring, create next occurrence
        const nextDate = calculateNextDueDate(reminder.due_date, reminder.frequency);

        await createReminder({
            name: reminder.name,
            amount: reminder.amount,
            due_date: nextDate,
            frequency: reminder.frequency,
            category: reminder.category,
            notes: reminder.notes,
            notification_enabled: reminder.notification_enabled,
            notification_days_before: reminder.notification_days_before,
            email_enabled: reminder.email_enabled,
            sms_enabled: reminder.sms_enabled
        });
    }

    return reminder;
}

// Delete a reminder
export async function deleteReminder(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Failed to delete reminder:', error);
        return false;
    }

    return true;
}

// Check and send notifications for due bills
export async function checkAndNotify(): Promise<void> {
    const reminders = await getReminders();
    const today = new Date();

    for (const reminder of reminders) {
        if (!reminder.notification_enabled || reminder.is_paid) continue;

        const dueDate = new Date(reminder.due_date);
        const notifyDate = new Date(dueDate.getTime() - reminder.notification_days_before * 24 * 60 * 60 * 1000);

        if (today >= notifyDate && today <= dueDate) {
            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            sendPushNotification(
                `💸 Bill Due ${daysUntil === 0 ? 'Today' : `in ${daysUntil} days`}`,
                {
                    body: `${reminder.name}: $${reminder.amount.toFixed(2)}`,
                    tag: `bill-${reminder.id}`,
                    requireInteraction: true
                }
            );
        }
    }

    // Check overdue
    const overdue = await getOverdueReminders();
    if (overdue.length > 0) {
        sendPushNotification(
            `⚠️ ${overdue.length} Overdue Bill${overdue.length > 1 ? 's' : ''}`,
            {
                body: overdue.map(r => r.name).join(', '),
                tag: 'overdue-bills',
                requireInteraction: true
            }
        );
    }
}

// Generate calendar event (.ics file)
export function generateCalendarEvent(reminder: BillReminder): string {
    const dueDate = new Date(reminder.due_date);
    const dtStart = formatICSDate(dueDate);
    const dtEnd = formatICSDate(new Date(dueDate.getTime() + 60 * 60 * 1000)); // 1 hour

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cashly//Bill Reminder//EN
BEGIN:VEVENT
UID:${reminder.id}@cashly.app
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:💸 Pay ${reminder.name}
DESCRIPTION:Bill Amount: $${reminder.amount.toFixed(2)}\\n${reminder.notes || ''}
BEGIN:VALARM
TRIGGER:-P${reminder.notification_days_before}D
ACTION:DISPLAY
DESCRIPTION:Bill reminder: ${reminder.name}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

// Download calendar event
export function downloadCalendarEvent(reminder: BillReminder): void {
    const icsContent = generateCalendarEvent(reminder);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${reminder.name.replace(/\s+/g, '_')}_reminder.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Helper: Calculate next due date based on frequency
function calculateNextDueDate(currentDate: string, frequency: BillReminder['frequency']): string {
    const date = new Date(currentDate);

    switch (frequency) {
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'biweekly':
            date.setDate(date.getDate() + 14);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'quarterly':
            date.setMonth(date.getMonth() + 3);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            break;
    }

    return date.toISOString().split('T')[0];
}

// Helper: Format date for ICS
function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Start notification check interval (call on app load)
let notificationInterval: NodeJS.Timeout | null = null;

export function startNotificationScheduler(): void {
    if (notificationInterval) return;

    // Check immediately
    checkAndNotify();

    // Then check every 4 hours
    notificationInterval = setInterval(checkAndNotify, 4 * 60 * 60 * 1000);
}

export function stopNotificationScheduler(): void {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

export const reminderService = {
    getReminders,
    getRemindersDueSoon,
    getOverdueReminders,
    createReminder,
    updateReminder,
    markAsPaid,
    deleteReminder,
    requestNotificationPermission,
    sendPushNotification,
    checkAndNotify,
    generateCalendarEvent,
    downloadCalendarEvent,
    startNotificationScheduler,
    stopNotificationScheduler
};

export default reminderService;
