// PDF Bank Statement Analyzer Component
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileUp, X, Loader2, CheckCircle, AlertCircle, Brain,
    TrendingUp, TrendingDown, PiggyBank, Sparkles, Save,
    FileText, Calendar, Building2, CreditCard, ArrowRight
} from 'lucide-react';
import { processBankStatementPDF, PDFAnalysisResult, ExtractedTransaction } from '../services/pdfAnalyzerService';
import { formatCurrency } from '../services/currencyService';
import { useAuthStore } from '../store/useStore';
import { toast } from 'react-toastify';
import styles from './PDFAnalyzer.module.css';

interface PDFAnalyzerProps {
    onComplete?: (transactions: ExtractedTransaction[]) => void;
    onClose: () => void;
}

type AnalysisStep = 'upload' | 'analyzing' | 'results' | 'saved';

const PDFAnalyzer = ({ onComplete, onClose }: PDFAnalyzerProps) => {
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<PDFAnalysisResult & { saved?: boolean; savedCount?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuthStore();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Please upload a PDF file');
            return;
        }

        setFileName(file.name);
        setStep('analyzing');
        setError(null);
        setProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + Math.random() * 15;
            });
        }, 500);

        try {
            const analysisResult = await processBankStatementPDF(
                file,
                user?.id
            );

            clearInterval(progressInterval);
            setProgress(100);

            if (analysisResult.success) {
                setResult(analysisResult);
                setStep('results');

                if (analysisResult.saved) {
                    toast.success(`${analysisResult.savedCount} transactions saved to your account! 🎉`);
                }
            } else {
                setError(analysisResult.error || 'Failed to analyze PDF');
                setStep('upload');
                toast.error(analysisResult.error || 'Analysis failed');
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message || 'Failed to process PDF');
            setStep('upload');
            toast.error('Failed to process PDF');
        }
    };

    const handleSaveToAccount = async () => {
        if (!result || !user) {
            toast.error('Please log in to save transactions');
            return;
        }

        // Transactions are already saved during processing if user was logged in
        setStep('saved');
        toast.success('Transactions saved to your account! 🎉');

        if (onComplete) {
            onComplete(result.transactions);
        }
    };

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

                {/* Upload Step */}
                {step === 'upload' && (
                    <div className={styles.uploadStep}>
                        <div className={styles.headerIcon}>
                            <Brain size={40} />
                        </div>
                        <h2>🧠 AI Statement Analyzer</h2>
                        <p className={styles.subtitle}>Upload your bank statement PDF and let AI extract all transactions</p>

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
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />

                            <FileUp size={48} className={styles.uploadIcon} />
                            <p className={styles.dropText}>
                                Drag & drop your bank statement PDF
                            </p>
                            <span className={styles.orText}>or</span>
                            <button className={styles.browseBtn}>Browse Files</button>
                        </div>

                        {error && (
                            <div className={styles.errorMessage}>
                                <AlertCircle size={16} />
                                <div>
                                    <strong>Error:</strong> {error}
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                        💡 Tip: Make sure your PDF has selectable text. Scanned/image PDFs won't work.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <Sparkles size={16} />
                                <span>AI-powered extraction</span>
                            </div>
                            <div className={styles.feature}>
                                <Save size={16} />
                                <span>Auto-save to account</span>
                            </div>
                            <div className={styles.feature}>
                                <PiggyBank size={16} />
                                <span>Smart categorization</span>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
                            ✅ Works best with: Digital bank statements, e-statements, exported PDFs
                            <br />
                            ❌ May not work with: Scanned documents, image-based PDFs
                        </p>
                    </div>
                )}

                {/* Analyzing Step */}
                {step === 'analyzing' && (
                    <div className={styles.analyzingStep}>
                        <motion.div
                            className={styles.brainAnimation}
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Brain size={60} />
                        </motion.div>

                        <h2>🔍 Analyzing Statement...</h2>
                        <p className={styles.fileName}>
                            <FileText size={16} />
                            {fileName}
                        </p>

                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <motion.div
                                    className={styles.progressFill}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className={styles.progressText}>{Math.round(progress)}%</span>
                        </div>

                        <div className={styles.steps}>
                            <div className={`${styles.stepItem} ${progress > 10 ? styles.done : ''}`}>
                                <CheckCircle size={16} />
                                Extracting text from PDF
                            </div>
                            <div className={`${styles.stepItem} ${progress > 40 ? styles.done : ''}`}>
                                <CheckCircle size={16} />
                                AI analyzing transactions
                            </div>
                            <div className={`${styles.stepItem} ${progress > 70 ? styles.done : ''}`}>
                                <CheckCircle size={16} />
                                Categorizing expenses
                            </div>
                            <div className={`${styles.stepItem} ${progress >= 100 ? styles.done : ''}`}>
                                <CheckCircle size={16} />
                                Generating insights
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Step */}
                {step === 'results' && result && (
                    <div className={styles.resultsStep}>
                        <div className={styles.successHeader}>
                            <CheckCircle size={40} className={styles.successIcon} />
                            <h2>Analysis Complete! 🎉</h2>
                            {result.method && (
                                <span style={{
                                    background: result.method === 'vision' ? '#8B5CF6' : '#10B981',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontWeight: 700,
                                    marginTop: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    {result.method === 'vision' ? '🔍 Vision AI OCR' : '📄 Text Extraction'}
                                </span>
                            )}
                        </div>

                        {/* Bank Info */}
                        <div className={styles.bankInfo}>
                            <div className={styles.bankItem}>
                                <Building2 size={16} />
                                <span>{result.bankName}</span>
                            </div>
                            <div className={styles.bankItem}>
                                <CreditCard size={16} />
                                <span>{result.accountNumber}</span>
                            </div>
                            <div className={styles.bankItem}>
                                <Calendar size={16} />
                                <span>{result.statementPeriod}</span>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className={styles.summaryGrid}>
                            <div className={`${styles.summaryCard} ${styles.income}`}>
                                <TrendingUp size={20} />
                                <span className={styles.summaryAmount}>{formatCurrency(result.summary.totalIncome)}</span>
                                <span className={styles.summaryLabel}>Total Income</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.expense}`}>
                                <TrendingDown size={20} />
                                <span className={styles.summaryAmount}>{formatCurrency(result.summary.totalExpenses)}</span>
                                <span className={styles.summaryLabel}>Total Expenses</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <FileText size={20} />
                                <span className={styles.summaryAmount}>{result.summary.transactionCount}</span>
                                <span className={styles.summaryLabel}>Transactions</span>
                            </div>
                        </div>

                        {/* Top Categories */}
                        {result.summary.topCategories.length > 0 && (
                            <div className={styles.categoriesSection}>
                                <h4>Top Spending Categories</h4>
                                <div className={styles.categoryList}>
                                    {result.summary.topCategories.slice(0, 4).map((cat, i) => (
                                        <div key={cat.name} className={styles.categoryItem}>
                                            <span className={styles.categoryRank}>#{i + 1}</span>
                                            <span className={styles.categoryName}>{cat.name}</span>
                                            <span className={styles.categoryAmount}>{formatCurrency(cat.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Insights */}
                        {result.aiInsights.length > 0 && (
                            <div className={styles.insightsSection}>
                                <h4><Brain size={16} /> AI Insights</h4>
                                <ul className={styles.insightsList}>
                                    {result.aiInsights.slice(0, 3).map((insight, i) => (
                                        <li key={i}>{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Transaction Preview */}
                        <div className={styles.previewSection}>
                            <h4>Transactions Preview ({result.transactions.length})</h4>
                            <div className={styles.transactionsList}>
                                {result.transactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className={styles.transactionRow}>
                                        <div className={styles.txInfo}>
                                            <span className={styles.txDesc}>{tx.description.slice(0, 35)}</span>
                                            <span className={styles.txMeta}>{tx.date} • {tx.category}</span>
                                        </div>
                                        <span className={`${styles.txAmount} ${styles[tx.type]}`}>
                                            {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                                {result.transactions.length > 5 && (
                                    <div className={styles.moreTransactions}>
                                        +{result.transactions.length - 5} more transactions
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {result.saved ? (
                                <motion.div
                                    className={styles.savedNotice}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <CheckCircle size={20} />
                                    <div style={{ textAlign: 'left' }}>
                                        <strong style={{ fontSize: '1rem', display: 'block' }}>
                                            ✅ {result.savedCount} transactions saved!
                                        </strong>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                            Synced to your account successfully
                                        </span>
                                    </div>
                                </motion.div>
                            ) : user ? (
                                <button className={styles.saveBtn} onClick={handleSaveToAccount}>
                                    <Save size={18} />
                                    Save to My Account
                                </button>
                            ) : (
                                <p className={styles.loginPrompt}>
                                    Log in to save transactions to your account
                                </p>
                            )}
                            <button className={styles.doneBtn} onClick={onClose}>
                                Done <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Saved Step */}
                {step === 'saved' && (
                    <div className={styles.savedStep}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <CheckCircle size={80} className={styles.bigSuccess} />
                        </motion.div>
                        <h2>All Done! 🎉</h2>
                        <p>Your transactions have been saved and are now visible in your account.</p>
                        <button className={styles.doneBtn} onClick={onClose}>
                            View Transactions <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default PDFAnalyzer;
