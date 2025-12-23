// Bill Reminders Page - Manage upcoming bills and payment reminders
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Bell, Plus, Calendar, DollarSign, Clock, Check, X,
    AlertTriangle, Trash2, Edit2, Download, RefreshCw,
    Mail, MessageSquare, CalendarCheck, ChevronRight
} from 'lucide-react';
import { reminderService, BillReminder, CreateReminderInput } from '@/services/reminderService';
import { recurringPredictionService, UpcomingBill } from '@/services/recurringPredictionService';
import { currencyService } from '@/services/currencyService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BillRemindersPage = () => {
    const [reminders, setReminders] = useState<BillReminder[]>([]);
    const [predictions, setPredictions] = useState<UpcomingBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState<BillReminder | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Load data
    useEffect(() => {
        loadData();
        checkNotificationPermission();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [remindersData, predictionsData] = await Promise.all([
                reminderService.getReminders(),
                recurringPredictionService.getUpcomingBills()
            ]);
            setReminders(remindersData);
            setPredictions(predictionsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkNotificationPermission = async () => {
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    };

    const enableNotifications = async () => {
        const granted = await reminderService.requestNotificationPermission();
        setNotificationsEnabled(granted);
        if (granted) {
            toast.success('Notifications enabled! 🔔');
            reminderService.startNotificationScheduler();
        }
    };

    const handleMarkAsPaid = async (reminder: BillReminder) => {
        await reminderService.markAsPaid(reminder.id);
        toast.success(`${reminder.name} marked as paid! ✅`);
        loadData();
    };

    const handleDelete = async (id: string) => {
        await reminderService.deleteReminder(id);
        toast.success('Reminder deleted');
        loadData();
    };

    const handleDownloadCalendar = (reminder: BillReminder) => {
        reminderService.downloadCalendarEvent(reminder);
        toast.success('Calendar event downloaded 📅');
    };

    // Stats
    const unpaidReminders = reminders.filter(r => !r.is_paid);
    const overdueReminders = reminders.filter(r => !r.is_paid && new Date(r.due_date) < new Date());
    const totalDue = unpaidReminders.reduce((sum, r) => sum + r.amount, 0);

    const getDaysUntil = (date: string) => {
        const today = new Date();
        const dueDate = new Date(date);
        return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (daysUntil: number) => {
        if (daysUntil < 0) return <Badge variant="destructive">Overdue</Badge>;
        if (daysUntil === 0) return <Badge className="bg-amber-500">Due Today</Badge>;
        if (daysUntil <= 3) return <Badge className="bg-orange-500">Due Soon</Badge>;
        return <Badge variant="secondary">{daysUntil} days</Badge>;
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
            {/* Header */}
            <motion.div
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#3B82F6] shadow-lg shadow-blue-500/20">
                            <Bell className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight font-display text-slate-800">
                            Bill Reminders
                        </h1>
                    </div>
                    <p className="text-slate-500 mt-2 ml-14">
                        Never miss a payment with smart reminders
                    </p>
                </div>

                <div className="flex gap-3">
                    {!notificationsEnabled && (
                        <Button
                            variant="outline"
                            onClick={enableNotifications}
                            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl"
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            Enable Notifications
                        </Button>
                    )}
                    <Button
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Reminder
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Unpaid Bills */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Unpaid Bills</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-3xl font-bold text-slate-800">{unpaidReminders.length}</p>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                            <Clock className="h-6 w-6 text-[#3B82F6]" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#3B82F6]"
                            initial={{ width: 0 }}
                            animate={{ width: unpaidReminders.length > 0 ? "40%" : "0%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    </div>
                </div>

                {/* Overdue */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Overdue</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-3xl font-bold text-red-600">{overdueReminders.length}</p>
                                <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Critical</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-red-50 group-hover:bg-red-100 transition-colors">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: overdueReminders.length > 0 ? "70%" : "0%" }}
                            transition={{ duration: 1, delay: 0.6 }}
                        />
                    </div>
                </div>

                {/* Total Due */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Due</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-3xl font-bold text-[#10B981]">
                                    {currencyService.formatCurrency(totalDue)}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                            <DollarSign className="h-6 w-6 text-[#10B981]" />
                        </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: totalDue > 0 ? "60%" : "0%" }}
                            transition={{ duration: 1, delay: 0.7 }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Reminders List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Your Reminders</h2>
                            <p className="text-sm text-slate-500">Manage your bill payment reminders</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="p-4 rounded-full bg-blue-50">
                                    <RefreshCw className="h-8 w-8 animate-spin text-[#3B82F6]" />
                                </div>
                                <p className="text-slate-500 font-medium">Loading your reminders...</p>
                            </div>
                        ) : unpaidReminders.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">No active reminders</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8">
                                    You don't have any pending bill reminders. Add one to stay on top of your payments!
                                </p>
                                <Button
                                    variant="outline"
                                    className="bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl px-8"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Reminder
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {unpaidReminders.map((reminder, i) => {
                                    const daysUntil = getDaysUntil(reminder.due_date);
                                    return (
                                        <motion.div
                                            key={reminder.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={cn(
                                                "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-200 group",
                                                daysUntil < 0 ? "bg-red-50/30 border-red-100 hover:border-red-200" :
                                                    daysUntil <= 3 ? "bg-amber-50/30 border-amber-100 hover:border-amber-200" :
                                                        "bg-white border-slate-100 hover:border-blue-100 hover:bg-blue-50/10 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-xl shadow-sm",
                                                    daysUntil < 0 ? "bg-red-100 text-red-600" :
                                                        daysUntil <= 3 ? "bg-amber-100 text-amber-600" :
                                                            "bg-blue-50 text-[#3B82F6]"
                                                )}>
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-800">{reminder.name}</p>
                                                        {getStatusBadge(daysUntil)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-500">
                                                            Due: {new Date(reminder.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        {reminder.frequency !== 'once' && (
                                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider ml-1 bg-white border-slate-200 text-slate-500 font-bold">
                                                                {reminder.frequency}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                                                <div className="text-right">
                                                    <p className="font-title font-bold text-xl text-slate-800">
                                                        {currencyService.formatCurrency(reminder.amount)}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">amount due</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-blue-100 hover:text-[#3B82F6] text-slate-400"
                                                        onClick={() => handleDownloadCalendar(reminder)}
                                                        title="Add to Calendar"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-100 hover:text-emerald-600 text-slate-400"
                                                        onClick={() => handleMarkAsPaid(reminder)}
                                                        title="Mark as Paid"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 rounded-xl hover:bg-red-100 hover:text-red-600 text-slate-400"
                                                        onClick={() => handleDelete(reminder.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Predicted Bills */}
            {predictions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
                        <div className="p-6 border-b border-blue-50 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1 px-2 rounded-lg bg-blue-100 text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest">
                                        Smart Prediction
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">AI Predicted Bills</h2>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    Based on your transaction history, these bills may be coming up
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {predictions.slice(0, 4).map((bill, i) => (
                                    <div
                                        key={bill.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-[#3B82F6]">
                                                    {bill.confidence}%
                                                </div>
                                                <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                                                    <circle
                                                        cx="20" cy="20" r="18"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        fill="transparent"
                                                        className="text-blue-100"
                                                    />
                                                    <circle
                                                        cx="20" cy="20" r="18"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        fill="transparent"
                                                        strokeDasharray={113}
                                                        strokeDashoffset={113 - (113 * bill.confidence) / 100}
                                                        className="text-[#3B82F6]"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{bill.name}</p>
                                                <p className="text-xs font-medium text-slate-400">
                                                    Expected: {new Date(bill.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">
                                                ~{currencyService.formatCurrency(bill.amount)}
                                            </p>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-slate-50 border-slate-200 text-slate-500">
                                                {bill.source === 'subscription' ? 'Subscription' : 'Predicted'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Add/Edit Modal */}
            <AddReminderModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingReminder(null);
                }}
                onSave={async (data) => {
                    if (editingReminder) {
                        await reminderService.updateReminder(editingReminder.id, data);
                    } else {
                        await reminderService.createReminder(data);
                    }
                    loadData();
                    setShowAddModal(false);
                    toast.success(editingReminder ? 'Reminder updated!' : 'Reminder created! 🔔');
                }}
                initialData={editingReminder}
            />
        </div>
    );
};

// Add Reminder Modal
interface AddReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateReminderInput) => void;
    initialData?: BillReminder | null;
}

const AddReminderModal = ({ isOpen, onClose, onSave, initialData }: AddReminderModalProps) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState<BillReminder['frequency']>('monthly');
    const [category, setCategory] = useState('Bills');
    const [notifyDays, setNotifyDays] = useState('3');
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setAmount(String(initialData.amount));
            setDueDate(initialData.due_date);
            setFrequency(initialData.frequency);
            setCategory(initialData.category);
            setNotifyDays(String(initialData.notification_days_before));
            setEmailEnabled(initialData.email_enabled);
        } else {
            // Default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDueDate(tomorrow.toISOString().split('T')[0]);
        }
    }, [initialData, isOpen]);

    const handleSubmit = async () => {
        if (!name || !amount || !dueDate) return;

        setSaving(true);
        try {
            await onSave({
                name,
                amount: parseFloat(amount),
                due_date: dueDate,
                frequency,
                category,
                notification_days_before: parseInt(notifyDays),
                email_enabled: emailEnabled,
                notification_enabled: true
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="relative p-8 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                        <div className="relative flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                                <Bell className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    {initialData ? 'Edit Reminder' : 'Add Bill Reminder'}
                                </h1>
                                <p className="text-blue-100 text-sm font-medium">
                                    {initialData ? 'Update your bill payment details' : 'Set up a new payment notification'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bill Name</label>
                                <div className="relative mt-1.5 min-w-[300px]">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Bell className="h-4 w-4" />
                                    </div>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Netflix, Electric Bill"
                                        className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                            Rs
                                        </div>
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <Input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="pl-11 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as BillReminder['frequency'])}
                                        className="w-full h-12 pl-4 pr-10 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 focus:ring-[#3B82F6] focus:border-[#3B82F6] appearance-none transition-all"
                                    >
                                        <option value="once">One-time</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Remind me</label>
                                    <select
                                        value={notifyDays}
                                        onChange={(e) => setNotifyDays(e.target.value)}
                                        className="w-full h-12 pl-4 pr-10 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 focus:ring-[#3B82F6] focus:border-[#3B82F6] appearance-none transition-all"
                                    >
                                        <option value="1">1 day before</option>
                                        <option value="3">3 days before</option>
                                        <option value="7">1 week before</option>
                                        <option value="14">2 weeks before</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between group transition-all hover:bg-blue-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
                                    <Mail className="h-5 w-5 text-[#3B82F6]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Email Notifications</p>
                                    <p className="text-[10px] font-medium text-slate-500">Get reminders in your inbox</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEmailEnabled(!emailEnabled)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all duration-300 relative",
                                    emailEnabled ? "bg-[#3B82F6]" : "bg-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                    emailEnabled ? "left-7" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 pt-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                onClick={handleSubmit}
                                disabled={!name || !amount || !dueDate || saving}
                            >
                                {saving ? (
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Bell className="mr-2 h-5 w-5" />
                                )}
                                {initialData ? 'Save Changes' : 'Create Reminder'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BillRemindersPage;
