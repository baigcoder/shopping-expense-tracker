// Export Service - CSV, Excel, PDF generation
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportTransaction {
    id?: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    source?: string;
}

export interface ExportOptions {
    filename?: string;
    dateRange?: { start: string; end: string };
    includeCategories?: boolean;
    includeSummary?: boolean;
}

// ================================
// CSV EXPORT
// ================================
export function exportToCSV(transactions: ExportTransaction[], options: ExportOptions = {}): void {
    const filename = options.filename || `cashly-transactions-${new Date().toISOString().split('T')[0]}`;

    // Headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];

    // Convert transactions to rows
    const rows = transactions.map(t => [
        t.date,
        `"${t.description?.replace(/"/g, '""') || ''}"`,
        t.category || 'Other',
        t.type,
        t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount)
    ]);

    // Add summary if requested
    if (options.includeSummary) {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        rows.push([]);
        rows.push(['', '', '', 'Total Income', totalIncome]);
        rows.push(['', '', '', 'Total Expenses', -totalExpense]);
        rows.push(['', '', '', 'Net', totalIncome - totalExpense]);
    }

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

// ================================
// EXCEL EXPORT
// ================================
export function exportToExcel(transactions: ExportTransaction[], options: ExportOptions = {}): void {
    const filename = options.filename || `cashly-transactions-${new Date().toISOString().split('T')[0]}`;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Transform data
    const data = transactions.map(t => ({
        'Date': t.date,
        'Description': t.description || '',
        'Category': t.category || 'Other',
        'Type': t.type,
        'Amount': t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount)
    }));

    // Create main transactions sheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // Date
        { wch: 35 },  // Description
        { wch: 15 },  // Category
        { wch: 10 },  // Type
        { wch: 12 }   // Amount
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Add summary sheet if requested
    if (options.includeSummary) {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        // Category breakdown
        const categoryTotals: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        const summaryData = [
            { 'Metric': 'Total Income', 'Amount': totalIncome },
            { 'Metric': 'Total Expenses', 'Amount': -totalExpense },
            { 'Metric': 'Net Savings', 'Amount': totalIncome - totalExpense },
            { 'Metric': '', 'Amount': '' },
            { 'Metric': '--- Category Breakdown ---', 'Amount': '' },
            ...Object.entries(categoryTotals).map(([cat, amount]) => ({
                'Metric': cat,
                'Amount': -amount
            }))
        ];

        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    // Generate buffer and download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `${filename}.xlsx`);
}

// ================================
// PDF REPORT GENERATION
// ================================
export async function exportToPDF(
    elementId: string,
    options: ExportOptions = {}
): Promise<void> {
    const filename = options.filename || `cashly-report-${new Date().toISOString().split('T')[0]}`;

    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        // Capture the element as canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Calculate dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // Add pages if content is long
        let heightLeft = imgHeight;
        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Save PDF
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}

// Manual PDF generation (for transactions list without HTML element)
export function exportTransactionsToPDF(
    transactions: ExportTransaction[],
    options: ExportOptions = {}
): void {
    const filename = options.filename || `cashly-transactions-${new Date().toISOString().split('T')[0]}`;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(16, 185, 129); // Emerald
    pdf.text('Cashly', 14, 20);

    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text('Transaction Report', 14, 28);

    // Date range
    if (options.dateRange) {
        pdf.setFontSize(10);
        pdf.text(`${options.dateRange.start} to ${options.dateRange.end}`, 14, 35);
    } else {
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    }

    // Summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    pdf.setFontSize(11);
    pdf.setTextColor(0);
    pdf.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, 48);
    pdf.text(`Total Expenses: $${totalExpense.toFixed(2)}`, 14, 55);
    pdf.text(`Net: $${(totalIncome - totalExpense).toFixed(2)}`, 14, 62);

    // Line separator
    pdf.setDrawColor(200);
    pdf.line(14, 68, pageWidth - 14, 68);

    // Table headers
    let yPos = 78;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date', 14, yPos);
    pdf.text('Description', 40, yPos);
    pdf.text('Category', 120, yPos);
    pdf.text('Amount', 165, yPos);

    // Table rows
    pdf.setFont('helvetica', 'normal');
    yPos += 8;

    transactions.forEach((t, index) => {
        if (yPos > 280) {
            pdf.addPage();
            yPos = 20;
        }

        const amount = t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount);
        const amountColor = t.type === 'expense' ? [239, 68, 68] : [16, 185, 129];

        pdf.setTextColor(0);
        pdf.text(t.date, 14, yPos);
        pdf.text((t.description || '').substring(0, 40), 40, yPos);
        pdf.text(t.category || 'Other', 120, yPos);

        pdf.setTextColor(amountColor[0], amountColor[1], amountColor[2]);
        pdf.text(`$${Math.abs(amount).toFixed(2)}`, 165, yPos);

        yPos += 7;
    });

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        pdf.text('Generated by Cashly', pageWidth / 2, 295, { align: 'center' });
    }

    pdf.save(`${filename}.pdf`);
}

