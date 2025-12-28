// PDF Bank Statement Analyzer Service
// Supports BOTH text-based and image-based (scanned) PDFs
// Uses Python pdfplumber service for extraction + Backend AI for analysis

import * as pdfjsLib from 'pdfjs-dist';
import api from './api';
import { formatCurrency, getCurrencyCode } from './currencyService';
import { supabase } from '../config/supabase';

// Python PDF service URL (Railway in prod, localhost in dev)
const PDF_SERVICE_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

// Call backend AI for PDF analysis
const callAI = async (_type: string, systemPrompt: string, userPrompt: string) => {
    try {
        // Get user ID from Zustand auth-storage for auth
        const storedAuth = localStorage.getItem('auth-storage');
        const userId = storedAuth ? JSON.parse(storedAuth)?.state?.user?.id : null;

        const response = await api.post('/ai/chat', {
            message: `${systemPrompt}\n\n${userPrompt}`,
            context: 'pdf_analysis'
        }, {
            headers: userId ? { 'x-user-id': userId } : {}
        });
        return { response: response.data.response };
    } catch (error) {
        console.error('Backend AI call failed:', error);
        throw error;
    }
};


// Extract PDF using Python pdfplumber service (PRIMARY METHOD)
export const extractWithPythonService = async (file: File): Promise<{
    success: boolean;
    text: string;
    pageCount: number;
    bankName: string;
    transactions: any[];
    pageTexts: { page: number; text: string }[];
}> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Use the correct endpoint /parse-document
        const response = await fetch(`${PDF_SERVICE_URL}/parse-document`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PDF service error:', response.status, errorText);
            throw new Error(`PDF service error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Python PDF extraction successful:', data.page_count, 'pages,', data.transactions?.length || 0, 'transactions');

        // Map the response from parse-document endpoint
        return {
            success: true,
            text: data.raw_text || '',
            pageCount: data.page_count || 1,
            bankName: data.detected_period?.bank || 'Unknown',
            transactions: data.transactions || [],
            pageTexts: [],
        };
    } catch (error) {
        console.error('Python PDF service failed:', error);
        return {
            success: false,
            text: '',
            pageCount: 0,
            bankName: 'Unknown',
            transactions: [],
            pageTexts: [],
        };
    }
};


// Set up PDF.js worker - use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';


export interface ExtractedTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    confidence: number;
    rawText?: string;
}

export interface PDFAnalysisResult {
    success: boolean;
    transactions: ExtractedTransaction[];
    summary: {
        totalIncome: number;
        totalExpenses: number;
        netChange: number;
        transactionCount: number;
        dateRange: { start: string; end: string };
        topCategories: { name: string; amount: number }[];
    };
    bankName?: string;
    accountNumber?: string;
    statementPeriod?: string;
    aiInsights: string[];
    rawText?: string;
    error?: string;
    method?: 'text' | 'vision';
}

// Convert PDF page to image for Vision AI
const pdfPageToImage = async (page: any, scale: number = 2): Promise<string> => {
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise;

    // Convert to base64 PNG
    return canvas.toDataURL('image/png').split(',')[1];
};

// Use Gemini Vision to extract text from image
const extractTextWithVision = async (imageBase64: string): Promise<string> => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!geminiKey) {
        throw new Error('Gemini API key required for image-based PDF processing');
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `Extract ALL text from this bank statement or financial document image. 
Include every number, date, description, and amount you can see.
Format the output as plain text, preserving the structure as much as possible.
Include transaction dates, descriptions, amounts, and any totals.`
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini Vision error:', err);
            throw new Error('Vision API failed');
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error('Vision extraction error:', error);
        throw error;
    }
};

// Extract text from PDF - tries text first, then vision
export const extractTextFromPDF = async (file: File): Promise<{ text: string; method: 'text' | 'vision' }> => {
    console.log('Starting PDF extraction for:', file.name, 'Size:', file.size);

    const arrayBuffer = await file.arrayBuffer();

    // Try text extraction first
    try {
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            useSystemFonts: true,
            verbosity: 0,
        });

        const pdf = await loadingTask.promise;
        console.log('PDF loaded, pages:', pdf.numPages);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            let lastY: number | null = null;
            let pageText = '';

            for (const item of textContent.items as any[]) {
                if (item.str) {
                    if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                        pageText += '\n';
                    } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
                        pageText += ' ';
                    }
                    pageText += item.str;
                    lastY = item.transform[5];
                }
            }

            fullText += pageText + '\n\n';
        }

        // Check if we got enough text
        if (fullText.trim().length > 100) {
            console.log('Text extraction successful, chars:', fullText.length);
            return { text: fullText, method: 'text' };
        }

        console.log('Text extraction yielded low content, trying vision...');

        // Fall back to vision for image-based PDFs
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!geminiKey) {
            return {
                text: fullText,
                method: 'text'
            };
        }

        console.log('Using AI Vision for image-based PDF...');
        let visionText = '';

        // Process first 3 pages max with vision (to save API costs)
        const maxPages = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= maxPages; i++) {
            try {
                const page = await pdf.getPage(i);
                console.log(`Converting page ${i} to image...`);
                const imageBase64 = await pdfPageToImage(page, 1.5);
                console.log(`Extracting text from page ${i} with Vision AI...`);
                const pageVisionText = await extractTextWithVision(imageBase64);
                visionText += `\n--- Page ${i} ---\n${pageVisionText}\n`;
            } catch (pageError) {
                console.error(`Vision failed for page ${i}:`, pageError);
            }
        }

        if (visionText.trim().length > 50) {
            console.log('Vision extraction successful, chars:', visionText.length);
            return { text: visionText, method: 'vision' };
        }

        // Return whatever we have
        return { text: fullText || visionText, method: fullText.length > visionText.length ? 'text' : 'vision' };

    } catch (error: any) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract: ${error.message}`);
    }
};

