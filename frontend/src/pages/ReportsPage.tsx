// ReportsPage - Stark Gen Z Brutalist Audit Manager
import { useState, useEffect, useRef } from 'react';
import {
    Receipt, TrendingUp, ArrowDown, DollarSign, Calendar,
    Download, Upload, FileText, FileSpreadsheet, File,
    PieChart, BarChart3, RefreshCw, Check, AlertCircle,
    X, ArrowRight, Zap, Target, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseTransactionService } from '@/services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import styles from './ReportsPage.module.css';
import { ReportsSkeleton } from '../components/LoadingSkeleton';
import { featureExpansionApi } from '../services/featureExpansionApi';

const ReportsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
    const [reportType, setReportType] = useState<'tax' | 'category' | 'merchant' | 'subscription' | 'monthly_summary'>('monthly_summary');
    const [reportPreview, setReportPreview] = useState<any>(null);
    const [exportHistory, setExportHistory] = useState<any[]>([]);

    const fetchData = async () => {
        if (!user?.id) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data);
            setExportHistory(await featureExpansionApi.reportExports());
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast.error('SYNC_FAILURE');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

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

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

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

    const COLORS = ['#000000', '#E11D48', '#000000', '#E11D48', '#000000', '#E11D48'];

    const monthlyTrend = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
        if (t.type === 'income') acc[month].income += t.amount;
        else acc[month].expenses += t.amount;
        return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(monthlyTrend).slice(-6);

    const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
        setExporting(type);
        try {
            const { exportService } = await import('@/services/exportService');
            const dataToExport = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category
            }));

            if (type === 'csv') exportService.exportToCSV(dataToExport);
            else if (type === 'excel') await exportService.exportToExcel(dataToExport);
            else if (type === 'pdf') {
                await exportService.exportTransactionsToPDF(dataToExport, {
                    dateRange: {
                        start: filteredTransactions[filteredTransactions.length - 1]?.date || '',
                        end: filteredTransactions[0]?.date || ''
                    }
                });
            }
            toast.success(`EXPORT_${type.toUpperCase()}_SUCCESS`);
        } catch (error) {
            toast.error('EXPORT_FAILURE');
        } finally {
            setExporting(null);
        }
    };

    const handleGenerateReport = async () => {
        setExporting('report');
        try {
            const payload = {
                reportType,
                startDate: filteredTransactions[filteredTransactions.length - 1]?.date,
                endDate: filteredTransactions[0]?.date,
                format: 'preview',
            };
            const result = await featureExpansionApi.generateReport(payload);
            setReportPreview(result.summary);
            setExportHistory(await featureExpansionApi.reportExports());
            toast.success('REPORT_GENERATED');
        } catch (error) {
            toast.error('GENERATION_FAILURE');
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
                <ReportsSkeleton />
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
                            <Receipt size={32} strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className={styles.title}>
                                Financial Audit
                                <div className={styles.liveBadge}>LIVE_INTEL</div>
                            </h1>
                            <p className="text-black/60 mt-2 font-black text-xs uppercase tracking-widest">
                                COMPREHENSIVE_CAPITAL_MOVEMENT_LOG
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
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </motion.header>

                {/* Report Generation Section */}
                <section className="bg-white border-4 border-black p-10 mb-10 shadow-[8px_8px_0px_#000000]">
                    <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between mb-8 pb-8 border-b-4 border-black">
                        <div>
                            <h2 className="text-3xl font-black italic uppercase italic">Audit Engine 2.0</h2>
                            <p className="text-sm font-bold text-black/50 mt-1 uppercase tracking-wider">Generate mission-critical manifests for tax, sectors, or cycles.</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <select
                                value={reportType}
                                onChange={e => setReportType(e.target.value as any)}
                                className="h-14 px-6 border-4 border-black font-black uppercase text-sm focus:outline-none"
                            >
                                <option value="monthly_summary">Cycle Summary</option>
                                <option value="tax">Tax Manifest</option>
                                <option value="category">Sector Audit</option>
                                <option value="merchant">Node Analysis</option>
                                <option value="subscription">Stream Report</option>
                            </select>
                            <button
                                onClick={handleGenerateReport}
                                disabled={exporting === 'report'}
                                className="h-14 px-10 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors"
                            >
                                {exporting === 'report' ? 'GENERATING...' : 'INITIALIZE'}
                            </button>
                        </div>
                    </div>
                    {reportPreview && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 border-4 border-black bg-black text-white">
                                <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Events</div>
                                <div className="text-3xl font-black">{reportPreview.transactionCount}</div>
                            </div>
                            <div className="p-6 border-4 border-black">
                                <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-black/50">Total Inflow</div>
                                <div className="text-3xl font-black text-black">{formatCurrency(reportPreview.totalIncome || 0)}</div>
                            </div>
                            <div className="p-6 border-4 border-black bg-[#E11D48] text-white">
                                <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Total Outflow</div>
                                <div className="text-3xl font-black">{formatCurrency(reportPreview.totalExpense || 0)}</div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Stats Summary Row */}
                <motion.div
                    className={styles.statsRow}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { icon: <TrendingUp size={28} strokeWidth={3} />, label: "Resource Inflow", value: totalIncome, color: "#000000" },
                        { icon: <ArrowDown size={28} strokeWidth={3} />, label: "Resource Outflow", value: totalExpenses, color: "#E11D48" },
                        { icon: <Shield size={28} strokeWidth={3} />, label: "Net Liquidity", value: netSavings, color: "#000000" }
                    ].map((stat, i) => (
                        <motion.div key={i} className={styles.premiumStatCard} variants={fadeInUp}>
                            <div className={styles.statIconBox}>
                                {stat.icon}
                            </div>
                            <p className={styles.statLabel}>{stat.label}</p>
                            <h3 className={styles.statValue} style={{ color: stat.color }}>{formatCurrency(stat.value as number)}</h3>
                            <div className={styles.statBadge}>
                                <Zap size={14} fill="currentColor" strokeWidth={0} />
                                AUDIT_VERIFIED
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts Grid */}
                <div className={styles.chartsGrid}>
                    <motion.div className={styles.chartCard} variants={fadeInUp}>
                        <div className={styles.chartHeader}>
                            <div>
                                <h3 className={styles.chartTitle}>
                                    <BarChart3 size={24} strokeWidth={3} />
                                    Execution Dynamics
                                </h3>
                                <p className={styles.chartDesc}>Inflow vs Outflow • 6 Cycle Trend</p>
                            </div>
                            <div className={styles.chartLegend}>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ background: '#000000' }} />
                                    Inflow
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ background: '#E11D48' }} />
                                    Outflow
                                </div>
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" strokeWidth={2} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={true}
                                        tickLine={true}
                                        tick={{ fill: '#000000', fontSize: 11, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={true}
                                        tickLine={true}
                                        tick={{ fill: '#000000', fontSize: 11, fontWeight: 900 }}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#000000', strokeWidth: 4 }}
                                        contentStyle={{ background: '#000000', border: 'none', padding: '16px', color: '#FFF' }}
                                        itemStyle={{ color: '#FFF', fontWeight: 900, textTransform: 'uppercase' }}
                                    />
                                    <Area type="stepAfter" dataKey="income" stroke="#000000" fill="#000000" fillOpacity={0.05} strokeWidth={4} />
                                    <Area type="stepAfter" dataKey="expenses" stroke="#E11D48" fill="#E11D48" fillOpacity={0.05} strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div className={styles.chartCard} variants={fadeInUp}>
                        <div className={styles.chartHeader}>
                            <div>
                                <h3 className={styles.chartTitle}>
                                    <PieChart size={24} strokeWidth={3} />
                                    Sector Map
                                </h3>
                                <p className={styles.chartDesc}>Top Allocation Nodes</p>
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
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="#000000"
                                        strokeWidth={4}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#000000', border: 'none', padding: '12px', color: '#FFF' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-6">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2 font-black text-[10px] text-black uppercase">
                                        <div className="w-3 h-3 border-2 border-black" style={{ background: COLORS[i % COLORS.length] }} />
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Data Management Section */}
                <div className={styles.dataSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Target size={28} strokeWidth={3} />
                            Data Protocol
                        </h2>
                        <div className={styles.liveBadge}>ENCRYPTED_INTEL_FLOW</div>
                    </div>

                    <motion.div
                        className={styles.reportsGrid}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {[
                            { id: 'csv', icon: <FileText size={28} />, title: "CSV Export", info: "Lightweight manifest for external auditing.", color: "#000000" },
                            { id: 'excel', icon: <FileSpreadsheet size={28} />, title: "Excel Workbook", info: "Full intelligence sheet with breakouts.", color: "#000000" },
                            { id: 'pdf', icon: <File size={28} />, title: "PDF Certificate", info: "Polished audit report for presentation.", color: "#000000" },
                            { id: 'import', icon: <Upload size={28} />, title: "Import Matrix", info: "Injest external statements into DNA.", color: "#E11D48" }
                        ].map((item, i) => (
                            <motion.div
                                key={item.id}
                                className={styles.reportGlassCard}
                                variants={fadeInUp}
                                onClick={() => item.id === 'import' ? setShowImportModal(true) : handleExport(item.id as any)}
                            >
                                <div className={styles.reportIconBox}>
                                    {item.icon}
                                </div>
                                <h3 className={styles.reportName}>{item.title}</h3>
                                <p className={styles.reportInfo}>{item.info}</p>
                                <button className={styles.downloadButton}>
                                    {exporting === item.id ? <RefreshCw className={styles.spinning} size={18} strokeWidth={3} /> : <Zap size={18} strokeWidth={3} />}
                                    {exporting === item.id ? 'SYNCING...' : 'INITIATE_FLOW'}
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Brutalist Import Modal */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={() => fetchData()}
            />
        </div>
    );
};

const ImportModal = ({ isOpen, onClose, onImport }: any) => {
    const { user } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async () => {
        if (!file || !user?.id) return;
        setImporting(true);
        try {
            const { exportService } = await import('@/services/exportService');
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
            toast.success(`MATRIX_UPDATED: ${result.transactions.length} ENTRIES`);
            onImport();
            onClose();
        } catch (error) {
            toast.error('MANIFEST_INGESTION_FAILURE');
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div
                    className="absolute inset-0 bg-black/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div
                    className="relative w-full max-w-xl bg-white border-8 border-black p-12 shadow-[20px_20px_0px_#E11D48]"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                >
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-black text-white border-4 border-black flex items-center justify-center mx-auto mb-6">
                            <Upload size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Data Ingestion</h2>
                        <p className="text-black/50 font-black text-xs uppercase tracking-widest mt-2">EXTERNAL_STATEMENT_MANIFEST</p>
                    </div>

                    <div
                        className="border-8 border-dashed border-black/10 p-12 text-center cursor-pointer hover:border-black transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <FileSpreadsheet size={64} strokeWidth={1} className="mx-auto text-black/10 mb-6" />
                        <p className="text-lg font-black uppercase text-black/40">
                            {file ? file.name : "SELECT_CSV_EXCEL_MATRIX"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-12">
                        <button
                            className="h-16 border-4 border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors"
                            onClick={onClose}
                        >
                            Abort
                        </button>
                        <button
                            className="h-16 bg-black text-white font-black uppercase text-sm flex items-center justify-center gap-4 hover:bg-[#E11D48] transition-colors disabled:opacity-50"
                            onClick={handleImport}
                            disabled={!file || importing}
                        >
                            {importing ? <RefreshCw size={20} className="animate-spin" strokeWidth={3} /> : <Check size={20} strokeWidth={3} />}
                            {importing ? "SYNCING..." : "INITIATE"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReportsPage;
