// ReportsPage - Enhanced Financial Reports with Export/Import
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Download, TrendingUp, DollarSign, Calendar, PieChart, BarChart3, Receipt, Upload, FileSpreadsheet, File, ArrowDown, Filter, CalendarDays, RefreshCw, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { supabaseTransactionService } from '@/services/supabaseTransactionService';
import { exportService, ExportTransaction } from '@/services/exportService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AreaChart, Area, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    source?: string;
}

const ReportsPage = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch transactions
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await supabaseTransactionService.getAll(user?.id || '');
                setTransactions(data);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter transactions by date range
    const getFilteredTransactions = () => {
        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return transactions;
        }

        return transactions.filter(t => new Date(t.date) >= startDate);
    };

    const filteredTransactions = getFilteredTransactions();

    // Calculate stats
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    // Category breakdown
    const categoryData = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const cat = t.category || 'Other';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    const COLORS = ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#6366F1', '#14B8A6'];

    // Monthly trend data
    const monthlyData = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
        if (t.type === 'income') acc[month].income += t.amount;
        else acc[month].expenses += t.amount;
        return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);

    const trendData = Object.values(monthlyData).slice(-6);

    // Export handlers
    const handleExportCSV = async () => {
        setExporting('csv');
        try {
            const exportData = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category
            }));
            exportService.exportToCSV(exportData, { includeSummary: true });
            toast.success('CSV exported! 📄');
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(null);
        }
    };

    const handleExportExcel = async () => {
        setExporting('excel');
        try {
            const exportData = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category
            }));
            exportService.exportToExcel(exportData, { includeSummary: true });
            toast.success('Excel exported! 📊');
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(null);
        }
    };

    const handleExportPDF = async () => {
        setExporting('pdf');
        try {
            const exportData = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category
            }));
            exportService.exportTransactionsToPDF(exportData, {
                dateRange: dateRange !== 'all' ? {
                    start: getFilteredTransactions()[0]?.date || '',
                    end: new Date().toISOString().split('T')[0]
                } : undefined
            });
            toast.success('PDF generated! 📑');
        } catch (error) {
            toast.error('PDF generation failed');
        } finally {
            setExporting(null);
        }
    };

    // Report cards configuration
    const reports = [
        {
            title: 'Export to CSV',
            description: 'Simple spreadsheet format compatible with any application.',
            icon: FileText,
            color: 'emerald',
            action: handleExportCSV,
            badge: null
        },
        {
            title: 'Export to Excel',
            description: 'Full Excel workbook with summary sheet and category breakdown.',
            icon: FileSpreadsheet,
            color: 'violet',
            badge: 'Popular',
            action: handleExportExcel
        },
        {
            title: 'Export to PDF',
            description: 'Professional PDF report with formatting and branding.',
            icon: File,
            color: 'amber',
            badge: 'Print Ready',
            action: handleExportPDF
        },
        {
            title: 'Import Transactions',
            description: 'Import from CSV or Excel files from your bank or other apps.',
            icon: Upload,
            color: 'blue',
            badge: 'New',
            action: () => setShowImportModal(true)
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'emerald': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', gradient: 'from-emerald-500/10 border-emerald-500/20' };
            case 'violet': return { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600', gradient: 'from-violet-500/10 border-violet-500/20' };
            case 'amber': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', gradient: 'from-amber-500/10 border-amber-500/20' };
            case 'pink': return { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600', gradient: 'from-pink-500/10 border-pink-500/20' };
            case 'blue': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', gradient: 'from-blue-500/10 border-blue-500/20' };
            default: return { bg: 'bg-muted', text: 'text-muted-foreground', gradient: '' };
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-10 bg-[#FAFBFF] min-h-screen">
            {/* Header Redesign */}
            <motion.div
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 shadow-xl shadow-blue-100 ring-4 ring-blue-50">
                            <Receipt className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-4xl font-black text-slate-800 tracking-tighter font-display">Financial Insights</h1>
                                <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 transition-colors px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Analytics</Badge>
                            </div>
                            <p className="text-slate-500 font-bold text-lg">Detailed analysis of your financial ecosystem</p>
                        </div>
                    </div>
                </div>

                {/* Date Range Selector Redesign */}
                <div className="flex items-center gap-3 p-1.5 bg-white border-2 border-slate-100 rounded-[1.5rem] shadow-sm">
                    {(['week', 'month', 'quarter', 'year', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={cn(
                                "px-5 py-2.5 text-xs font-black uppercase tracking-[0.1em] rounded-2xl transition-all",
                                dateRange === range
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {range === 'all' ? 'All' : range}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Stats Summary Redesign */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Total Income Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-black">+12.5%</Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cash Inflow</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${totalIncome.toLocaleString()}</h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Total Expenses Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-100 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                            <ArrowDown className="h-6 w-6" />
                        </div>
                        <Badge className="bg-red-50 text-red-600 border-none px-3 font-black">-4.2%</Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Outflow</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">${totalExpenses.toLocaleString()}</h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '45%' }}
                                className="h-full bg-red-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Net Savings Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-100 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <Badge className="bg-violet-50 text-violet-600 border-none px-3 font-black">Stable</Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Reserve</p>
                        <h3 className={cn(
                            "text-3xl font-black tracking-tighter",
                            netSavings >= 0 ? "text-slate-800" : "text-red-600"
                        )}>
                            ${netSavings.toLocaleString()}
                        </h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '82%' }}
                                className="h-full bg-violet-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Charts Row Redesign */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                ref={reportRef}
                id="report-content"
            >
                {/* Trend Chart */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                Growth Dynamics
                            </h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Income vs Expenses • 6 Months</p>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-500">IN</span>
                            <div className="w-3 h-3 rounded-full bg-red-400 ml-2" />
                            <span className="text-[10px] font-black text-slate-500">OUT</span>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                                    contentStyle={{
                                        background: '#fff',
                                        border: 'none',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={4} name="Income" />
                                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={4} name="Expenses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-indigo-400" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-violet-600" />
                                Asset Distribution
                            </h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Spending by Category</p>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#fff',
                                            border: 'none',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <div className="p-4 rounded-full bg-slate-50 mb-4 text-slate-200">
                                    <PieChart className="h-10 w-10" />
                                </div>
                                <p className="font-black text-sm uppercase tracking-widest">No activity for this period</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Export/Import Options Redesign */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
            >
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Management</h2>
                    <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase tracking-widest px-4 py-1.5 rounded-2xl">Encrypted Flow</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {reports.map((report, i) => {
                        const Icon = report.icon;
                        const colors = getColorClasses(report.color);
                        const isExporting = exporting === report.title.toLowerCase().split(' ')[2];

                        return (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8 }}
                                onClick={report.action}
                                className="group cursor-pointer"
                            >
                                <div className="bg-white rounded-[2rem] p-7 shadow-xl shadow-slate-100/50 border-2 border-slate-50 h-full flex flex-col justify-between transition-all group-hover:border-blue-100 group-hover:shadow-blue-100/20">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={cn("p-4 rounded-2xl transition-all duration-300", colors.bg, colors.text, "group-hover:bg-blue-600 group-hover:text-white")}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            {report.badge && (
                                                <Badge className="bg-slate-50 text-slate-500 border-none font-black text-[10px] uppercase tracking-tighter">
                                                    {report.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2">{report.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{report.description}</p>
                                    </div>

                                    <div className="mt-8">
                                        <Button
                                            className={cn(
                                                "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                                isExporting ? "bg-slate-900" : "bg-white text-slate-600 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                            )}
                                            disabled={isExporting || loading}
                                        >
                                            {isExporting ? (
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="mr-2 h-4 w-4" />
                                            )}
                                            {isExporting ? 'Processing' : report.title.includes('Import') ? 'Upload' : 'Download'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Transaction Count */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm text-muted-foreground"
            >
                {filteredTransactions.length} transactions in selected period • {transactions.length} total transactions
            </motion.div>

            {/* Import Modal */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={async (imported) => {
                    // Add imported transactions to database
                    for (const t of imported) {
                        try {
                            await supabaseTransactionService.create({
                                user_id: user?.id || '',
                                description: t.description,
                                amount: t.amount,
                                type: t.type,
                                category: t.category,
                                date: t.date,
                                source: 'import'
                            });
                        } catch (error) {
                            console.error('Failed to import:', t.description);
                        }
                    }
                    // Refresh transactions
                    const data = await supabaseTransactionService.getAll(user?.id || '');
                    setTransactions(data);
                    toast.success(`Imported ${imported.length} transactions! 🎉`);
                }}
            />
        </div>
    );
};

// Import Modal Component
interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (transactions: ExportTransaction[]) => void;
}

const ImportModal = ({ isOpen, onClose, onImport }: ImportModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ExportTransaction[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setErrors([]);

        try {
            const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
            const result = isExcel
                ? await exportService.importFromExcel(selectedFile)
                : await exportService.importFromCSV(selectedFile);

            setPreview(result.transactions.slice(0, 10));
            setErrors([...result.errors, ...result.warnings]);

            if (result.transactions.length === 0) {
                setErrors(['No valid transactions found in file']);
            }
        } catch (error) {
            setErrors(['Failed to parse file. Please check the format.']);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        try {
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
            const result = isExcel
                ? await exportService.importFromExcel(file)
                : await exportService.importFromCSV(file);

            onImport(result.transactions);
            onClose();
            setFile(null);
            setPreview([]);
        } catch (error) {
            setErrors(['Import failed. Please try again.']);
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative p-8 md:p-10 border-b border-slate-50 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Import Data</h2>
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">External Statements</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-slate-50 text-slate-300 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 md:p-10 overflow-y-auto space-y-8">
                            {/* Drop Zone Redesign */}
                            <div
                                className={cn(
                                    "relative group border-4 border-dashed rounded-[2rem] p-10 text-center transition-all duration-300",
                                    file ? "border-blue-100 bg-blue-50/20" : "border-slate-50 bg-slate-50/50 hover:border-blue-100 hover:bg-white"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all",
                                    file ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-300 group-hover:text-blue-600 shadow-sm"
                                )}>
                                    <FileSpreadsheet className="h-8 w-8" />
                                </div>
                                <h4 className="text-lg font-black text-slate-800 mb-2">
                                    {file ? file.name : 'Select statement file'}
                                </h4>
                                <p className="text-slate-400 font-medium text-sm">
                                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Drag and drop or click to browse CSV/Excel'}
                                </p>
                            </div>

                            {/* Errors/Warnings Redesign */}
                            <AnimatePresence>
                                {errors.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <AlertCircle className="h-5 w-5 text-amber-600" />
                                            <p className="font-black text-amber-800 text-sm uppercase tracking-widest">Pre-flight Warnings</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {errors.slice(0, 3).map((err, i) => (
                                                <li key={i} className="text-amber-700 text-xs font-bold pl-8 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Preview Redesign */}
                            <AnimatePresence>
                                {preview.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center justify-between px-2">
                                            <p className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Transaction Preview</p>
                                            <Badge className="bg-slate-900 text-white border-none rounded-full px-3">{preview.length} Rows</Badge>
                                        </div>
                                        <div className="bg-white border-2 border-slate-50 rounded-[2rem] overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 text-slate-400 border-b border-slate-50">
                                                        <th className="text-left py-4 px-6 font-black uppercase tracking-widest">Date</th>
                                                        <th className="text-left py-4 px-6 font-black uppercase tracking-widest">Description</th>
                                                        <th className="text-right py-4 px-6 font-black uppercase tracking-widest">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {preview.map((t, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-4 px-6 font-bold text-slate-500">{t.date}</td>
                                                            <td className="py-4 px-6 font-black text-slate-800 truncate max-w-[150px]">{t.description}</td>
                                                            <td className={cn(
                                                                "py-4 px-6 text-right font-black",
                                                                t.type === 'expense' ? 'text-red-500' : 'text-emerald-500'
                                                            )}>
                                                                {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Section */}
                        <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="h-14 rounded-2xl flex-1 border-2 border-slate-100 hover:bg-slate-50 font-black text-slate-500 uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || preview.length === 0 || importing}
                                className="h-14 rounded-2xl flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {importing ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Import Assets
                                        <Check className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReportsPage;
