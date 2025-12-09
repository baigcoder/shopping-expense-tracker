// CSV Import Component - Upload bank statements
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, ArrowRight, Sparkles } from 'lucide-react';
import { parseCSV, validateTransactions, getImportSummary, ParsedTransaction } from '../services/csvImportService';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { toast } from 'react-toastify';
import styles from './CSVImport.module.css';

interface CSVImportProps {
    onImport: (transactions: ParsedTransaction[]) => void;
    onClose: () => void;
}

const CSVImport = ({ onImport, onClose }: CSVImportProps) => {
    const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [errors, setErrors] = useState<{ line: number; reason: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setIsProcessing(true);
        setFileName(file.name);

        try {
            const content = await file.text();
            const parsed = parseCSV(content);
            const { valid, invalid } = validateTransactions(parsed);

            setTransactions(valid);
            setErrors(invalid);
            setStep('preview');

            if (invalid.length > 0) {
                toast.warning(`${invalid.length} rows had issues and were skipped`);
            }
        } catch (error) {
            toast.error('Failed to parse CSV file');
            console.error('CSV parse error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = () => {
        onImport(transactions);
        setStep('complete');
        toast.success(`Imported ${transactions.length} transactions! 🎉`);
    };

    const summary = transactions.length > 0 ? getImportSummary(transactions) : null;

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div className={styles.uploadStep}>
                        <h2>📄 Import Bank Statement</h2>
                        <p className={styles.subtitle}>Upload a CSV file from your bank or payment service</p>

                        <div
                            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />

                            {isProcessing ? (
                                <div className={styles.processing}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles size={40} />
                                    </motion.div>
                                    <p>Processing...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={48} className={styles.uploadIcon} />
                                    <p className={styles.dropText}>
                                        Drag & drop your CSV file here
                                    </p>
                                    <span className={styles.orText}>or</span>
                                    <button className={styles.browseBtn}>Browse Files</button>
                                </>
                            )}
                        </div>

                        <div className={styles.supportedFormats}>
                            <h4>Supported Formats:</h4>
                            <div className={styles.formatList}>
                                <span className={styles.formatBadge}>PayPal</span>
                                <span className={styles.formatBadge}>Bank CSV</span>
                                <span className={styles.formatBadge}>Excel Export</span>
                            </div>
                        </div>

                        <div className={styles.sampleSection}>
                            <p>Don't have a file? Download our sample format:</p>
                            <button className={styles.downloadSample}>
                                <Download size={16} /> Sample CSV
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Preview */}
                {step === 'preview' && summary && (
                    <div className={styles.previewStep}>
                        <h2>📊 Preview Import</h2>
                        <p className={styles.subtitle}>Review before importing</p>

                        <div className={styles.fileName}>
                            <FileText size={20} />
                            {fileName}
                        </div>

                        {/* Summary Cards */}
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryNumber}>{summary.total}</span>
                                <span className={styles.summaryLabel}>Transactions</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.income}`}>
                                <span className={styles.summaryNumber}>{formatCurrency(summary.incomeAmount)}</span>
                                <span className={styles.summaryLabel}>{summary.income} Income</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.expense}`}>
                                <span className={styles.summaryNumber}>{formatCurrency(summary.expenseAmount)}</span>
                                <span className={styles.summaryLabel}>{summary.expenses} Expenses</span>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className={styles.dateRange}>
                            <span>{summary.dateRange.start}</span>
                            <ArrowRight size={16} />
                            <span>{summary.dateRange.end}</span>
                        </div>

                        {/* Categories */}
                        <div className={styles.categoriesSection}>
                            <h4>Auto-Detected Categories</h4>
                            <div className={styles.categoryTags}>
                                {summary.categories.slice(0, 6).map(cat => (
                                    <span key={cat.name} className={styles.categoryTag}>
                                        {cat.name} ({cat.count})
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Transaction Preview */}
                        <div className={styles.transactionPreview}>
                            <h4>Preview (First 5)</h4>
                            <div className={styles.transactionList}>
                                {transactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className={styles.transactionItem}>
                                        <div className={styles.txInfo}>
                                            <span className={styles.txDesc}>{tx.description.slice(0, 40)}</span>
                                            <span className={styles.txDate}>{tx.date}</span>
                                        </div>
                                        <span className={`${styles.txAmount} ${styles[tx.type]}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div className={styles.errorsSection}>
                                <AlertCircle size={16} />
                                <span>{errors.length} rows skipped due to errors</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className={styles.previewActions}>
                            <button className={styles.backBtn} onClick={() => setStep('upload')}>
                                Back
                            </button>
                            <button className={styles.importBtn} onClick={handleConfirmImport}>
                                <Sparkles size={18} />
                                Import {summary.total} Transactions
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Complete */}
                {step === 'complete' && summary && (
                    <div className={styles.completeStep}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <CheckCircle size={80} className={styles.successIcon} />
                        </motion.div>
                        <h2>Import Complete! 🎉</h2>
                        <p>{summary.total} transactions imported successfully</p>

                        <button className={styles.doneBtn} onClick={onClose}>
                            Done
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CSVImport;
