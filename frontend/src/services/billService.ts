// Bill Service - Manage Bills and Reminders
import { supabase } from '../config/supabase';

export interface Bill {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    due_date: string; // Day of month (1-31) or specific date
    category: string;
    is_recurring: boolean;
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
    reminder_days: number; // Days before due date to remind
    is_paid: boolean;
    last_paid_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BillReminder {
    bill: Bill;
    daysUntilDue: number;
    isOverdue: boolean;
}

class BillService {
    // Create a new bill
    async create(userId: string, billData: Omit<Bill, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Bill> {
        const { data, error } = await supabase
            .from('bills')
            .insert([{
                user_id: userId,
                ...billData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Get all bills for a user
    async getAll(userId: string): Promise<Bill[]> {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    // Get upcoming bills (due within next 30 days)
    async getUpcoming(userId: string, days: number = 30): Promise<Bill[]> {
        const bills = await this.getAll(userId);
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return bills.filter(bill => {
            if (bill.is_paid && bill.frequency === 'one-time') return false;

            const dueDate = this.getNextDueDate(bill);
            return dueDate >= today && dueDate <= futureDate;
        });
    }

    // Get bills that need reminders
    async getBillsNeedingReminders(userId: string): Promise<BillReminder[]> {
        const bills = await this.getAll(userId);
        const today = new Date();
        const reminders: BillReminder[] = [];

        bills.forEach(bill => {
            if (bill.is_paid && bill.frequency === 'one-time') return;

            const dueDate = this.getNextDueDate(bill);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;

            // Show reminder if within reminder window or overdue
            if (daysUntilDue <= bill.reminder_days || isOverdue) {
                reminders.push({
                    bill,
                    daysUntilDue,
                    isOverdue
                });
            }
        });

        return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }

    // Calculate next due date based on bill frequency
    getNextDueDate(bill: Bill): Date {
        const today = new Date();

        if (bill.frequency === 'one-time') {
            return new Date(bill.due_date);
        }

        // For recurring bills, calculate next occurrence
        const dueDay = parseInt(bill.due_date);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let nextDue = new Date(currentYear, currentMonth, dueDay);

        // If due date has passed this month, move to next period
        if (nextDue < today) {
            switch (bill.frequency) {
                case 'monthly':
                    nextDue.setMonth(nextDue.getMonth() + 1);
                    break;
                case 'quarterly':
                    nextDue.setMonth(nextDue.getMonth() + 3);
                    break;
                case 'yearly':
                    nextDue.setFullYear(nextDue.getFullYear() + 1);
                    break;
            }
        }

        return nextDue;
    }

    // Mark bill as paid
    async markAsPaid(billId: string): Promise<void> {
        const { error } = await supabase
            .from('bills')
            .update({
                is_paid: true,
                last_paid_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', billId);

        if (error) throw error;

        // If recurring, create next occurrence
        const { data: bill } = await supabase
            .from('bills')
            .select('*')
            .eq('id', billId)
            .single();

        if (bill && bill.is_recurring && bill.frequency !== 'one-time') {
            await supabase
                .from('bills')
                .update({
                    is_paid: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', billId);
        }
    }

    // Update a bill
    async update(billId: string, updates: Partial<Bill>): Promise<Bill> {
        const { data, error } = await supabase
            .from('bills')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', billId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete a bill
    async delete(billId: string): Promise<void> {
        const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', billId);

        if (error) throw error;
    }

    // Get total upcoming bills amount
    async getUpcomingTotal(userId: string, days: number = 30): Promise<number> {
        const upcoming = await this.getUpcoming(userId, days);
        return upcoming.reduce((sum, bill) => sum + bill.amount, 0);
    }
}

export const billService = new BillService();
