// Bill Reminders Page - Stark Gen Z Brutalist Liability Audit
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Plus, Calendar, DollarSign, Clock, Check, X,
    AlertTriangle, Trash2, Edit2, Download, RefreshCw,
    Mail, Sparkles, Timer, CreditCard, ChevronRight, Target, Zap
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
            toast.error('SYNC_FAILURE');
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
                {/* Brutalist Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerLeft}>
                        <div className={styles.titleIcon}>
                            <Bell size={32} strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Liability Audit
                                <div className={styles.liveBadge}>FLOW_ACTIVE</div>
                            </h1>
                            <p className="text-black/50 font-black text-xs uppercase tracking-widest mt-1">
                                MONITORING_{unpaidReminders.length}_UPCOMING_OBLIGATIONS
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="h-14 px-8 border-4 border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                            onClick={loadData}
                        >
                            <RefreshCw size={18} strokeWidth={3} />
                            Refresh_Nodes
                        </button>
                        <button
                            className="h-14 px-8 bg-black text-white font-black text-xs uppercase hover:bg-[#E11D48] transition-colors flex items-center gap-2"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={18} strokeWidth={3} />
                            Deploy_Tracker
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
                    {[
                        { icon: <Clock size={28} strokeWidth={3} />, label: "PENDING_BILLS", value: unpaidReminders.length, progress: (unpaidReminders.length / 10) * 100, color: "#000000" },
                        { icon: <AlertTriangle size={28} strokeWidth={3} />, label: "OVERDUE_MATRIX", value: overdueReminders.length, progress: overdueReminders.length > 0 ? 80 : 0, color: "#E11D48" },
                        { icon: <DollarSign size={28} strokeWidth={3} />, label: "TOTAL_LIABILITY", value: currencyService.formatCurrency(totalDue), progress: totalDue > 0 ? 60 : 0, color: "#000000" }
                    ].map((stat, i) => (
                        <motion.div key={i} className={styles.premiumStatCard} variants={itemVariants}>
                            <div className={styles.statIconBox}>
                                {stat.icon}
                            </div>
                            <p className={styles.statLabel}>{stat.label}</p>
                            <h3 className={styles.statValue} style={{ color: stat.color }}>{stat.value}</h3>
                            <div className={styles.statProgress}>
                                <motion.div
                                    className={styles.progressFill}
                                    style={{ background: stat.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.progress}%` }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Integrated Reminders Pipeline */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Timer size={32} strokeWidth={3} />
                        Audit_Pipeline
                    </h2>
                    <div className="h-1 bg-black flex-1 mx-8" />
                    <div className="bg-black text-white text-[10px] font-black uppercase px-3 py-1">SECURE_SYNC</div>
                </div>

                <motion.div
                    className={styles.pipelineSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {unpaidReminders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Bell size={48} strokeWidth={1} />
                            </div>
                            <h3 className={styles.emptyTitle}>Clear Horizon</h3>
                            <p className={styles.emptyText}>
                                NO_PENDING_LIABILITIES_IN_CURRENT_MATRIX
                            </p>
                            <button
                                className="h-14 px-10 bg-black text-white font-black text-xs uppercase hover:bg-[#E11D48] transition-colors"
                                onClick={() => setShowAddModal(true)}
                            >
                                Schedule_Audit
                            </button>
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
                                        toast.success('OBLIGATION_MET');
                                        loadData();
                                    }}
                                    onDelete={() => {
                                        reminderService.deleteReminder(reminder.id);
                                        toast.success('TRACKER_DELETED');
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
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.sectionHeader}>
                            <div className="flex items-center gap-4">
                                <h2 className={styles.sectionTitle}>
                                    <Sparkles size={32} strokeWidth={3} className="text-[#E11D48]" />
                                    AI_Predicted_Flow
                                </h2>
                            </div>
                            <div className="bg-black text-white text-[10px] font-black uppercase px-3 py-1">ANTICIPATING_CHARGES</div>
                        </div>

                        <div className={styles.predictionGrid}>
                            {predictions.slice(0, 4).map(bill => (
                                <div key={bill.id} className={styles.predictCard}>
                                    <div className="flex items-center gap-6">
                                        <div className={styles.predictRate}>
                                            {bill.confidence}%
                                        </div>
                                        <div>
                                            <p className="font-black text-black text-lg leading-tight uppercase italic">{bill.name}</p>
                                            <p className="text-[10px] font-black text-black/40 uppercase mt-1 tracking-widest">EST_DUE: {new Date(bill.dueDate).toLocaleDateString().toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-black text-xl leading-none mb-2">~{currencyService.formatCurrency(bill.amount)}</p>
                                        <span className="text-[9px] font-black text-white bg-black px-3 py-1 uppercase tracking-widest">
                                            {bill.source.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Brutalist Modal */}
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
        >
            <div className={styles.tileLeft}>
                <div
                    className={styles.tileIcon}
                    style={{
                        background: isOverdue ? '#E11D48' : isDueSoon ? '#000000' : '#FFFFFF',
                        color: isOverdue ? '#FFFFFF' : isDueSoon ? '#FFFFFF' : '#000000'
                    }}
                >
                    <Calendar size={28} strokeWidth={3} />
                </div>
                <div>
                    <div className="flex items-center gap-4">
                        <h3 className={styles.billName}>{reminder.name}</h3>
                        <div
                            className={styles.statusBadge}
                            style={{
                                background: isOverdue ? '#E11D48' : isDueSoon ? '#000000' : '#FFFFFF',
                                color: isOverdue || isDueSoon ? 'white' : 'black',
                                borderColor: 'black'
                            }}
                        >
                            {isOverdue ? 'OVERDUE' : isDueSoon ? 'DUE_SOON' : `${daysUntil}_DAYS_REMAINING`}
                        </div>
                    </div>
                    <div className={styles.billMeta}>
                        <Clock size={16} strokeWidth={3} />
                        <span>DUE_{dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                        {reminder.frequency !== 'once' && (
                            <span className="bg-black text-white px-2 py-0.5 text-[9px] uppercase font-black tracking-widest">
                                {reminder.frequency.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tileRight}>
                <div className={styles.amountBox}>
                    <span className={styles.amountVal}>{currencyService.formatCurrency(reminder.amount)}</span>
                    <span className={styles.amountLabel}>Liability_Weight</span>
                </div>
                <div className={styles.tileActions}>
                    <button className={cn(styles.actionBtn, styles.payBtn)} onClick={onPay}>
                        <Check size={24} strokeWidth={4} />
                    </button>
                    <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={onDelete}>
                        <Trash2 size={24} strokeWidth={3} />
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
            toast.success('TRACKER_DEPLOYED');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl p-0 bg-white border-8 border-black shadow-[20px_20px_0px_rgba(0,0,0,0.8)]">
                <div className="bg-black p-12 relative overflow-hidden border-b-4 border-black">
                    <div className="absolute top-0 right-0 p-8 text-white/10">
                        <Bell size={160} />
                    </div>
                    <div className="relative z-10">
                        <DialogHeader>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="p-4 bg-white text-black border-4 border-black">
                                    <Plus size={32} strokeWidth={4} />
                                </div>
                                <DialogTitle className="text-4xl font-black text-white tracking-tighter uppercase italic">Deploy Tracker</DialogTitle>
                            </div>
                            <DialogDescription className="font-black text-white/50 uppercase tracking-widest text-xs">Initialize new liability monitoring node</DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-12 space-y-10">
                    <div className="grid gap-8">
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">Service Identifier</Label>
                            <Input
                                placeholder="E.G. ELECTRIC, RENT, INTERNET..."
                                className="h-16 border-4 border-black bg-white focus:bg-black focus:text-white text-xl font-black uppercase"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">Quantum (RS)</Label>
                                <Input
                                    type="number"
                                    className="h-16 border-4 border-black bg-white focus:bg-black focus:text-white text-xl font-black uppercase"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">Target Date</Label>
                                <Input
                                    type="date"
                                    className="h-16 border-4 border-black bg-white focus:bg-black focus:text-white text-lg font-black uppercase"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">Frequency Cycle</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="h-16 border-4 border-black bg-white text-xl font-black uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-4 border-black rounded-none">
                                    <SelectItem value="once" className="font-black uppercase">ONE_TIME_NODE</SelectItem>
                                    <SelectItem value="monthly" className="font-black uppercase">MONTHLY_CYCLE</SelectItem>
                                    <SelectItem value="yearly" className="font-black uppercase">YEARLY_CYCLE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-black text-white border-4 border-black shadow-[8px_8px_0px_#E11D48]">
                        <div className="flex items-center gap-6">
                            <div className={cn("p-3 border-2 border-white", emailEnabled ? "bg-white text-black" : "bg-black text-white/30")}>
                                <Mail size={24} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase italic">Email Sync</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Inbound Alert Protocol</p>
                            </div>
                        </div>
                        <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} className="data-[state=checked]:bg-[#E11D48]" />
                    </div>

                    <div className="flex gap-6 pt-4">
                        <button 
                            className="flex-1 h-16 border-4 border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors" 
                            onClick={onClose}
                        >
                            ABORT
                        </button>
                        <button 
                            className="flex-[2] h-16 bg-black text-white font-black uppercase text-xs hover:bg-[#E11D48] transition-colors" 
                            onClick={handleSubmit}
                        >
                            DEPLOY_TRACKER
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BillRemindersPage;
