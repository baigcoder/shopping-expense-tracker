// Export Modal Component
// Beautiful popup for exporting transactions in different formats

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, FileSpreadsheet, FileJson, FileText,
    Calendar, CheckCircle, Sparkles, Database, FileDown, ShieldCheck
} from 'lucide-react';
import { exportTransactions } from '../services/exportService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

interface ExportModalProps {
    transactions: Transaction[];
    onClose: () => void;
}

type ExportFormat = 'csv' | 'json' | 'pdf';

const EXPORT_FORMATS = [
    {
        id: 'csv' as ExportFormat,
        name: 'CSV Spreadsheet',
        icon: FileSpreadsheet,
        description: 'Universal compatibility for Excel, Sheets, and analysis tools.',
        color: '#3B82F6', // Indigo
        gradient: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'json' as ExportFormat,
        name: 'JSON Archive',
        icon: FileJson,
        description: 'Pure structured data optimized for developers and migrations.',
        color: '#8B5CF6', // Violet
        gradient: 'from-violet-500 to-purple-600'
    },
    {
        id: 'pdf' as ExportFormat,
        name: 'PDF Statement',
        icon: FileText,
        description: 'Formatted, printable report perfect for physical record keeping.',
        color: '#EC4899', // Pink/Rose
        gradient: 'from-rose-500 to-pink-600'
    },
];

const ExportModal = ({ transactions, onClose }: ExportModalProps) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [exported, setExported] = useState(false);

    const handleExport = async () => {
        if (transactions.length === 0) {
            toast.error('No transactions to export!');
            return;
        }

        setIsExporting(true);

        try {
            // Small delay for visual feedback
            await new Promise(r => setTimeout(r, 800));

            exportTransactions(transactions, {
                format: selectedFormat,
                fileName: `treasury-ledger-export-${new Date().toISOString().split('T')[0]}`,
            });

            setExported(true);
            toast.success(`Exported ${transactions.length} transactions! 📁`);

            // Auto close after success
            setTimeout(() => onClose(), 2500);
        } catch (error) {
            toast.error('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden relative border-2 border-slate-50"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-8 pb-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl ring-1 ring-white/20 border border-white/10">
                                <FileDown className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight font-display">Data Translocation</h2>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-0.5">Secure Ledger Export</p>
                            </div>
                        </div>
                        <button
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors ring-1 ring-transparent hover:ring-white/20 border border-transparent hover:border-white/10"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 -mt-6 bg-white rounded-t-[2.5rem] relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {exported ? (
                            <motion.div
                                key="success"
                                className="flex flex-col items-center justify-center py-12 text-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                    className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-50 mb-8"
                                >
                                    <CheckCircle size={48} />
                                </motion.div>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Transmission Successful!</h3>
                                <p className="text-slate-500 font-medium">Your {selectedFormat.toUpperCase()} archive has been synthesized and downloaded.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                className="space-y-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Protocol</h4>
                                        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase">
                                            {transactions.length} Records Detected
                                        </Badge>
                                    </div>

                                    <div className="grid gap-4">
                                        {EXPORT_FORMATS.map(f => {
                                            const Icon = f.icon;
                                            const isActive = selectedFormat === f.id;
                                            return (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setSelectedFormat(f.id)}
                                                    className={cn(
                                                        "group relative flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all text-left",
                                                        isActive
                                                            ? "bg-white border-slate-900 shadow-xl shadow-slate-100"
                                                            : "bg-slate-50/50 border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg hover:shadow-slate-50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-4 rounded-2xl text-white transition-transform group-hover:scale-110 shadow-lg",
                                                        `bg-gradient-to-br ${f.gradient}`
                                                    )}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <span className={cn("block font-black text-base transition-colors", isActive ? "text-slate-900" : "text-slate-500")}>
                                                            {f.name}
                                                        </span>
                                                        <span className="block text-xs text-slate-400 font-medium leading-relaxed">
                                                            {f.description}
                                                        </span>
                                                    </div>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="active-format"
                                                            className="absolute inset-y-0 right-8 flex items-center"
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                        >
                                                            <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center p-1">
                                                                <CheckCircle size={14} />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3 border-2 border-blue-50">
                                    <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">
                                        Data is encrypted and sanitized prior to transmission.
                                    </span>
                                </div>

                                <Button
                                    className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95"
                                    onClick={handleExport}
                                    disabled={isExporting}
                                >
                                    {isExporting ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="mr-3"
                                            >
                                                <Database size={20} />
                                            </motion.div>
                                            Synthesizing Data...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} className="mr-3" />
                                            Execute {selectedFormat.toUpperCase()} Export
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExportModal;
