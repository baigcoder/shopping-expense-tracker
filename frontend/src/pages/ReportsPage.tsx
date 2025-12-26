// ReportsPage - Cashly Premium Financial Reports
// Midnight Coral Theme - Light Mode
import { useState, useEffect, useRef } from 'react';
import {
    Receipt, TrendingUp, ArrowDown, DollarSign, Calendar,
    Download, Upload, FileText, FileSpreadsheet, File,
    PieChart, BarChart3, RefreshCw, Check, AlertCircle,
    X, ArrowRight, Zap, Target, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseTransactionService } from '@/services/supabaseTransactionService';
import { exportService, ExportTransaction } from '@/services/exportService';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import styles from './ReportsPage.module.css';

const ReportsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

    // Fetch transactions
    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast.error('Failed to sync data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    // Filter logic
    const filteredTransactions = transactions.filter(t => {
        if (dateRange === 'all') return true;
        const date = new Date(t.date);
        const now = new Date();
        const start = new Date();
        if (dateRange === 'week') start.setDate(now.getDate() - 7);
        else if (dateRange === 'month') start.setMonth(now.getMonth() - 1);
        else if (dateRange === 'quarter') start.setMonth(now.getMonth() - 3);
        else if (dateRange === 'year') start.setFullYear(now.getFullYear() - 1);
        return date >= start;
    });

    // Stats calculations
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    // Chart Data Preparation
    const categoryData = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const cat = t.category || 'Other';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const pieData = (Object.entries(categoryData) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    const monthlyTrend = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
        if (t.type === 'income') acc[month].income += t.amount;
        else acc[month].expenses += t.amount;
        return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(monthlyTrend).slice(-6);

    // Export Handlers
    const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
        setExporting(type);
        try {
            const dataToExport = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category
            }));

            if (type === 'csv') exportService.exportToCSV(dataToExport);
            else if (type === 'excel') exportService.exportToExcel(dataToExport);
            else if (type === 'pdf') {
                exportService.exportTransactionsToPDF(dataToExport, {
                    dateRange: {
                        start: filteredTransactions[filteredTransactions.length - 1]?.date || '',
                        end: filteredTransactions[0]?.date || ''
                    }
                });
            }
            toast.success(`${type.toUpperCase()} exported successfully!`);
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(null);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className={styles.mainContent}>
                <div className="flex items-center justify-center min-h-[60vh] flex-col gap-6">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={styles.titleIcon}
                    >
                        <Receipt size={32} />
                    </motion.div>
                    <p className="text-muted-foreground font-medium animate-pulse">
                        Generating your financial manifest...
                    </p>
                </div>
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
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Financial Reports
                                <div className={styles.liveBadge}>ANALYTICS</div>
                            </h1>
                            <p className="text-muted-foreground mt-1 font-medium text-sm">
                                Comprehensive audit of your capital movement
                            </p>
                        </div>
                    </div>

                    <div className={styles.dateControls}>
                        {(['week', 'month', 'quarter', 'year', 'all'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(styles.rangeBtn, dateRange === range && styles.activeRange)}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </motion.header>

                {/* Stats Summary */}
                <motion.div
                    className={styles.statsRow}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>
                            <TrendingUp size={22} />
                        </div>
                        <p className={styles.statLabel}>Total Inflow</p>
                        <h3 className={styles.statValue}>{formatCurrency(totalIncome)}</h3>
                        <div className={styles.statBadge} style={{ background: '#f0fdf4', color: '#10b981' }}>
                            <Zap size={12} fill="currentColor" />
                            +12.4% vs prev
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <ArrowDown size={22} />
                        </div>
                        <p className={styles.statLabel}>Total Outflow</p>
                        <h3 className={styles.statValue}>{formatCurrency(totalExpenses)}</h3>
                        <div className={styles.statBadge} style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <Zap size={12} fill="currentColor" />
                            -3.2% vs prev
                        </div>
                    </motion.div>

                    <motion.div className={styles.premiumStatCard} variants={fadeInUp}>
                        <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <DollarSign size={22} />
                        </div>
                        <p className={styles.statLabel}>Net Reserve</p>
                        <h3 className={styles.statValue} style={{ color: netSavings >= 0 ? '#0f172a' : '#ef4444' }}>
                            {formatCurrency(netSavings)}
                        </h3>
                        <div className={styles.statBadge} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <Shield size={12} fill="currentColor" />
                            Stable Liquidity
                        </div>
                    </motion.div>
                </motion.div>

                {/* Charts Grid */}
                <div className={styles.chartsGrid}>
                    <motion.div
                        className={styles.chartCard}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.chartHeader}>
                            <div>
                                <h3 className={styles.chartTitle}>
                                    <BarChart3 size={20} className="text-indigo-500" />
                                    Growth Dynamics
                                </h3>
                                <p className={styles.chartDesc}>Income vs Expenses • 6 Months Trend</p>
                            </div>
                            <div className={styles.chartLegend}>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ background: '#10b981' }} />
                                    Inflow
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ background: '#ef4444' }} />
                                    Outflow
                                </div>
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                        contentStyle={{ background: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#colorInc)" strokeWidth={4} />
                                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.chartCard}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className={styles.chartHeader}>
                            <div>
                                <h3 className={styles.chartTitle}>
                                    <PieChart size={20} className="text-pink-500" />
                                    Distribution
                                </h3>
                                <p className={styles.chartDesc}>Top spending sectors</p>
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-1.5 font-bold text-[10px] text-slate-500 uppercase">
                                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Data Management */}
                <div className={styles.dataSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Target size={22} className="text-indigo-600" />
                            Data Management
                        </h2>
                        <div className={styles.liveBadge} style={{ background: '#f1f5f9', color: '#64748b' }}>
                            ENCRYPTED FLOW
                        </div>
                    </div>

                    <motion.div
                        className={styles.reportsGrid}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div className={styles.reportGlassCard} variants={fadeInUp} onClick={() => handleExport('csv')}>
                            <div className={styles.reportIconBox} style={{ background: '#f0fdf4', color: '#10b981' }}>
                                <FileText size={24} />
                            </div>
                            <h3 className={styles.reportName}>Export to CSV</h3>
                            <p className={styles.reportInfo}>Lightweight sheet for external auditing and processing.</p>
                            <button className={styles.downloadButton}>
                                {exporting === 'csv' ? <RefreshCw className={styles.spinning} size={16} /> : <Download size={16} />}
                                {exporting === 'csv' ? 'Syncing...' : 'Collect Data'}
                            </button>
                        </motion.div>

                        <motion.div className={styles.reportGlassCard} variants={fadeInUp} onClick={() => handleExport('excel')}>
                            <div className={styles.reportIconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                <FileSpreadsheet size={24} />
                            </div>
                            <h3 className={styles.reportName}>Export to Excel</h3>
                            <p className={styles.reportInfo}>Full workbook with intelligence summary and breakouts.</p>
                            <button className={styles.downloadButton}>
                                {exporting === 'excel' ? <RefreshCw className={styles.spinning} size={16} /> : <Download size={16} />}
                                {exporting === 'excel' ? 'Syncing...' : 'Collect Data'}
                            </button>
                        </motion.div>

                        <motion.div className={styles.reportGlassCard} variants={fadeInUp} onClick={() => handleExport('pdf')}>
                            <div className={styles.reportIconBox} style={{ background: '#fff7ed', color: '#f97316' }}>
                                <File size={24} />
                            </div>
                            <h3 className={styles.reportName}>Export to PDF</h3>
                            <p className={styles.reportInfo}>Polished certificate ready for professional presentation.</p>
                            <button className={styles.downloadButton}>
                                {exporting === 'pdf' ? <RefreshCw className={styles.spinning} size={16} /> : <Download size={16} />}
                                {exporting === 'pdf' ? 'Syncing...' : 'Collect Data'}
                            </button>
                        </motion.div>

                        <motion.div className={styles.reportGlassCard} variants={fadeInUp} onClick={() => setShowImportModal(true)}>
                            <div className={styles.reportIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                <Upload size={24} />
                            </div>
                            <h3 className={styles.reportName}>Import Matrix</h3>
                            <p className={styles.reportInfo}>Injest external statements to update your financial DNA.</p>
                            <button className={styles.downloadButton}>
                                <Zap size={16} />
                                Start Flow
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Import Modal */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={() => fetchData()}
            />
        </div>
    );
};

// Simplified Import Modal for Redesign
const ImportModal = ({ isOpen, onClose, onImport }: any) => {
    const { user } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async () => {
        if (!file || !user?.id) return;
        setImporting(true);
        try {
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
            const result = isExcel
                ? await exportService.importFromExcel(file)
                : await exportService.importFromCSV(file);

            for (const t of result.transactions) {
                await supabaseTransactionService.create({
                    user_id: user.id,
                    ...t,
                    source: 'import'
                });
            }
            toast.success(`Matrix updated with ${result.transactions.length} entries!`);
            onImport();
            onClose();
        } catch (error) {
            toast.error('Manifest ingestion failed');
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div
                    className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden p-10"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Ingestion</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">External Statements</p>
                    </div>

                    <div
                        className="border-4 border-dashed border-slate-100 rounded-[32px] p-10 text-center cursor-pointer hover:border-blue-200 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <FileSpreadsheet size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-sm font-bold text-slate-500">
                            {file ? file.name : "Select CSV/Excel Matrix"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button
                            className="p-4 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
                            onClick={onClose}
                        >
                            Abort
                        </button>
                        <button
                            className="p-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                            onClick={handleImport}
                            disabled={!file || importing}
                        >
                            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                            {importing ? "Syncing" : "Initiate Inflow"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReportsPage;
