// CSV Import Component - Upload bank statements
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, ArrowRight, Sparkles, FileUp, Database, Calendar, Tag } from 'lucide-react';
import { parseCSV, validateTransactions, getImportSummary, ParsedTransaction } from '../services/csvImportService';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
                toast.warning(`${invalid.length} rows had issues and were skipped`, {
                    description: "Check the CSV format carefully"
                });
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden relative border-2 border-slate-50"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative p-8 pb-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 border border-white/20">
                                <FileUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight font-display">
                                    {step === 'upload' ? 'Import Records' : step === 'preview' ? 'Verify Data' : 'Import Complete'}
                                </h2>
                                <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mt-0.5">
                                    {step === 'upload' ? 'Select CSV Source' : step === 'preview' ? 'Final Inspection' : 'Synchronization Result'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors ring-1 ring-transparent hover:ring-white/30 border border-transparent hover:border-white/20"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 -mt-6 bg-white rounded-t-[2.5rem] relative">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-8">
                            <div
                                className={cn(
                                    "relative h-64 rounded-[2rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center group",
                                    isDragging
                                        ? "border-indigo-500 bg-indigo-50/50 scale-[0.98]"
                                        : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:scale-[1.01]"
                                )}
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
                                    className="hidden"
                                />

                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-200"
                                        >
                                            <Sparkles size={40} className="text-indigo-600" />
                                        </motion.div>
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-800 text-lg">Parsing Ledger...</p>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Wait a moment</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-5 bg-white rounded-2xl shadow-xl shadow-slate-100 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                                            <Upload size={40} className="text-indigo-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-black text-slate-800 text-xl tracking-tight">Drop your statement here</p>
                                            <p className="text-slate-500 font-medium max-w-xs mx-auto">
                                                Drag & drop your bank CSV file or
                                                <span className="text-indigo-600 font-black px-1 group-hover:underline">browse files</span>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validated Sources</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['PayPal', 'Standard Bank', 'Excel', 'Stripe'].map(f => (
                                            <Badge key={f} className="bg-slate-100 text-slate-500 border-none font-black text-[10px] px-3 py-1">
                                                {f}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4 text-right">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Protocol</h4>
                                    <Button variant="link" className="h-auto p-0 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-700">
                                        <Download size={14} className="mr-2" />
                                        Sample CSV
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && summary && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-xl">
                                        <FileText size={20} className="text-indigo-600" />
                                    </div>
                                    <span className="font-black text-slate-700">{fileName}</span>
                                </div>
                                {errors.length > 0 && (
                                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black text-[10px] uppercase">
                                        <AlertCircle size={12} className="mr-1" />
                                        {errors.length} Skipped
                                    </Badge>
                                )}
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center space-y-1">
                                    <span className="block text-2xl font-black text-slate-800 tracking-tighter">{summary.total}</span>
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                                </div>
                                <div className="p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] text-center space-y-1">
                                    <span className="block text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(summary.incomeAmount)}</span>
                                    <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Inflow</span>
                                </div>
                                <div className="p-6 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-center space-y-1">
                                    <span className="block text-2xl font-black text-white tracking-tighter">{formatCurrency(summary.expenseAmount)}</span>
                                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Outflow</span>
                                </div>
                            </div>

                            {/* Data Breakdown */}
                            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100/50">
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Calendar size={12} className="text-indigo-500" />
                                        Temporal Scope
                                    </h4>
                                    <div className="flex items-center gap-2 font-black text-xs text-slate-700">
                                        <span>{summary.dateRange.start}</span>
                                        <ArrowRight size={14} className="text-slate-300" />
                                        <span>{summary.dateRange.end}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Tag size={12} className="text-violet-500" />
                                        Categorical Density
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {summary.categories.slice(0, 3).map(cat => (
                                            <Badge key={cat.name} className="bg-white text-slate-600 border-none font-black text-[9px] px-2 py-0.5 shadow-sm capitalize">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                    onClick={() => setStep('upload')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
                                    onClick={handleConfirmImport}
                                >
                                    <Database size={16} className="mr-2" />
                                    Commit {summary.total} Entries
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step: Complete */}
                    {step === 'complete' && summary && (
                        <div className="text-center py-12 space-y-8">
                            <div className="flex justify-center">
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-100"
                                >
                                    <CheckCircle size={48} />
                                </motion.div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ledger Synchronized!</h2>
                                <p className="text-slate-500 font-medium text-lg">
                                    Successfully processed and integrated {summary.total} records into your portal.
                                </p>
                            </div>

                            <button
                                className="h-16 px-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                                onClick={onClose}
                            >
                                Finalize Operation
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CSVImport;
