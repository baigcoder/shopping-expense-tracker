// AI Document Import Modal - Premium File Upload with OCR Processing
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, FileText, FileSpreadsheet, Image, Loader2,
    CheckCircle, AlertTriangle, Brain, Sparkles, Plus, Check, FileImage,
    ArrowUpRight, ArrowDownLeft, Calendar, FileType
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';
import { Badge } from '@/components/ui/badge';
import styles from './DocumentImportModal.module.css';

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

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

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

            if (result.detected_period) {
                setDetectedPeriod(result.detected_period);
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

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const displayedTransactions = showAllTransactions
        ? transactions
        : transactions.filter(tx => {
            if (!tx.date) return true;
            const dateStr = tx.date.toLowerCase();
            let txMonth = -1;
            let txYear = selectedYear;

            for (let i = 0; i < 12; i++) {
                if (dateStr.includes(monthNames[i].toLowerCase()) ||
                    dateStr.includes(shortMonthNames[i].toLowerCase())) {
                    txMonth = i + 1;
                    break;
                }
            }

            const ddmmMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
            if (ddmmMatch && txMonth === -1) {
                const month = parseInt(ddmmMatch[2]);
                const year = parseInt(ddmmMatch[3]);
                if (month >= 1 && month <= 12) {
                    txMonth = month;
                    txYear = year > 100 ? year : 2000 + year;
                }
            }

            if (txMonth === -1) {
                const txDate = new Date(tx.date);
                if (!isNaN(txDate.getTime())) {
                    txMonth = txDate.getMonth() + 1;
                    txYear = txDate.getFullYear();
                } else {
                    return true;
                }
            }

            const yearMatch = dateStr.match(/\b(20\d{2})\b/) || dateStr.match(/\b(\d{2})\b/);
            if (yearMatch && !ddmmMatch) {
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

            const defaultDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`;

            const transactionsToInsert = selected.map(tx => ({
                user_id: user.id,
                description: tx.description.slice(0, 100),
                amount: tx.amount,
                date: tx.date || defaultDate,
                category: tx.category || 'Other',
                type: tx.type
            }));

            const batchSize = 50;
            for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
                const batch = transactionsToInsert.slice(i, i + batchSize);
                const { error } = await supabase
                    .from('transactions')
                    .insert(batch);

                if (error) throw new Error(`Failed to import batch: ${error.message}`);
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

    const modalContent = (
        <div className={styles.overlay} onClick={handleClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={styles.modalContainer}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerGlass} />
                    <button onClick={handleClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>

                    <div className={styles.headerContent}>
                        <div className={styles.brandIcon}>
                            <Brain size={32} className="text-white" />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2>
                                AI Document Import
                                <Sparkles size={20} className="inline-block ml-2 text-yellow-300 animate-pulse" />
                            </h2>
                            <p>Extract transactions from PDF, images, or CSV</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className={styles.content}>
                    {step === 'upload' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-input')?.click()}
                                className={cn(styles.dropzone, isDragging && styles.dropzoneActive)}
                            >
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.docx"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className={styles.uploadIcon}>
                                    <Upload size={40} />
                                </div>
                                <h3>Drop your document here</h3>
                                <p>or click to browse • PDF, Images, CSV, Word</p>
                            </div>

                            {error && (
                                <div className="mt-4 flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                    <AlertTriangle size={20} className="text-rose-500" />
                                    <p className="text-sm text-rose-600 font-bold">{error}</p>
                                </div>
                            )}

                            <div className={styles.fileTypesGrid}>
                                {['PDF', 'PNG/JPG', 'CSV', 'DOCX'].map((type) => (
                                    <div key={type} className={styles.fileTypeBadge}>
                                        <span>{type}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'processing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <motion.div
                                    className="absolute inset-0 bg-blue-100 rounded-full"
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Loader2 size={40} className="text-white animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">AI is analyzing your document</h3>
                            <p className="text-slate-500 font-bold mt-2 truncate max-w-xs mx-auto">
                                {file?.name || 'Processing...'}
                            </p>
                        </motion.div>
                    )}

                    {step === 'review' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.reviewSection}
                        >
                            <div className={styles.periodSelector}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} /> Statement Period
                                    </label>
                                    {detectedPeriod && (
                                        <Badge className="bg-rose-100 text-rose-700 border-none font-bold">Auto-detected</Badge>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="flex-1 px-4 py-2 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-300 transition-all"
                                    >
                                        {monthNames.map((m, i) => (
                                            <option key={m} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-28 px-4 py-2 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-300 transition-all"
                                    >
                                        {[2023, 2024, 2025, 2026].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                    {showAllTransactions ? 'All Records' : `${monthNames[selectedMonth - 1]} ${selectedYear}`}
                                </h3>
                                <div className="flex gap-4">
                                    <button onClick={deselectAll} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase transition-colors">Clear</button>
                                    <button onClick={selectAll} className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase transition-colors">Select All</button>
                                </div>
                            </div>

                            <div className={styles.transactionList}>
                                {displayedTransactions.map((tx, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => toggleTransaction(idx)}
                                        className={cn(styles.transactionCard, tx.selected && styles.transactionCardSelected)}
                                    >
                                        <div className={styles.checkbox}>
                                            {tx.selected && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                            tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{tx.category || 'Other'}</span>
                                                {tx.date && <span className="text-[10px] font-bold text-slate-200 px-1 inline-block">•</span>}
                                                {tx.date && <span className="text-[10px] font-bold text-slate-400">{tx.date}</span>}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-lg font-black",
                                            tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
                            >
                                <CheckCircle size={40} className="text-emerald-600" />
                            </motion.div>
                            <h3 className="text-2xl font-black text-slate-800">Import Complete!</h3>
                            <p className="text-slate-500 font-bold mt-2">Transactions are safely added to your ledger.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    {step === 'review' && (
                        <>
                            <button
                                onClick={() => { setStep('upload'); setFile(null); }}
                                className={styles.btnSecondary}
                                disabled={importing}
                            >
                                Re-upload
                            </button>
                            <button
                                onClick={importTransactions}
                                className={styles.btnPrimary}
                                disabled={importing || transactions.filter(t => t.selected).length === 0}
                            >
                                {importing ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                Import {transactions.filter(t => t.selected).length} Items
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );

    return createPortal(
        <AnimatePresence>
            {isOpen && modalContent}
        </AnimatePresence>,
        document.body
    );
};

export default DocumentImportModal;
