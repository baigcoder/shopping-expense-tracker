// PDF Bank Statement Analyzer Component
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileUp, X, Loader2, CheckCircle, AlertCircle, Brain,
    TrendingUp, TrendingDown, PiggyBank, Sparkles, Save,
    FileText, Calendar, Building2, CreditCard, ArrowRight, ShieldCheck, Cpu
} from 'lucide-react';
import { processBankStatementPDF, PDFAnalysisResult, ExtractedTransaction } from '../services/pdfAnalyzerService';
import { formatCurrency } from '../services/currencyService';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
            toast.error('Invalid Format', {
                description: 'Please upload a PDF file for analysis.'
            });
            return;
        }

        setFileName(file.name);
        setStep('analyzing');
        setError(null);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + Math.random() * 8;
            });
        }, 300);

        try {
            const analysisResult = await processBankStatementPDF(file, user?.id);
            clearInterval(progressInterval);
            setProgress(100);

            if (analysisResult.success) {
                setResult(analysisResult);
                setStep('results');
                if (analysisResult.saved) {
                    toast.success('Auto-Synced', {
                        description: `${analysisResult.savedCount} records integrated.`
                    });
                }
            } else {
                setError(analysisResult.error || 'Failed to analyze PDF');
                setStep('upload');
                toast.error('Analysis Fault', {
                    description: analysisResult.error || 'The AI could not parse this document.'
                });
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            setError(err.message || 'Failed to process PDF');
            setStep('upload');
            toast.error('System Error', {
                description: 'Connection to AI processor interrupted.'
            });
        }
    };

    const handleSaveToAccount = async () => {
        if (!result || !user) {
            toast.error('Authentication Required');
            return;
        }
        setStep('saved');
        toast.success('Ledger Updated');
        if (onComplete) onComplete(result.transactions);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl shadow-indigo-900/30 overflow-hidden relative border-2 border-slate-50"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative p-8 pb-14 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/20 rounded-full blur-3xl" />

                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] ring-1 ring-white/30 border border-white/20 shadow-2xl">
                                <Brain className="h-7 w-7 text-indigo-100" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-black tracking-tighter font-display">Neural Scanner</h2>
                                    <Badge className="bg-white/20 text-[10px] font-black uppercase tracking-widest border-none text-white backdrop-blur-md">v2.4 AI</Badge>
                                </div>
                                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mt-1 opacity-80">Autonomous Statement Extraction</p>
                            </div>
                        </div>
                        <button
                            className="p-3 hover:bg-white/10 rounded-2xl transition-all ring-1 ring-transparent hover:ring-white/20 border border-transparent hover:border-white/10"
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-10 -mt-10 bg-white rounded-t-[3rem] relative">
                    <AnimatePresence mode="wait">
                        {/* Upload Step */}
                        {step === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-10"
                            >
                                <div
                                    className={cn(
                                        "relative h-72 rounded-[2.5rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-10 text-center group",
                                        isDragging
                                            ? "border-violet-500 bg-violet-50/50 scale-[0.98]"
                                            : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-violet-200 hover:scale-[1.01]"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                                    <div className="p-6 bg-white rounded-3xl shadow-2xl shadow-slate-200 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform text-violet-600">
                                        <FileUp size={48} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-black text-slate-800 text-2xl tracking-tight">Ingest Statement</h3>
                                        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                            Drop your bank PDF here. Our neural network will identify, categorize, and extract your financial data.
                                        </p>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                        <Badge className="bg-white/80 text-slate-400 border-none font-bold text-[9px] px-3 py-1 backdrop-blur-md">PDF ONLY</Badge>
                                        <Badge className="bg-white/80 text-slate-400 border-none font-bold text-[9px] px-3 py-1 backdrop-blur-md">OCR ENABLED</Badge>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4"
                                    >
                                        <AlertCircle className="text-rose-500 mt-1 shrink-0" size={20} />
                                        <div className="space-y-1">
                                            <p className="font-black text-rose-700 text-sm">Extraction Fault Detected</p>
                                            <p className="text-rose-600/70 text-xs font-medium">{error}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { icon: Sparkles, label: 'Neural Extraction', color: 'text-amber-500' },
                                        { icon: ShieldCheck, label: 'Secure Storage', color: 'text-emerald-500' },
                                        { icon: PiggyBank, label: 'Automated Flow', color: 'text-indigo-500' }
                                    ].map((feat, i) => (
                                        <div key={i} className="flex flex-col items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                            <feat.icon size={20} className={feat.color} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{feat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Analyzing Step */}
                        {step === 'analyzing' && (
                            <motion.div
                                key="analyzing"
                                className="flex flex-col items-center py-10 space-y-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="relative">
                                    <motion.div
                                        className="w-40 h-40 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-indigo-50/30"
                                        animate={{
                                            boxShadow: ["0 0 0 0px rgba(99, 102, 241, 0)", "0 0 0 20px rgba(99, 102, 241, 0.1)", "0 0 0 0px rgba(99, 102, 241, 0)"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <motion.div
                                            animate={{
                                                rotate: [0, 360],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="text-indigo-600"
                                        >
                                            <Cpu size={64} />
                                        </motion.div>
                                    </motion.div>
                                    <motion.div
                                        className="absolute -top-4 -right-4 p-3 bg-white rounded-2xl shadow-xl shadow-slate-200"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Sparkles className="text-amber-500" size={24} />
                                    </motion.div>
                                </div>

                                <div className="text-center space-y-3">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Processing Ledger...</h2>
                                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        <FileText size={14} />
                                        {fileName}
                                    </div>
                                </div>

                                <div className="w-full max-w-md space-y-4">
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full bg-[length:200%_100%]"
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${progress}%`,
                                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                            }}
                                            transition={{ background: { duration: 3, repeat: Infinity } }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <span>Synthesizing</span>
                                        <span className="text-indigo-600">{Math.round(progress)}% COMPLETE</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Results Step */}
                        {step === 'results' && result && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Intelligence Report</h2>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{result.statementPeriod}</p>
                                    </div>
                                    <Badge className={cn(
                                        "h-8 px-4 font-black text-[10px] uppercase tracking-widest border-none shadow-lg",
                                        result.method === 'vision' ? "bg-violet-600 text-white" : "bg-emerald-500 text-white"
                                    )}>
                                        {result.method === 'vision' ? 'Neural OCR' : 'Text Direct'}
                                    </Badge>
                                </div>

                                {/* Bank Identity */}
                                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100/50">
                                    {[
                                        { icon: Building2, label: 'Institution', value: result.bankName },
                                        { icon: CreditCard, label: 'Account', value: result.accountNumber }
                                    ].map((itm, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <itm.icon size={12} className="text-indigo-500" />
                                                {itm.label}
                                            </span>
                                            <span className="font-black text-slate-700">{itm.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-6 bg-emerald-50 border-2 border-emerald-100/50 rounded-[2rem] space-y-2">
                                        <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aggregate Inflow</span>
                                        <span className="block text-2xl font-black text-emerald-700 tracking-tighter">{formatCurrency(result.summary.totalIncome)}</span>
                                    </div>
                                    <div className="p-6 bg-rose-50 border-2 border-rose-100/50 rounded-[2rem] space-y-2">
                                        <span className="block text-[10px] font-black text-rose-600 uppercase tracking-widest">Aggregate Outflow</span>
                                        <span className="block text-2xl font-black text-rose-700 tracking-tighter">{formatCurrency(result.summary.totalExpenses)}</span>
                                    </div>
                                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] space-y-2 shadow-sm">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Items</span>
                                        <span className="block text-2xl font-black text-slate-800 tracking-tighter">{result.summary.transactionCount}</span>
                                    </div>
                                </div>

                                {/* Preview List */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={12} className="text-amber-500" />
                                        Neural Classification Preview
                                    </h4>
                                    <div className="bg-slate-50/50 rounded-[2.5rem] p-3 border-2 border-slate-50 space-y-1">
                                        {result.transactions.slice(0, 3).map((tx, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100/10 shadow-sm">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
                                                        {tx.type === 'expense' ? '💸' : '💰'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm truncate w-48">{tx.description}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{tx.date} • {tx.category}</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "font-black tracking-tighter text-lg",
                                                    tx.type === 'expense' ? "text-slate-800" : "text-emerald-600"
                                                )}>
                                                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    {result.saved ? (
                                        <div className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl">
                                            <CheckCircle size={20} className="text-emerald-400" />
                                            Operation Complete
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-16 rounded-[1.5rem] border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                                onClick={onClose}
                                            >
                                                Discard
                                            </Button>
                                            <Button
                                                className="flex-2 h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 flex-[2]"
                                                onClick={handleSaveToAccount}
                                            >
                                                <Save size={20} className="mr-3" />
                                                Commit to Account
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Saved Step */}
                        {step === 'saved' && (
                            <motion.div
                                key="saved"
                                className="text-center py-16 space-y-8"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="flex justify-center">
                                    <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-indigo-50 relative">
                                        <CheckCircle size={64} />
                                        <motion.div
                                            className="absolute -top-2 -right-2"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Sparkles className="text-amber-500" size={32} />
                                        </motion.div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">System Synchronized</h2>
                                    <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">
                                        Artificial Intelligence has successfully integrated your financial records.
                                    </p>
                                </div>
                                <Button
                                    className="h-16 px-12 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
                                    onClick={onClose}
                                >
                                    Proceed to Dashboard
                                    <ArrowRight size={18} className="ml-3" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PDFAnalyzer;
