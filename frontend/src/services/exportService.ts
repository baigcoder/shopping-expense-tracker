// Transaction Export Service
// Exports transactions to CSV, JSON, or PDF formats

import { formatCurrency, getCurrencyCode } from './currencyService';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    merchant?: string;
    source?: string;
}

interface ExportOptions {
    format: 'csv' | 'json' | 'pdf';
    dateRange?: { start: string; end: string };
    includeCategories?: boolean;
    fileName?: string;
}

// Export to CSV
const exportToCSV = (transactions: Transaction[], fileName: string): void => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', `Amount (${getCurrencyCode()})`];

    const rows = transactions.map(tx => [
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes in description
        tx.category || 'Uncategorized',
        tx.type,
        tx.type === 'expense' ? -tx.amount : tx.amount,
        formatCurrency(tx.amount),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
};

// Export to JSON
const exportToJSON = (transactions: Transaction[], fileName: string): void => {
    const exportData = {
        exportDate: new Date().toISOString(),
        currency: getCurrencyCode(),
        totalTransactions: transactions.length,
        summary: {
            totalIncome: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
            totalExpenses: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        },
        transactions: transactions.map(tx => ({
            id: tx.id,
            date: tx.date,
            description: tx.description,
            category: tx.category,
            type: tx.type,
            amount: tx.amount,
            formattedAmount: formatCurrency(tx.amount),
        })),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `${fileName}.json`, 'application/json');
};

// Export to PDF (creates a styled HTML that triggers print dialog)
const exportToPDF = (transactions: Transaction[], fileName: string): void => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Group by category
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Transaction Report - ${fileName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            color: #1a1a1a;
            line-height: 1.5;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 800;
            margin-bottom: 8px;
        }
        .header p { color: #666; font-size: 14px; }
        .summary { 
            display: flex; 
            gap: 20px; 
            margin-bottom: 40px;
        }
        .summary-card {
            flex: 1;
            padding: 20px;
            border: 2px solid #000;
            border-radius: 12px;
            text-align: center;
        }
        .summary-card.income { background: #ecfdf5; }
        .summary-card.expense { background: #fef2f2; }
        .summary-card.net { background: #f8fafc; }
        .summary-label { font-size: 12px; text-transform: uppercase; color: #666; }
        .summary-value { font-size: 24px; font-weight: 800; margin-top: 4px; }
        .income .summary-value { color: #10B981; }
        .expense .summary-value { color: #ef4444; }
        .categories { margin-bottom: 40px; }
        .categories h3 { margin-bottom: 15px; font-size: 16px; }
        .category-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background: #f8fafc;
            margin-bottom: 6px;
            border-radius: 6px;
        }
        .transactions { margin-top: 30px; }
        .transactions h3 { margin-bottom: 15px; font-size: 16px; }
        table { 
            width: 100%; 
            border-collapse: collapse;
        }
        th { 
            text-align: left; 
            padding: 12px 8px;
            border-bottom: 2px solid #000;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
        }
        td { 
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        .amount { text-align: right; font-weight: 600; }
        .amount.expense { color: #ef4444; }
        .amount.income { color: #10B981; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 11px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Transaction Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })} • ${transactions.length} transactions</p>
    </div>

    <div class="summary">
        <div class="summary-card income">
            <div class="summary-label">Total Income</div>
            <div class="summary-value">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="summary-card expense">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-value">${formatCurrency(totalExpenses)}</div>
        </div>
        <div class="summary-card net">
            <div class="summary-label">Net Change</div>
            <div class="summary-value">${formatCurrency(totalIncome - totalExpenses)}</div>
        </div>
    </div>

    ${sortedCategories.length > 0 ? `
    <div class="categories">
        <h3>📁 Spending by Category</h3>
        ${sortedCategories.map(([cat, amount]) => `
            <div class="category-row">
                <span>${cat}</span>
                <span>${formatCurrency(amount)}</span>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="transactions">
        <h3>📋 All Transactions</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(tx => `
                    <tr>
                        <td>${new Date(tx.date).toLocaleDateString()}</td>
                        <td>${tx.description}</td>
                        <td>${tx.category || 'Uncategorized'}</td>
                        <td class="amount ${tx.type}">${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Vibe Tracker Report • Currency: ${getCurrencyCode()}</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
};

// Helper to download file
const downloadFile = (content: string, fileName: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

// Main export function
export const exportTransactions = (
    transactions: Transaction[],
    options: ExportOptions
): void => {
    const fileName = options.fileName || `transactions-${new Date().toISOString().split('T')[0]}`;

    // Filter by date range if provided
    let filteredTransactions = [...transactions];
    if (options.dateRange) {
        filteredTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const start = new Date(options.dateRange!.start);
            const end = new Date(options.dateRange!.end);
            return txDate >= start && txDate <= end;
        });
    }

    switch (options.format) {
        case 'csv':
            exportToCSV(filteredTransactions, fileName);
            break;
        case 'json':
            exportToJSON(filteredTransactions, fileName);
            break;
        case 'pdf':
            exportToPDF(filteredTransactions, fileName);
            break;
    }
};

export default {
    exportTransactions,
};
