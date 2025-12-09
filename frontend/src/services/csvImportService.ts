// CSV Import Service - Parse bank statements
import { formatCurrency, getCurrencyCode } from './currencyService';

export interface ParsedTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    merchant?: string;
}

// Common CSV formats for different banks
const CSV_FORMATS = {
    // Standard format: Date, Description, Amount
    standard: {
        dateIndex: 0,
        descriptionIndex: 1,
        amountIndex: 2,
        debitIndex: null,
        creditIndex: null,
    },
    // Separate debit/credit columns
    debitCredit: {
        dateIndex: 0,
        descriptionIndex: 1,
        amountIndex: null,
        debitIndex: 2,
        creditIndex: 3,
    },
    // PayPal format
    paypal: {
        dateIndex: 0,
        descriptionIndex: 3,
        amountIndex: 7,
        debitIndex: null,
        creditIndex: null,
    },
};

// Auto-detect category based on description
const AUTO_CATEGORIES: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'pizza', 'burger', 'coffee', 'cafe', 'food', 'eat', 'mcdonald', 'kfc', 'subway', 'starbucks', 'uber eats', 'foodpanda', 'deliveroo'],
    'Shopping': ['amazon', 'ebay', 'walmart', 'target', 'aliexpress', 'daraz', 'shopping', 'store', 'mall', 'market'],
    'Transport': ['uber', 'lyft', 'careem', 'taxi', 'fuel', 'gas', 'petrol', 'parking', 'transit'],
    'Entertainment': ['netflix', 'spotify', 'youtube', 'disney', 'hbo', 'cinema', 'movie', 'game', 'steam', 'playstation'],
    'Utilities': ['electricity', 'water', 'gas bill', 'internet', 'phone', 'mobile', 'ptcl', 'jazz', 'zong', 'telenor'],
    'Subscriptions': ['subscription', 'monthly', 'premium', 'pro plan', 'membership'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'medical', 'health', 'medicine'],
    'Education': ['school', 'university', 'course', 'udemy', 'coursera', 'book', 'tuition'],
    'Transfer': ['transfer', 'sent to', 'received from', 'payment to', 'payment from'],
};

// Detect category from description
export const detectCategory = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(AUTO_CATEGORIES)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }

    return 'Other';
};

// Parse amount string to number
const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;

    // Remove currency symbols and whitespace
    let cleaned = amountStr.replace(/[^0-9.\-,]/g, '');

    // Handle European format (1.234,56)
    if (cleaned.includes(',') && cleaned.indexOf(',') > cleaned.indexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        cleaned = cleaned.replace(/,/g, '');
    }

    return parseFloat(cleaned) || 0;
};

// Parse date string
const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Try different date formats
    const formats = [
        // ISO format
        /^(\d{4})-(\d{2})-(\d{2})/,
        // US format MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        // EU format DD/MM/YYYY
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})/,
        // DD-MM-YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})/,
    ];

    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            } catch { }
        }
    }

    // Fallback
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch { }

    return new Date().toISOString().split('T')[0];
};

// Main CSV parser
export const parseCSV = (csvContent: string): ParsedTransaction[] => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const transactions: ParsedTransaction[] = [];

    // Skip header row
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted fields)
        const fields = parseCSVLine(line);
        if (fields.length < 3) continue;

        const dateStr = fields[0] || '';
        const description = fields[1] || fields[2] || 'Unknown';
        let amount = parseAmount(fields[2] || fields[3] || '0');

        // Handle debit/credit columns
        if (fields.length >= 4) {
            const debit = parseAmount(fields[2] || '0');
            const credit = parseAmount(fields[3] || '0');
            if (debit && !credit) amount = -Math.abs(debit);
            else if (credit && !debit) amount = Math.abs(credit);
            else if (!amount) amount = credit - debit;
        }

        const type: 'income' | 'expense' = amount >= 0 ? 'income' : 'expense';

        transactions.push({
            id: `import-${Date.now()}-${i}`,
            date: parseDate(dateStr),
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            category: detectCategory(description),
            merchant: extractMerchant(description),
        });
    }

    return transactions;
};

// Parse CSV line handling quoted fields
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

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
};

// Extract merchant from description
const extractMerchant = (description: string): string => {
    // Common patterns
    const patterns = [
        /^(.*?)(?:\s+\d|$)/,  // Before first number
        /^([A-Za-z\s]+)/,     // First words
    ];

    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match && match[1]) {
            const merchant = match[1].trim();
            if (merchant.length > 2 && merchant.length < 50) {
                return merchant;
            }
        }
    }

    return description.slice(0, 30);
};

// Validate parsed transactions
export const validateTransactions = (transactions: ParsedTransaction[]): {
    valid: ParsedTransaction[];
    invalid: { line: number; reason: string }[];
} => {
    const valid: ParsedTransaction[] = [];
    const invalid: { line: number; reason: string }[] = [];

    transactions.forEach((tx, index) => {
        if (!tx.date) {
            invalid.push({ line: index + 2, reason: 'Missing date' });
        } else if (!tx.description) {
            invalid.push({ line: index + 2, reason: 'Missing description' });
        } else if (tx.amount === 0) {
            invalid.push({ line: index + 2, reason: 'Amount is zero' });
        } else {
            valid.push(tx);
        }
    });

    return { valid, invalid };
};

// Get import summary
export const getImportSummary = (transactions: ParsedTransaction[]): {
    total: number;
    income: number;
    expenses: number;
    incomeAmount: number;
    expenseAmount: number;
    categories: { name: string; count: number }[];
    dateRange: { start: string; end: string };
} => {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const categoryCount: Record<string, number> = {};
    transactions.forEach(t => {
        if (t.category) {
            categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
        }
    });

    const dates = transactions.map(t => t.date).sort();

    return {
        total: transactions.length,
        income: income.length,
        expenses: expenses.length,
        incomeAmount: income.reduce((sum, t) => sum + t.amount, 0),
        expenseAmount: expenses.reduce((sum, t) => sum + t.amount, 0),
        categories: Object.entries(categoryCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
        dateRange: {
            start: dates[0] || '',
            end: dates[dates.length - 1] || '',
        },
    };
};

export default {
    parseCSV,
    validateTransactions,
    getImportSummary,
    detectCategory,
};
