import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, Calendar, Eye, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import genZToast from '../services/genZToast';
import styles from './ReportsPage.module.css';

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
}

interface CategorySummary {
    category: string;
    total: number;
    count: number;
    percentage: number;
}

const ReportsPage = () => {
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Fetch transactions based on date range
    useEffect(() => {
        fetchTransactions();
    }, [user?.id, startDate, endDate]);

    // Update dates when quick range changes
    useEffect(() => {
        const now = new Date();
        let start = new Date();

        switch (dateRange) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    }, [dateRange]);

    const fetchTransactions = async () => {
        if (!user?.id) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (!error && data) {
            setTransactions(data);
        }
        setLoading(false);
    };

    // Calculate totals
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categorySummary: CategorySummary[] = Object.values(
        transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const cat = t.category || 'Other';
                if (!acc[cat]) {
                    acc[cat] = { category: cat, total: 0, count: 0, percentage: 0 };
                }
                acc[cat].total += Math.abs(t.amount);
                acc[cat].count++;
                return acc;
            }, {} as Record<string, CategorySummary>)
    ).map(cat => ({
        ...cat,
        percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    // Export CSV - Transaction Report
    const handleExportTransactionCSV = () => {
        if (transactions.length === 0) {
            genZToast.warning('No transactions to export! 🤷‍♀️');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const rows = transactions.map(t =>
            [t.date, `"${t.description}"`, t.category, t.type, t.amount.toFixed(2)].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');

        downloadFile(csv, `transactions-${startDate}-to-${endDate}.csv`, 'text/csv');
        genZToast.success('Transaction report exported! 📊');
    };

    // Export CSV - Category Summary
    const handleExportCategoryCSV = () => {
        if (categorySummary.length === 0) {
            genZToast.warning('No category data to export! 🤷‍♀️');
            return;
        }

        const headers = ['Category', 'Total Spent', 'Transaction Count', 'Percentage'];
        const rows = categorySummary.map(c =>
            [c.category, c.total.toFixed(2), c.count, `${c.percentage.toFixed(1)}%`].join(',')
        );
        rows.push(['TOTAL', totalExpenses.toFixed(2), transactions.filter(t => t.type === 'expense').length, '100%'].join(','));
        const csv = [headers.join(','), ...rows].join('\n');

        downloadFile(csv, `category-summary-${startDate}-to-${endDate}.csv`, 'text/csv');
        genZToast.success('Category summary exported! 📊');
    };

    // Generate PDF Report
    const handleExportPDF = (type: string) => {
        // Create printable HTML
        const printContent = generatePrintHTML(type);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
        genZToast.success('PDF ready to print! 📄');
    };

    const generatePrintHTML = (type: string) => {
        const title = type === 'transactions' ? 'Transaction Report' : 'Category Summary';
        let tableRows = '';

        if (type === 'transactions') {
            tableRows = transactions.map(t => `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.description}</td>
                    <td>${t.category}</td>
                    <td>${t.type}</td>
                    <td style="text-align:right">${t.type === 'expense' ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            tableRows = categorySummary.map(c => `
                <tr>
                    <td>${c.category}</td>
                    <td style="text-align:right">$${c.total.toFixed(2)}</td>
                    <td style="text-align:center">${c.count}</td>
                    <td style="text-align:right">${c.percentage.toFixed(1)}%</td>
                </tr>
            `).join('');
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .meta { color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #f5f5f5; font-weight: bold; }
                    .total { font-weight: bold; background: #f0f0f0; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>💰 ${title}</h1>
                <div class="meta">
                    <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</p>
                    <p><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${type === 'transactions'
                ? '<th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th>'
                : '<th>Category</th><th>Total Spent</th><th>Count</th><th>Percentage</th>'
            }
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <p style="margin-top: 30px; color: #888; font-size: 12px;">
                    Generated by Vibe Tracker on ${new Date().toLocaleString()}
                </p>
            </body>
            </html>
        `;
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Reports 📊</h1>
                <p>Export your real spending data in various formats</p>
            </motion.div>

            {/* Stats Summary */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <DollarSign size={24} />
                    <div>
                        <span className={styles.statValue}>${totalExpenses.toFixed(0)}</span>
                        <span className={styles.statLabel}>Total Expenses</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <TrendingUp size={24} />
                    <div>
                        <span className={styles.statValue}>${totalIncome.toFixed(0)}</span>
                        <span className={styles.statLabel}>Total Income</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <FileText size={24} />
                    <div>
                        <span className={styles.statValue}>{transactions.length}</span>
                        <span className={styles.statLabel}>Transactions</span>
                    </div>
                </div>
            </div>

            {/* Date Range Selector */}
            <motion.div
                className={styles.dateSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2><Calendar size={20} /> Select Date Range</h2>
                <div className={styles.dateControls}>
                    <div className={styles.quickSelect}>
                        {['week', 'month', 'quarter', 'year'].map(range => (
                            <button
                                key={range}
                                className={`${styles.quickBtn} ${dateRange === range ? styles.active : ''}`}
                                onClick={() => setDateRange(range)}
                            >
                                This {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontWeight: 700 }}>or</span>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={startDate}
                        onChange={e => { setStartDate(e.target.value); setDateRange('custom'); }}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={endDate}
                        onChange={e => { setEndDate(e.target.value); setDateRange('custom'); }}
                    />
                    <button className={styles.refreshBtn} onClick={fetchTransactions} disabled={loading}>
                        <RefreshCw size={18} className={loading ? styles.spinning : ''} />
                    </button>
                </div>
            </motion.div>

            {/* Report Types */}
            <div className={styles.reportsGrid}>
                <motion.div
                    className={styles.reportCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <span className={styles.reportIcon}>📋</span>
                    <h3 className={styles.reportTitle}>Transaction Report</h3>
                    <p className={styles.reportDescription}>
                        Complete list of {transactions.length} transactions from {startDate} to {endDate}.
                    </p>
                    <div className={styles.reportActions}>
                        <button className={`${styles.downloadBtn} ${styles.primary}`} onClick={handleExportTransactionCSV}>
                            <FileSpreadsheet size={16} /> CSV
                        </button>
                        <button className={`${styles.downloadBtn} ${styles.secondary}`} onClick={() => handleExportPDF('transactions')}>
                            <FileText size={16} /> PDF
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.reportCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className={styles.reportIcon}>📊</span>
                    <h3 className={styles.reportTitle}>Category Summary</h3>
                    <p className={styles.reportDescription}>
                        Breakdown of spending across {categorySummary.length} categories.
                    </p>
                    <div className={styles.reportActions}>
                        <button className={`${styles.downloadBtn} ${styles.primary}`} onClick={handleExportCategoryCSV}>
                            <FileSpreadsheet size={16} /> CSV
                        </button>
                        <button className={`${styles.downloadBtn} ${styles.secondary}`} onClick={() => handleExportPDF('categories')}>
                            <FileText size={16} /> PDF
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.reportCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className={styles.reportIcon}>📈</span>
                    <h3 className={styles.reportTitle}>Full Export</h3>
                    <p className={styles.reportDescription}>
                        Download all your data for backup or analysis.
                    </p>
                    <div className={styles.reportActions}>
                        <button className={`${styles.downloadBtn} ${styles.primary}`} onClick={handleExportTransactionCSV}>
                            <Download size={16} /> Export All
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Preview Section */}
            <motion.div
                className={styles.previewSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2><Eye size={20} /> Report Preview ({transactions.length} transactions)</h2>
                {loading ? (
                    <div className={styles.loading}>Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className={styles.empty}>No transactions found for this period.</div>
                ) : (
                    <table className={styles.previewTable}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice(0, 10).map(tx => (
                                <tr key={tx.id}>
                                    <td>{tx.date}</td>
                                    <td><strong>{tx.description}</strong></td>
                                    <td>
                                        <span className={styles.categoryBadge}>{tx.category}</span>
                                    </td>
                                    <td>
                                        <span className={tx.type === 'income' ? styles.incomeType : styles.expenseType}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className={tx.type === 'income' ? styles.income : styles.amount}>
                                        {tx.type === 'expense' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length > 10 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                                        ... and {transactions.length - 10} more transactions
                                    </td>
                                </tr>
                            )}
                            <tr style={{ background: '#F8FAFC' }}>
                                <td colSpan={4} style={{ fontWeight: 800, textAlign: 'right' }}>TOTAL EXPENSES</td>
                                <td className={styles.amount} style={{ fontSize: '1.1rem' }}>
                                    -${totalExpenses.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* Category Breakdown */}
            {categorySummary.length > 0 && (
                <motion.div
                    className={styles.previewSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2>📊 Category Breakdown</h2>
                    <div className={styles.categoryBreakdown}>
                        {categorySummary.slice(0, 6).map(cat => (
                            <div key={cat.category} className={styles.categoryItem}>
                                <div className={styles.categoryHeader}>
                                    <span>{cat.category}</span>
                                    <span className={styles.categoryAmount}>${cat.total.toFixed(0)}</span>
                                </div>
                                <div className={styles.categoryBar}>
                                    <div
                                        className={styles.categoryProgress}
                                        style={{ width: `${cat.percentage}%` }}
                                    />
                                </div>
                                <span className={styles.categoryPercent}>{cat.percentage.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ReportsPage;