// ================================
// IMPORT FUNCTIONS
// ================================
export interface ImportResult {
    transactions: ExportTransaction[];
    errors: string[];
    warnings: string[];
}

export async function importFromCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const result = parseCSV(text);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export async function importFromExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const result = parseExcelData(jsonData);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function parseCSV(text: string): ImportResult {
    const lines = text.trim().split('\n');
    const transactions: ExportTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const parts = parseCSVLine(line);
            if (parts.length < 3) {
                warnings.push(`Line ${i + 1}: Insufficient columns`);
                continue;
            }

            const [date, description, categoryOrAmount, typeOrAmount, amount] = parts;

            // Try to detect format
            let transaction: ExportTransaction;

            if (parts.length >= 5) {
                // Full format: Date, Description, Category, Type, Amount
                transaction = {
                    date: parseDate(date),
                    description: description.replace(/^"|"$/g, ''),
                    category: categoryOrAmount,
                    type: typeOrAmount.toLowerCase().includes('income') ? 'income' : 'expense',
                    amount: Math.abs(parseFloat(amount.replace(/[^0-9.-]/g, '')))
                };
            } else if (parts.length >= 3) {
                // Minimal format: Date, Description, Amount
                const amountVal = parseFloat(categoryOrAmount.replace(/[^0-9.-]/g, ''));
                transaction = {
                    date: parseDate(date),
                    description: description.replace(/^"|"$/g, ''),
                    category: 'Other',
                    type: amountVal < 0 ? 'expense' : 'income',
                    amount: Math.abs(amountVal)
                };
            } else {
                errors.push(`Line ${i + 1}: Could not parse`);
                continue;
            }

            if (transaction.date && !isNaN(transaction.amount)) {
                transactions.push(transaction);
            } else {
                warnings.push(`Line ${i + 1}: Invalid date or amount`);
            }
        } catch (err) {
            errors.push(`Line ${i + 1}: ${err}`);
        }
    }

    return { transactions, errors, warnings };
}

function parseExcelData(data: any[]): ImportResult {
    const transactions: ExportTransaction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((row, index) => {
        try {
            const date = row.Date || row.date || row.DATE;
            const description = row.Description || row.description || row.DESCRIPTION || row.Name || row.name;
            const category = row.Category || row.category || row.CATEGORY || 'Other';
            const type = row.Type || row.type || row.TYPE;
            const amount = row.Amount || row.amount || row.AMOUNT;

            if (!date || amount === undefined) {
                warnings.push(`Row ${index + 2}: Missing date or amount`);
                return;
            }

            const amountVal = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
            const transactionType = type?.toLowerCase?.().includes('income')
                ? 'income'
                : (amountVal >= 0 && !type ? 'income' : 'expense');

            transactions.push({
                date: parseDate(String(date)),
                description: String(description || ''),
                category: String(category),
                type: transactionType,
                amount: Math.abs(amountVal)
            });
        } catch (err) {
            errors.push(`Row ${index + 2}: ${err}`);
        }
    });

    return { transactions, errors, warnings };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

function parseDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        // Try different formats
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
            const [a, b, c] = parts.map(p => parseInt(p));
            // Try MM/DD/YYYY
            if (a <= 12) {
                return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
            }
            // Try DD/MM/YYYY
            return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
        }
        return dateStr;
    }
    return date.toISOString().split('T')[0];
}

// ================================
// HELPER FUNCTIONS
// ================================
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ================================
// UNIFIED EXPORT (for ExportModal)
// ================================
interface UnifiedExportOptions {
    format: 'csv' | 'json' | 'pdf';
    fileName?: string;
}

export function exportTransactions(
    transactions: ExportTransaction[],
    options: UnifiedExportOptions
): void {
    const { format, fileName } = options;
    const baseFilename = fileName || `cashly-export-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
        case 'csv':
            exportToCSV(transactions, { filename: baseFilename, includeSummary: true });
            break;
        case 'json':
            exportToJSON(transactions, baseFilename);
            break;
        case 'pdf':
            exportTransactionsToPDF(transactions, { filename: baseFilename });
            break;
    }
}

// JSON export helper
function exportToJSON(transactions: ExportTransaction[], filename: string): void {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const data = {
        exportDate: new Date().toISOString(),
        summary: {
            totalTransactions: transactions.length,
            totalIncome,
            totalExpenses: totalExpense,
            netSavings: totalIncome - totalExpense
        },
        transactions
    };

    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

export const exportService = {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportTransactionsToPDF,
    exportTransactions,
    importFromCSV,
    importFromExcel
};

export default exportService;

