// Bill Reminders Page - Cashly Premium Bill Management
// Midnight Coral Theme - Light Mode
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Plus, Calendar, DollarSign, Clock, Check, X,
    AlertTriangle, Trash2, Edit2, Download, RefreshCw,
    Mail, Sparkles, Timer, CreditCard, ChevronRight
} from 'lucide-react';
import { reminderService, BillReminder, CreateReminderInput } from '@/services/reminderService';
import { recurringPredictionService, UpcomingBill } from '@/services/recurringPredictionService';
import { currencyService } from '@/services/currencyService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import styles from './BillRemindersPage.module.css';
import { BillRemindersSkeleton } from '../components/LoadingSkeleton';

const BillRemindersPage = () => {
    const [reminders, setReminders] = useState<BillReminder[]>([]);
    const [predictions, setPredictions] = useState<UpcomingBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState<BillReminder | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Initial Data Fetch
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
            toast.error('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Stats Calculations
    const unpaidReminders = reminders.filter(r => !r.is_paid);
    const overdueReminders = reminders.filter(r => !r.is_paid && new Date(r.due_date) < new Date());
    const totalDue = unpaidReminders.reduce((sum, r) => sum + r.amount, 0);

    const getDaysUntil = (date: string) => {
        const today = new Date();
        const dueDate = new Date(date);
        return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className={styles.mainContent}>
                <BillRemindersSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            <div className={styles.contentArea}>
                {/* Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Bell size={28} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Bill Reminders
                                <div className={styles.liveBadge}>SMART FLOW</div>
                            </h1>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                                Tracking {unpaidReminders.length} upcoming obligations
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className={cn(styles.actionBtn, "h-14 px-6 rounded-2xl border-2")}
                            onClick={loadData}
                            style={{ width: 'auto' }}
                        >
                            <RefreshCw size={18} className="mr-2" />
                            <span className="text-xs font-black uppercase tracking-widest">Refresh</span>
                        </button>
                        <button
                            className="h-14 px-8 rounded-2xl bg-[#3B82F6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={18} />
                            Create Reminder
                        </button>
                    </div>
                </motion.header>

                {/* Status Overviews */}
                <motion.div
                    className={styles.statsRow}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className={styles.premiumStatCard} variants={itemVariants}>
                        <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <Clock size={24} />
                        </div>
                        <p className={styles.statLabel}>Pending Bills</p>
                        <h3 className={styles.statValue}>{unpaidReminders.length}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#3b82f6' }}
                                initial={{ width: 0 }}
                                animate={{ width: unpaidReminders.length > 0 ? '45%' : '0%' }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={itemVariants}>
                        <div className={styles.statIconBox} style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <p className={styles.statLabel}>Overdue Matrix</p>
                        <h3 className={styles.statValue}>{overdueReminders.length}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#ef4444' }}
                                initial={{ width: 0 }}
                                animate={{ width: overdueReminders.length > 0 ? '80%' : '0%' }}
                            />
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={itemVariants}>
                        <div className={styles.statIconBox} style={{ background: '#ecfdf5', color: '#10b981' }}>
                            <DollarSign size={24} />
                        </div>
                        <p className={styles.statLabel}>Total Liability</p>
                        <h3 className={styles.statValue}>{currencyService.formatCurrency(totalDue)}</h3>
                        <div className={styles.statProgress}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ background: '#10b981' }}
                                initial={{ width: 0 }}
                                animate={{ width: totalDue > 0 ? '60%' : '0%' }}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Integrated Reminders Pipeline */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Timer className="text-blue-500" />
                        Reminders Pipeline
                    </h2>
                </div>

                <motion.div
                    className={styles.pipelineSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {unpaidReminders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Bell size={32} />
                            </div>
                            <h3 className={styles.emptyTitle}>Clear Horizon</h3>
                            <p className={styles.emptyText}>
                                No pending bill obligations found in your current matrix.
                            </p>
                            <Button
                                className="h-12 px-8 rounded-xl bg-[#3B82F6] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                                onClick={() => setShowAddModal(true)}
                            >
                                Schedule Reminder
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.reminderGrid}>
                            {unpaidReminders.map((reminder, idx) => (
                                <ReminderTile
                                    key={reminder.id}
                                    reminder={reminder}
                                    idx={idx}
                                    onPay={() => {
                                        reminderService.markAsPaid(reminder.id);
                                        toast.success('Paid!');
                                        loadData();
                                    }}
                                    onDelete={() => {
                                        reminderService.deleteReminder(reminder.id);
                                        toast.success('Removed');
                                        loadData();
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Smart Predictions Section */}
                {predictions.length > 0 && (
                    <motion.div
                        className={styles.predictionWrapper}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2 className={styles.sectionTitle}>
                                    <Sparkles className="text-blue-600" />
                                    AI Predicted Flow
                                </h2>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 ml-10">
                                    Anticipating upcoming recurring charges
                                </p>
                            </div>
                        </div>

                        <div className={styles.predictionGrid}>
                            {predictions.slice(0, 4).map(bill => (
                                <div key={bill.id} className={styles.predictCard}>
                                    <div className="flex items-center gap-4">
                                        <div className={styles.predictRate}>
                                            {bill.confidence}%
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm leading-tight">{bill.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">EST. {new Date(bill.dueDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 leading-none mb-1">~{currencyService.formatCurrency(bill.amount)}</p>
                                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {bill.source}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Modular Modal */}
            <AddReminderModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={loadData}
            />
        </div>
    );
};

const ReminderTile = ({ reminder, onPay, onDelete, idx }: any) => {
    const today = new Date();
    const dueDate = new Date(reminder.due_date);
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const isOverdue = daysUntil < 0;
    const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

    return (
        <motion.div
            className={styles.reminderTile}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ x: 10 }}
        >
            <div className={styles.tileLeft}>
                <div
                    className={styles.tileIcon}
                    style={{
                        background: isOverdue ? '#fef2f2' : isDueSoon ? '#fffbeb' : '#eff6ff',
                        color: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#3b82f6'
                    }}
                >
                    <Calendar size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className={styles.billName}>{reminder.name}</h3>
                        <div
                            className={styles.statusBadge}
                            style={{
                                background: isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#3b82f6',
                                color: 'white'
                            }}
                        >
                            {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : `${daysUntil} Days`}
                        </div>
                    </div>
                    <div className={styles.billMeta}>
                        <Clock size={14} />
                        <span>DUE {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {reminder.frequency !== 'once' && (
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] uppercase font-black">
                                {reminder.frequency}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tileRight}>
                <div className={styles.amountBox}>
                    <span className={styles.amountVal}>{currencyService.formatCurrency(reminder.amount)}</span>
                    <span className={styles.amountLabel}>Liability</span>
                </div>
                <div className={styles.tileActions}>
                    <button className={cn(styles.actionBtn, styles.payBtn)} onClick={onPay}>
                        <Check size={18} />
                    </button>
                    <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={onDelete}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const AddReminderModal = ({ isOpen, onClose, onSave }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name || !amount || !dueDate) return;
        setSaving(true);
        try {
            await reminderService.createReminder({
                name,
                amount: parseFloat(amount),
                due_date: dueDate,
                frequency: frequency as any,
                category: 'Bills',
                notification_days_before: 3,
                email_enabled: emailEnabled,
                notification_enabled: true
            });
            onSave();
            onClose();
            toast.success('Matrix Configured');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
                <div className="bg-blue-600 p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-20">
                        <Bell size={120} />
                    </div>
                    <div className="relative z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl">
                                    <Plus size={24} />
                                </div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tight">Schedule Goal</DialogTitle>
                            </div>
                            <DialogDescription className="font-bold text-blue-100">Initialize a new liability reminder</DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-10 space-y-8 bg-white">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Service Identifier</Label>
                            <Input
                                placeholder="Electric, Internet, Rent..."
                                className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white text-lg font-bold"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Quantum (Rs)</Label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Target Date</Label>
                                <Input
                                    type="date"
                                    className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Frequency Cycle</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="once">One-time</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border-2 border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-xl", emailEnabled ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400")}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-700">Email Sync</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receive inbox alerts</p>
                            </div>
                        </div>
                        <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="flex-[2] h-14 rounded-2xl bg-blue-600 font-black text-xs uppercase shadow-xl" onClick={handleSubmit}>
                            Deploy Tracker
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BillRemindersPage;