// Use AI to analyze extracted text
export const analyzeStatementWithAI = async (text: string): Promise<PDFAnalysisResult> => {
    try {
        const prompt = `You are a financial document analyzer. Analyze this bank statement or tax document and extract all transactions/entries.

DOCUMENT TEXT:
${text.slice(0, 15000)} ${text.length > 15000 ? '...(truncated)' : ''}

INSTRUCTIONS:
1. Extract ALL financial transactions/entries (date, description, amount, type)
2. For tax documents (WHT), extract each withholding entry as a transaction
3. Categorize each (Tax, Salary, Payment, Transfer, Fee, Other)
4. Identify issuer/bank name
5. Identify account/reference numbers (mask as ****XXXX)
6. Identify period covered

RESPOND IN THIS EXACT JSON FORMAT ONLY:
{
    "bankName": "Bank/Issuer Name or Unknown",
    "accountNumber": "****XXXX or Unknown",
    "statementPeriod": "Date Range or Year",
    "transactions": [
        {
            "date": "YYYY-MM-DD",
            "description": "Description",
            "amount": 123.45,
            "type": "expense or income",
            "category": "Category"
        }
    ],
    "insights": ["Insight 1", "Insight 2"]
}`;

        const systemPrompt = `You are a financial document analyzer. Extract transactions from bank statements and tax documents.
Return ONLY valid JSON with the exact structure requested. No markdown, no explanations.`;

        const result = await callAI('pdf', systemPrompt, prompt);

        if (!result || !result.response) {
            console.error('AI analysis returned no response');
            throw new Error('AI analysis failed - no response');
        }

        const response = result.response;
        console.log('AI Response (DeepSeek-R1) length:', response.length);

        let parsed;
        try {
            // Clean up the response first
            let cleanResponse = response.replace(/```json\n?|\n?```/g, ''); // Remove Markdown code blocks

            // Find the outer object
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON in response');
            }
        } catch (parseError) {
            console.error('Parse failed:', parseError);
            console.log('Raw response:', response); // Debug log
            return createFallbackResult(text);
        }

        const transactions: ExtractedTransaction[] = (parsed.transactions || []).map((tx: any, i: number) => ({
            id: `ai-${Date.now()}-${i}`,
            date: tx.date || new Date().toISOString().split('T')[0],
            description: tx.description || 'Unknown',
            amount: Math.abs(parseFloat(tx.amount) || 0),
            type: tx.type === 'income' ? 'income' : 'expense',
            category: tx.category || 'Other',
            confidence: 0.85,
        }));

        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const topCategories = Object.entries(categoryTotals)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        const dates = transactions.map(t => t.date).filter(d => d).sort();

        return {
            success: true,
            transactions,
            summary: {
                totalIncome,
                totalExpenses,
                netChange: totalIncome - totalExpenses,
                transactionCount: transactions.length,
                dateRange: {
                    start: dates[0] || 'Unknown',
                    end: dates[dates.length - 1] || 'Unknown',
                },
                topCategories,
            },
            bankName: parsed.bankName || 'Unknown',
            accountNumber: parsed.accountNumber || '****XXXX',
            statementPeriod: parsed.statementPeriod || 'Unknown',
            aiInsights: parsed.insights || [],
            rawText: text,
        };
    } catch (error) {
        console.error('AI analysis error:', error);
        return {
            success: false,
            transactions: [],
            summary: {
                totalIncome: 0,
                totalExpenses: 0,
                netChange: 0,
                transactionCount: 0,
                dateRange: { start: '', end: '' },
                topCategories: [],
            },
            aiInsights: [],
            error: 'Failed to analyze with AI',
        };
    }
};

