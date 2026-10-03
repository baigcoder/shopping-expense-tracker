import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TrendingUp, DollarSign,
    FileText, FileSpreadsheet, File,
    RefreshCw, X, Target, CheckCircle2
} from 'lucide-react';
import { supabaseTransactionService } from '@/services/supabaseTransactionService';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import { formatCurrency } from '../services/currencyService';
import { cn } from '@/lib/utils';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyzeNavigationTabs } from '@/components/AnalyzeNavigationTabs';

export const ReportsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
    const [reportType, setReportType] = useState<'tax' | 'category' | 'merchant' | 'subscription' | 'monthly_summary'>('monthly_summary');
    const [reportPreview, setReportPreview] = useState<any>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        try {
            const data = await supabaseTransactionService.getAll(user.id);
            setTransactions(data || []);
        } catch {
            toast.error('Could not load reports data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        toast.success('Reports updated');
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
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
    }, [transactions, dateRange]);

    const totalIncome = useMemo(() => {
        return filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    }, [filteredTransactions]);

    const totalExpenses = useMemo(() => {
        return filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    }, [filteredTransactions]);

    const netSavings = totalIncome - totalExpenses;

    const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
        setExporting(type);
        try {
            const { exportService } = await import('@/services/exportService');
            const dataToExport = filteredTransactions.map(t => ({
                date: t.date,
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: typeof t.category === 'string' ? t.category : t.category?.name || 'Other'
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
            toast.success(`Exported ${type.toUpperCase()} successfully`);
        } catch {
            toast.error('Export failed');
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
            toast.success('Generated report summary');
        } catch {
            toast.error('Report generation failed');
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                        Reports & Financial Exports
                    </h1>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Downloadable tax summaries, merchant audits, and formatted statements.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs">
                        {(['week', 'month', 'quarter', 'year', 'all'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(
                                    'px-3 py-1 rounded-lg font-medium transition-all capitalize',
                                    dateRange === range
                                        ? 'bg-[var(--color-brand)] text-white shadow-xs font-semibold'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="rounded-xl border-[var(--color-border)] text-xs h-9 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', refreshing && 'animate-spin')} />
                        Sync
                    </Button>
                </div>
            </div>

            {/* Pillar Sub-Tabs */}
            <AnalyzeNavigationTabs />

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Period Inflow</span>
                        <TrendingUp className="h-4 w-4 text-[var(--color-positive)]" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-positive)]">
                        {loading ? '—' : formatCurrency(totalIncome)}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                        Total documented deposits
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Period Outflow</span>
                        <DollarSign className="h-4 w-4 text-[var(--color-danger)]" />
                    </div>
                    <div className="text-2xl font-bold tracking-tight tabular-nums font-mono text-[var(--color-danger)]">
                        {loading ? '—' : formatCurrency(totalExpenses)}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                        Total documented expenses
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
                        <span>Net Cashflow Margin</span>
                        <Target className="h-4 w-4 text-[var(--color-brand)]" />
                    </div>
                    <div className={cn(
                        "text-2xl font-bold tracking-tight tabular-nums font-mono",
                        netSavings >= 0 ? "text-[var(--color-positive)]" : "text-[var(--color-danger)]"
                    )}>
                        {loading ? '—' : formatCurrency(netSavings)}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                        {filteredTransactions.length} transactions in date window
                    </div>
                </div>
            </div>

            {/* Export Actions & Report Generator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instant Formats Card */}
                <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Export Raw Ledger Data
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Download all {filteredTransactions.length} transactions for {dateRange} range in standard formats.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={!!exporting}
                            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] flex flex-col items-center justify-center gap-2 transition-all hover:border-[var(--color-text-secondary)] text-center group"
                        >
                            <FileText className="h-6 w-6 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]" />
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">CSV Export</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">Raw Sheet</span>
                        </button>

                        <button
                            onClick={() => handleExport('excel')}
                            disabled={!!exporting}
                            className="p-4 rounded-xl border border-[var(--color-positive)]/30 bg-[var(--color-positive-subtle)] hover:bg-[var(--color-positive-subtle)]/80 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01] text-center"
                        >
                            <FileSpreadsheet className="h-6 w-6 text-[var(--color-positive)]" />
                            <span className="text-xs font-bold text-[var(--color-positive)]">Excel (.xlsx)</span>
                            <span className="text-[10px] text-[var(--color-positive)]/80">Formatted</span>
                        </button>

                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={!!exporting}
                            className="p-4 rounded-xl border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)] hover:bg-[var(--color-brand-subtle)]/80 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01] text-center"
                        >
                            <File className="h-6 w-6 text-[var(--color-brand)]" />
                            <span className="text-xs font-bold text-[var(--color-brand)]">PDF Report</span>
                            <span className="text-[10px] text-[var(--color-brand)]/80">Printable</span>
                        </button>
                    </div>
                </div>

                {/* Structured Financial Report Generator */}
                <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Generate Summarized Audit
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Automated accounting breakdown by tax deductible categories or subscriptions.
                        </p>
                    </div>

                    <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Audit Focus</span>
                            <Select
                                value={reportType}
                                onValueChange={(val: any) => setReportType(val)}
                            >
                                <SelectTrigger className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]">
                                    <SelectItem value="monthly_summary">Monthly Cashflow Summary</SelectItem>
                                    <SelectItem value="tax">Tax Deductions & Receipts</SelectItem>
                                    <SelectItem value="category">Category Spending Breakdown</SelectItem>
                                    <SelectItem value="merchant">Merchant Volume Concentration</SelectItem>
                                    <SelectItem value="subscription">Subscriptions & Commitments Audit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleGenerateReport}
                            disabled={exporting === 'report'}
                            className="w-full rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-semibold h-9 shadow-sm"
                        >
                            {exporting === 'report' ? 'Generating Report...' : 'Generate Audit Summary'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Generated Report Summary Preview */}
            {reportPreview && (
                <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-[var(--color-positive)]" />
                            Audit Preview: {reportType}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReportPreview(null)}
                            className="h-7 w-7 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <pre className="p-4 rounded-xl bg-[var(--color-surface-subtle)] text-xs text-[var(--color-text-primary)] font-mono overflow-x-auto whitespace-pre-wrap border border-[var(--color-border-subtle)]">
                        {typeof reportPreview === 'string' ? reportPreview : JSON.stringify(reportPreview, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
