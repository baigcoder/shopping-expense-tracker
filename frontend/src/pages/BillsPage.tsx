import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './BillsPage.module.css';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock3,
    FileText,
    Loader2,
    Plus,
    ReceiptText,
    RefreshCw,
    Trash2,
    Wallet,
    Zap,
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '../store/useStore';
import { billService, Bill } from '../services/billService';
import { formatCurrency } from '../services/currencyService';
import { supabase } from '../config/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Frequency = Bill['frequency'];

type BillFormState = {
    name: string;
    amount: string;
    dueDate: string;
    category: string;
    frequency: Frequency;
    reminderDays: string;
    notes: string;
};

type BillStatusTone = 'paid' | 'overdue' | 'soon' | 'upcoming';

const initialFormState: BillFormState = {
    name: '',
    amount: '',
    dueDate: '',
    category: 'Utilities',
    frequency: 'monthly',
    reminderDays: '3',
    notes: '',
};

const formatDateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const getBillToneClasses = (tone: BillStatusTone) => {
    switch (tone) {
        case 'paid':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'overdue':
            return 'border-rose-200 bg-rose-50 text-rose-700';
        case 'soon':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        default:
            return 'border-blue-200 bg-blue-50 text-blue-700';
    }
};

const getBillPresentation = (bill: Bill) => {
    const nextDueDate = billService.getNextDueDate(bill);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysUntilDue = Math.ceil((nextDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    if (bill.is_paid && bill.frequency === 'one-time') {
        return {
            nextDueDate,
            daysUntilDue,
            tone: 'paid' as BillStatusTone,
            statusLabel: 'Paid',
            helperText: bill.last_paid_date ? `Paid on ${formatDateLabel(new Date(bill.last_paid_date))}` : 'Already settled',
        };
    }

    if (daysUntilDue < 0) {
        return {
            nextDueDate,
            daysUntilDue,
            tone: 'overdue' as BillStatusTone,
            statusLabel: 'Overdue',
            helperText: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} late`,
        };
    }

    if (daysUntilDue <= bill.reminder_days) {
        return {
            nextDueDate,
            daysUntilDue,
            tone: 'soon' as BillStatusTone,
            statusLabel: daysUntilDue === 0 ? 'Due today' : 'Due soon',
            helperText: daysUntilDue === 0 ? 'Needs attention today' : `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} left`,
        };
    }

    return {
        nextDueDate,
        daysUntilDue,
        tone: 'upcoming' as BillStatusTone,
        statusLabel: 'Upcoming',
        helperText: `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} until due`,
    };
};

const BillsPage = () => {
    const { user } = useAuthStore();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<BillFormState>(initialFormState);

    const loadBills = useCallback(async (background = false) => {
        if (!user?.id) {
            setBills([]);
            setLoading(false);
            return;
        }

        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const data = await billService.getAll(user.id);
            setBills(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bills');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void loadBills();
    }, [loadBills]);

    useEffect(() => {
        if (!user?.id) return;

        const handleChange = () => {
            void loadBills(true);
        };

        window.addEventListener('bill-reminder-changed', handleChange);
        window.addEventListener('reminder-changed', handleChange);

        const channel: RealtimeChannel = supabase.channel(`bills-page-${user.id}`);
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` },
            handleChange,
        );
        channel.subscribe();

        return () => {
            window.removeEventListener('bill-reminder-changed', handleChange);
            window.removeEventListener('reminder-changed', handleChange);
            channel.unsubscribe();
        };
    }, [loadBills, user?.id]);

    const decoratedBills = useMemo(() => bills.map((bill) => ({
        bill,
        ...getBillPresentation(bill),
    })), [bills]);

    const summary = useMemo(() => {
        const activeBills = decoratedBills.filter(({ tone }) => tone !== 'paid');
        const overdue = decoratedBills.filter(({ tone }) => tone === 'overdue');
        const dueSoon = decoratedBills.filter(({ tone }) => tone === 'soon');
        const monthlyRunRate = bills
            .filter((bill) => bill.frequency === 'monthly' && !bill.is_paid)
            .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
        const nextDue = activeBills
            .slice()
            .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())[0];

        return {
            total: bills.length,
            overdueCount: overdue.length,
            dueSoonCount: dueSoon.length,
            monthlyRunRate,
            nextDue,
        };
    }, [bills, decoratedBills]);

    const handleCreateBill = async () => {
        if (!user?.id) return;
        if (!form.name.trim() || !form.amount || !form.dueDate) {
            setError('Name, amount, and due date are required.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const chosenDate = new Date(form.dueDate);
            const dueDateValue = form.frequency === 'one-time'
                ? form.dueDate
                : `${chosenDate.getDate()}`;

            await billService.create(user.id, {
                name: form.name.trim(),
                amount: Number(form.amount),
                due_date: dueDateValue,
                category: form.category,
                is_recurring: form.frequency !== 'one-time',
                frequency: form.frequency,
                reminder_days: Number(form.reminderDays || 3),
                is_paid: false,
                last_paid_date: undefined,
                notes: form.notes.trim() || undefined,
            });

            setForm(initialFormState);
            setDialogOpen(false);
            void loadBills(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create bill');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async (bill: Bill) => {
        try {
            setError(null);
            await billService.markAsPaid(bill.id);
            void loadBills(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update bill');
        }
    };

    const handleDelete = async (bill: Bill) => {
        try {
            setError(null);
            await billService.delete(bill.id);
            void loadBills(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete bill');
        }
    };

    return (
        <main className={styles.mainContent}>
            <div className={styles.topBar}>
                <div className={styles.brandSection}>
                    <div className={styles.brandLogo}>
                        <ReceiptText className="h-8 w-8" strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className={styles.brandName}>CASHLY / BILLS</h2>
                        <p className={styles.brandPage}>Mission Control</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => setDialogOpen(true)} className={styles.addBtn}>
                        <Plus className="h-5 w-5" strokeWidth={3} />
                        DEPLOY BILL
                    </button>
                    {user && (user as any)?.user_metadata?.avatar_url && (
                        <img 
                            src={(user as any).user_metadata.avatar_url} 
                            className="w-12 h-12 border-4 border-black object-cover" 
                            alt="Profile" 
                        />
                    )}
                </div>
            </div>

            <div className={styles.contentArea}>
                <div className={styles.heroSection}>
                    <div className={styles.heroCard}>
                        <div className={styles.heroIcon}>
                            <AlertTriangle className="h-9 w-9" strokeWidth={3} />
                        </div>
                        <div className={styles.heroContent}>
                            <span className={styles.heroLabel}>Pending Pressure</span>
                            <div className={styles.heroValue}>{summary.overdueCount + summary.dueSoonCount}</div>
                            <div className={styles.heroBadge}>IMMEDIATE ACTION</div>
                        </div>
                    </div>

                    <div className={cn(styles.heroCard, styles.urgentHero)}>
                        <div className={styles.heroIcon}>
                            <Zap className="h-9 w-9" strokeWidth={3} />
                        </div>
                        <div className={styles.heroContent}>
                            <span className={styles.heroLabel}>Critical Burn</span>
                            <div className={styles.heroValue}>{formatCurrency(summary.monthlyRunRate)}</div>
                            <div className={styles.heroBadge}>MONTHLY RUN RATE</div>
                        </div>
                    </div>

                    <div className={styles.heroCard}>
                        <div className={styles.heroIcon}>
                            <CheckCircle2 className="h-9 w-9" strokeWidth={3} />
                        </div>
                        <div className={styles.heroContent}>
                            <span className={styles.heroLabel}>Missions Active</span>
                            <div className={styles.heroValue}>{summary.total}</div>
                            <div className={styles.heroBadge}>TOTAL BILLS</div>
                        </div>
                    </div>
                </div>

                {error && (
                    <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                            <p>{error}</p>
                        </div>
                    </section>
                )}

                <div className={styles.tabSection}>
                    <div className={styles.tabs}>
                        <button className={cn(styles.tab, styles.activeTab)}>Live Feed</button>
                        <button className={styles.tab} onClick={() => void loadBills(true)}>
                            Sync Data
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-[400px] items-center justify-center">
                        <div className="flex items-center gap-4 border-4 border-black p-8 bg-white shadow-[8px_8px_0px_#000000]">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                            <span className="font-black uppercase italic text-xl">Loading Intel...</span>
                        </div>
                    </div>
                ) : decoratedBills.length === 0 ? (
                    <div className="border-4 border-dashed border-black p-20 text-center bg-white">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center border-4 border-black bg-red-100 text-red-600 mb-8 shadow-[6px_6px_0px_#000000]">
                            <FileText className="h-10 w-10" strokeWidth={3} />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic mb-4">Zero Obligations</h3>
                        <p className="text-black opacity-60 font-bold max-w-md mx-auto mb-8">Deploy your first bill mission to start tracking your financial battlefield.</p>
                        <button
                            className="h-16 px-10 bg-black text-white font-black uppercase tracking-widest border-4 border-black shadow-[8px_8px_0px_#E11D48]"
                            onClick={() => setDialogOpen(true)}
                        >
                            DEPLOY FIRST MISSION
                        </button>
                    </div>
                ) : (
                    <div className={styles.billsGrid}>
                        {decoratedBills
                            .slice()
                            .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
                            .map(({ bill, nextDueDate, statusLabel, helperText, tone, daysUntilDue }) => (
                                <article key={bill.id} className={cn(styles.billCard, tone === 'overdue' && styles.critical)}>
                                    <div className={styles.calendarHeader}>
                                        <span className={styles.calendarMonth}>
                                            {nextDueDate.toLocaleString('en-US', { month: 'short' })}
                                        </span>
                                        <span className={styles.calendarDay}>
                                            {nextDueDate.getDate()}
                                        </span>
                                    </div>

                                    <div className={styles.billContent}>
                                        <div className={styles.billTop}>
                                            <div className={styles.billInfo}>
                                                <h4>{bill.name}</h4>
                                                <span className={styles.billCategory}>{bill.category}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => void handleDelete(bill)}
                                                    className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.billAmount}>{formatCurrency(bill.amount)}</div>

                                        <div className={styles.countdown}>
                                            {statusLabel} • {helperText}
                                        </div>

                                        {tone === 'paid' ? (
                                            <div className={styles.paidBadge}>
                                                MISSION COMPLETED
                                            </div>
                                        ) : (
                                            <button
                                                className={styles.payBtn}
                                                onClick={() => void handleMarkPaid(bill)}
                                            >
                                                EXECUTE PAYMENT
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[560px] bg-[#0f111a] border-white/10 text-white shadow-2xl shadow-blue-500/10 rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-white">Add a new bill</DialogTitle>
                        <DialogDescription className="text-white/50 font-medium">
                            Create a one-time or recurring bill and track it on the `/bills` page.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-white/70">Bill name</label>
                            <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Electricity, Rent, Internet..." />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Amount</label>
                                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Due date</label>
                                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl [color-scheme:dark]" type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Frequency</label>
                                <Select value={form.frequency} onValueChange={(value: Frequency) => setForm((prev) => ({ ...prev, frequency: value }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f111a] border-white/10 text-white rounded-xl">
                                        <SelectItem value="one-time" className="focus:bg-white/10 focus:text-white">One time</SelectItem>
                                        <SelectItem value="monthly" className="focus:bg-white/10 focus:text-white">Monthly</SelectItem>
                                        <SelectItem value="quarterly" className="focus:bg-white/10 focus:text-white">Quarterly</SelectItem>
                                        <SelectItem value="yearly" className="focus:bg-white/10 focus:text-white">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Reminder days</label>
                                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" type="number" min="0" max="30" value={form.reminderDays} onChange={(e) => setForm((prev) => ({ ...prev, reminderDays: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Category</label>
                                <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Utilities" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold text-white/70">Stored due mode</label>
                                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
                                    {form.frequency === 'one-time'
                                        ? 'Exact calendar date will be saved.'
                                        : 'Day-of-month will be saved for recurring billing.'}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-white/70">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Optional note or account reference"
                                className="min-h-[96px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20" onClick={() => void handleCreateBill()} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Save bill
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
};

export default BillsPage;
