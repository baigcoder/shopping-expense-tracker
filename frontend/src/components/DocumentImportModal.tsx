// AI Document Import Modal - Premium File Upload with OCR Processing
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, FileText, FileSpreadsheet, Image, Loader2,
    CheckCircle, AlertTriangle, Brain, Sparkles, Plus, Check, FileImage
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';

interface ExtractedTransaction {
    description: string;
    amount: number;
    date?: string;
    category?: string;
    type: 'expense' | 'income';
    selected?: boolean;
}

interface DetectedPeriod {
    month?: string;
    year?: number;
    start_date?: string;
    end_date?: string;
    raw_text?: string;
}

interface DocumentImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete?: () => void;
}

const AI_SERVER_URL = 'http://localhost:8000';

const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
    isOpen,
    onClose,
    onImportComplete
}) => {
    const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'success'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [rawText, setRawText] = useState('');
    const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
    const [importing, setImporting] = useState(false);
    const [detectedPeriod, setDetectedPeriod] = useState<DetectedPeriod | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showAllTransactions, setShowAllTransactions] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'csv', 'docx'];

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();

        if (!ext || !allowedExtensions.includes(ext)) {
            setError('Unsupported file type. Please use PDF, images, CSV, or Word documents.');
            return;
        }

        setFile(selectedFile);
        setError('');
        processDocument(selectedFile);
    };

    const processDocument = async (selectedFile: File) => {
        setStep('processing');
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch(`${AI_SERVER_URL}/parse-document`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to parse document');
            }

            const result = await response.json();

            setRawText(result.raw_text);
            setTransactions(result.transactions.map((t: any) => ({ ...t, selected: true })));

            // Handle detected period
            if (result.detected_period) {
                setDetectedPeriod(result.detected_period);
                // Set month from detected month name
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const monthIndex = monthNames.indexOf(result.detected_period.month);
                if (monthIndex >= 0) {
                    setSelectedMonth(monthIndex + 1);
                }
                if (result.detected_period.year) {
                    setSelectedYear(result.detected_period.year);
                }
                toast.success(`Detected statement period: ${result.detected_period.month} ${result.detected_period.year}`);
            }

            setStep('review');

            if (result.transactions.length === 0) {
                toast.info('No transactions detected', { description: 'You can view the raw extracted text below.' });
            } else {
                toast.success(`Found ${result.transactions.length} transactions`);
            }
        } catch (err: any) {
            console.error('Document processing error:', err);
            setError(err.message || 'Failed to process document');
            setStep('upload');
            toast.error('Processing failed', { description: err.message });
        }
    };

    // Filter transactions by selected period (unless Show All is enabled)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const displayedTransactions = showAllTransactions
        ? transactions
        : transactions.filter(tx => {
            if (!tx.date) return true; // Include transactions without dates

            const dateStr = tx.date.toLowerCase();

            // Try to parse month from the date string
            let txMonth = -1;
            let txYear = selectedYear; // Default to selected year

            // Check for month names (Feb, February, etc.)
            for (let i = 0; i < 12; i++) {
                if (dateStr.includes(monthNames[i].toLowerCase()) ||
                    dateStr.includes(shortMonthNames[i].toLowerCase())) {
                    txMonth = i + 1;
                    break;
                }
            }

            // Try parsing as actual date if month not found
            if (txMonth === -1) {
                const txDate = new Date(tx.date);
                if (!isNaN(txDate.getTime())) {
                    txMonth = txDate.getMonth() + 1;
                    txYear = txDate.getFullYear();
                } else {
                    return true; // Can't parse, include it
                }
            }

            // Check for year in date string (e.g., "2024" or "25")
            const yearMatch = dateStr.match(/\b(20\d{2})\b/) || dateStr.match(/\b(\d{2})\b/);
            if (yearMatch) {
                const year = parseInt(yearMatch[1]);
                txYear = year > 100 ? year : 2000 + year;
            }

            return txMonth === selectedMonth && txYear === selectedYear;
        });

    const toggleTransaction = (idx: number) => {
        const originalTx = displayedTransactions[idx];
        const originalIdx = transactions.indexOf(originalTx);
        if (originalIdx >= 0) {
            setTransactions(prev => prev.map((t, i) =>
                i === originalIdx ? { ...t, selected: !t.selected } : t
            ));
        }
    };

    const selectAll = () => {
        const displayedSet = new Set(displayedTransactions);
        setTransactions(prev => prev.map(t =>
            displayedSet.has(t) ? { ...t, selected: true } : t
        ));
    };

    const deselectAll = () => {
        const displayedSet = new Set(displayedTransactions);
        setTransactions(prev => prev.map(t =>
            displayedSet.has(t) ? { ...t, selected: false } : t
        ));
    };

    const importTransactions = async () => {
        const selected = transactions.filter(t => t.selected);
        if (selected.length === 0) {
            toast.warning('No transactions selected');
            return;
        }

        setImporting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Please sign in to import transactions');
            }

            // Batch insert all transactions at once
            // Use selected period for transactions without dates
            const defaultDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`; // Middle of month

            const transactionsToInsert = selected.map(tx => ({
                user_id: user.id,
                description: tx.description.slice(0, 100), // Limit description length
                amount: tx.amount,
                date: tx.date || defaultDate,
                category: tx.category || 'Other',
                type: tx.type
            }));

            // Insert in batches of 50 to avoid timeout
            const batchSize = 50;
            let imported = 0;

            for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
                const batch = transactionsToInsert.slice(i, i + batchSize);
                const { error } = await supabase
                    .from('transactions')
                    .insert(batch);

                if (error) {
                    console.error('Batch insert error:', error);
                    throw new Error(`Failed to import batch: ${error.message}`);
                }

                imported += batch.length;
                console.log(`Imported ${imported}/${transactionsToInsert.length} transactions`);
            }

            setStep('success');
            toast.success(`Imported ${selected.length} transactions`);

            setTimeout(() => {
                onImportComplete?.();
                handleClose();
            }, 2000);
        } catch (err: any) {
            console.error('Import error:', err);
            toast.error('Import failed', { description: err.message });
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setStep('upload');
        setFile(null);
        setTransactions([]);
        setRawText('');
        setError('');
        onClose();
    };

    const getFileIcon = (filename?: string) => {
        if (!filename) return <FileText size={24} />;
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <FileImage size={24} />;
        if (ext === 'pdf') return <FileText size={24} />;
        if (ext === 'csv') return <FileSpreadsheet size={24} />;
        return <FileText size={24} />;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-100 max-h-[85vh] flex flex-col my-auto"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden shrink-0">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Brain size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    AI Document Import
                                    <Sparkles size={18} className="text-yellow-300" />
                                </h2>
                                <p className="text-sm opacity-80 font-medium">Extract transactions from PDF, images, or CSV</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {step === 'upload' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "border-3 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                                        isDragging
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
                                    )}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.docx"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        className="hidden"
                                    />

                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    >
                                        <Upload size={32} className="text-blue-600" />
                                    </motion.div>

                                    <p className="text-lg font-bold text-slate-700 mb-2">
                                        Drop your document here
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        or click to browse • PDF, Images, CSV, Word
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-rose-50 border-2 border-rose-100 rounded-xl">
                                        <AlertTriangle size={20} className="text-rose-500" />
                                        <p className="text-sm text-rose-600 font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-4 gap-3">
                                    {['PDF', 'PNG/JPG', 'CSV', 'DOCX'].map((type) => (
                                        <div key={type} className="p-3 bg-slate-50 rounded-xl text-center border-2 border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{type}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 text-center space-y-6"
                            >
                                <div className="relative mx-auto w-24 h-24">
                                    <motion.div
                                        className="absolute inset-0 bg-blue-200 rounded-full"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className="relative w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Loader2 size={40} className="text-blue-600 animate-spin" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-slate-800">AI is analyzing your document</h3>
                                    <p className="text-sm text-slate-500 mt-1">Extracting text and detecting transactions...</p>
                                </div>

                                {file && (
                                    <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl mx-auto max-w-xs">
                                        {getFileIcon(file.name)}
                                        <span className="text-sm font-medium text-slate-600 truncate">{file.name}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'review' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Period Selector */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            📅 Statement Period
                                            {detectedPeriod && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                                    Auto-detected
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {['January', 'February', 'March', 'April', 'May', 'June',
                                                'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                                    <option key={m} value={i + 1}>{m}</option>
                                                ))}
                                        </select>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="w-28 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {[2023, 2024, 2025, 2026].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Transactions without dates will use: <strong>{selectedYear}-{String(selectedMonth).padStart(2, '0')}</strong>
                                    </p>
                                </div>

                                {transactions.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                                                    {showAllTransactions
                                                        ? `All Transactions (${displayedTransactions.filter(t => t.selected).length}/${displayedTransactions.length})`
                                                        : displayedTransactions.length > 0
                                                            ? `${monthNames[selectedMonth - 1]} ${selectedYear} (${displayedTransactions.filter(t => t.selected).length}/${displayedTransactions.length})`
                                                            : `No records for ${monthNames[selectedMonth - 1]} ${selectedYear}`
                                                    }
                                                </h3>
                                                <button
                                                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                                                    className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded-lg transition-colors",
                                                        showAllTransactions
                                                            ? "bg-blue-100 text-blue-600"
                                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    )}
                                                >
                                                    {showAllTransactions ? '📅 Filter' : '📋 Show All'}
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={deselectAll}
                                                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    onClick={selectAll}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                        </div>

                                        {displayedTransactions.length > 0 ? (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                {displayedTransactions.map((tx, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                                        onClick={() => toggleTransaction(idx)}
                                                        className={cn(
                                                            "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                            tx.selected
                                                                ? "bg-blue-50 border-blue-200"
                                                                : "bg-slate-50 border-slate-100 opacity-60"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center border-2",
                                                            tx.selected
                                                                ? "bg-blue-600 border-blue-600"
                                                                : "bg-white border-slate-300"
                                                        )}>
                                                            {tx.selected && <Check size={14} className="text-white" />}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-800 truncate">{tx.description}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs font-bold text-slate-400">{tx.category || 'Other'}</span>
                                                                {tx.date && <span className="text-xs text-slate-300">• {tx.date}</span>}
                                                            </div>
                                                        </div>

                                                        <span className={cn(
                                                            "text-lg font-black",
                                                            tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                                        )}>
                                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                                <p className="text-sm text-slate-500">
                                                    No transactions for this period
                                                </p>
                                                <button
                                                    onClick={() => setShowAllTransactions(true)}
                                                    className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                                                >
                                                    Show all {transactions.length} transactions
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <AlertTriangle size={32} className="text-amber-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">No transactions detected</h3>
                                        <p className="text-sm text-slate-500 mt-1">The AI couldn't find structured transaction data in this document.</p>
                                    </div>
                                )}

                                {rawText && (
                                    <details className="bg-slate-50 rounded-xl border-2 border-slate-100">
                                        <summary className="p-4 cursor-pointer text-sm font-bold text-slate-600 hover:text-slate-800">
                                            View Raw Extracted Text
                                        </summary>
                                        <div className="p-4 pt-0">
                                            <pre className="text-xs text-slate-500 whitespace-pre-wrap max-h-40 overflow-auto">
                                                {rawText}
                                            </pre>
                                        </div>
                                    </details>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => { setStep('upload'); setFile(null); setTransactions([]); }}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-colors"
                                    >
                                        Upload Another
                                    </button>
                                    <button
                                        onClick={importTransactions}
                                        disabled={importing || transactions.filter(t => t.selected).length === 0}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
                                            transactions.filter(t => t.selected).length > 0
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        {importing ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                Import {transactions.filter(t => t.selected).length} Transactions
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12 space-y-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle size={40} className="text-green-500" />
                                </motion.div>
                                <h3 className="text-xl font-black text-slate-800">Import Complete!</h3>
                                <p className="text-sm text-slate-500">
                                    Your transactions have been added to the ledger.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DocumentImportModal;