// Fallback parsing
const createFallbackResult = (text: string): PDFAnalysisResult => {
    const transactions: ExtractedTransaction[] = [];

    // Look for amount patterns
    const patterns = [
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
        /PKR\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
        /Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    ];

    let count = 0;
    for (const pattern of patterns) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null && count < 50) {
            count++;
            const amountStr = match[3] || match[1];
            const amount = parseFloat(amountStr.replace(/,/g, ''));

            if (amount > 0 && amount < 100000000) {
                transactions.push({
                    id: `fallback-${Date.now()}-${count}`,
                    date: new Date().toISOString().split('T')[0],
                    description: (match[2] || 'Transaction').trim().slice(0, 50),
                    amount,
                    type: 'expense',
                    category: 'Other',
                    confidence: 0.4,
                });
            }
        }
    }

    return {
        success: transactions.length > 0,
        transactions,
        summary: {
            totalIncome: 0,
            totalExpenses: transactions.reduce((s, t) => s + t.amount, 0),
            netChange: 0,
            transactionCount: transactions.length,
            dateRange: { start: '', end: '' },
            topCategories: [],
        },
        aiInsights: ['Automated extraction - please verify manually'],
        rawText: text,
    };
};

// Save to Supabase
export const saveTransactionsToSupabase = async (
    userId: string,
    transactions: ExtractedTransaction[],
    statementInfo: { bankName?: string; statementPeriod?: string }
): Promise<{ success: boolean; savedCount: number; error?: string }> => {
    try {
        let statementId = null;

        try {
            const { data: statement } = await supabase
                .from('bank_statements')
                .insert({
                    user_id: userId,
                    bank_name: statementInfo.bankName || 'Unknown',
                    statement_period: statementInfo.statementPeriod || 'Unknown',
                    transaction_count: transactions.length,
                    total_income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                    total_expenses: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
                    imported_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (statement) statementId = statement.id;
        } catch (e) {
            // Ignore 404 error if table doesn't exist
            console.warn('Could not save bank statement metadata (table might differ/missing), but will try transactions.', e);
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert(transactions.map(tx => ({
                user_id: userId,
                statement_id: statementId,
                date: tx.date,
                description: tx.description,
                amount: tx.amount,
                type: tx.type,
                category: tx.category,
                source: 'pdf_import',
                confidence: tx.confidence,
                created_at: new Date().toISOString(),
            })))
            .select();

        if (error) {
            return { success: false, savedCount: 0, error: error.message };
        }

        return { success: true, savedCount: data?.length || 0 };
    } catch (error: any) {
        return { success: false, savedCount: 0, error: error.message };
    }
};

// Main processing function
export const processBankStatementPDF = async (
    file: File,
    userId?: string
): Promise<PDFAnalysisResult & { saved?: boolean; savedCount?: number }> => {
    try {
        console.log('Step 1: Trying Python pdfplumber service first...');

        // Try Python pdfplumber service first (faster, better for machine-generated PDFs)
        const pythonResult = await extractWithPythonService(file);

        let extractResult: { text: string; method: 'text' | 'vision' };
        let preExtractedTransactions: ExtractedTransaction[] = [];

        if (pythonResult.success && pythonResult.text.length > 100) {
            console.log('✅ Python extraction successful:', pythonResult.pageCount, 'pages');
            extractResult = { text: pythonResult.text, method: 'text' };

            // Use transactions from Python service if available
            if (pythonResult.transactions && pythonResult.transactions.length > 0) {
                preExtractedTransactions = pythonResult.transactions.map((tx: any, i: number) => ({
                    id: tx.id || `python-${Date.now()}-${i}`,
                    date: tx.date || new Date().toISOString().split('T')[0],
                    description: tx.description || 'Transaction',
                    amount: tx.amount || 0,
                    type: tx.type || 'expense',
                    category: 'Other',
                    confidence: tx.confidence || 0.7,
                } as ExtractedTransaction));
            }
        } else {
            console.log('Python service failed or low content, falling back to PDF.js...');
            try {
                extractResult = await extractTextFromPDF(file);
            } catch (extractError: any) {
                console.error('All extraction methods failed:', extractError);
                return {
                    success: false,
                    transactions: [],
                    summary: {
                        totalIncome: 0,
                        totalExpenses: 0,
                        netChange: 0,
                        transactionCount: 0,
                        dateRange: { start: '', end: '' },
                        topCategories: [],
                    },
                    aiInsights: [],
                    error: extractError.message,
                };
            }
        }

        console.log(`Extraction method: ${extractResult.method}, text length: ${extractResult.text.length}`);


        if (!extractResult.text || extractResult.text.trim().length < 20) {
            return {
                success: false,
                transactions: [],
                summary: {
                    totalIncome: 0,
                    totalExpenses: 0,
                    netChange: 0,
                    transactionCount: 0,
                    dateRange: { start: '', end: '' },
                    topCategories: [],
                },
                aiInsights: [],
                error: 'Could not extract content from PDF. Please ensure Gemini API key is set for image-based PDFs.',
            };
        }

        console.log('Step 2: Analyzing with AI...');

        let result: PDFAnalysisResult;
        try {
            result = await analyzeStatementWithAI(extractResult.text);
            result.method = extractResult.method;
        } catch (aiError: any) {
            console.warn('AI analysis failed, using Python-extracted transactions as fallback:', aiError.message);

            // Use Python-extracted transactions if available
            if (preExtractedTransactions.length > 0) {
                console.log('✅ Using', preExtractedTransactions.length, 'Python-extracted transactions');
                const totalIncome = preExtractedTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const totalExpenses = preExtractedTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

                result = {
                    success: true,
                    transactions: preExtractedTransactions,
                    summary: {
                        totalIncome,
                        totalExpenses,
                        netChange: totalIncome - totalExpenses,
                        transactionCount: preExtractedTransactions.length,
                        dateRange: { start: '', end: '' },
                        topCategories: [],
                    },
                    bankName: pythonResult.bankName || 'Unknown',
                    aiInsights: ['Extracted using Python pdfplumber (AI analysis unavailable)'],
                    method: 'text',
                };
            } else {
                // No Python transactions either
                return {
                    success: false,
                    transactions: [],
                    summary: {
                        totalIncome: 0,
                        totalExpenses: 0,
                        netChange: 0,
                        transactionCount: 0,
                        dateRange: { start: '', end: '' },
                        topCategories: [],
                    },
                    aiInsights: [],
                    error: 'AI analysis failed and no transactions could be extracted from PDF.',
                };
            }
        }

        if (userId && result.success && result.transactions.length > 0) {
            console.log('Step 3: Saving to database...');
            const saveResult = await saveTransactionsToSupabase(userId, result.transactions, {
                bankName: result.bankName,
                statementPeriod: result.statementPeriod,
            });

            return {
                ...result,
                saved: saveResult.success,
                savedCount: saveResult.savedCount,
            };
        }

        return result;
    } catch (error: any) {
        console.error('Processing error:', error);
        return {
            success: false,
            transactions: [],
            summary: {
                totalIncome: 0,
                totalExpenses: 0,
                netChange: 0,
                transactionCount: 0,
                dateRange: { start: '', end: '' },
                topCategories: [],
            },
            aiInsights: [],
            error: error.message || 'Processing failed',
        };
    }
};

export default {
    extractTextFromPDF,
    analyzeStatementWithAI,
    saveTransactionsToSupabase,
    processBankStatementPDF,
};
