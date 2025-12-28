// Export Modal Component - Premium Light Mode Redesign
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, FileSpreadsheet, FileJson, FileText,
    CheckCircle, Database, FileDown, ShieldCheck
} from 'lucide-react';
import { exportTransactions } from '../services/exportService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import styles from './ExportModal.module.css';

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
        gradient: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'json' as ExportFormat,
        name: 'JSON Archive',
        icon: FileJson,
        description: 'Pure structured data optimized for developers and migrations.',
        gradient: 'from-violet-500 to-purple-600'
    },
    {
        id: 'pdf' as ExportFormat,
        name: 'PDF Statement',
        icon: FileText,
        description: 'Formatted, printable report perfect for physical record keeping.',
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
            await new Promise(r => setTimeout(r, 1200)); // Deliberate delay for premium feel

            exportTransactions(transactions, {
                format: selectedFormat,
                fileName: `treasury-ledger-export-${new Date().toISOString().split('T')[0]}`,
            });

            setExported(true);
            toast.success(`Exported ${transactions.length} transactions!`);

            setTimeout(() => onClose(), 2500);
        } catch (error) {
            toast.error('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
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
                className={styles.modalContainer}
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={cn(styles.header, styles.exportHeader)}>
                    <div className={styles.headerGlass} />
                    <div className={styles.headerContent}>
                        <div className={styles.brandIcon}>
                            <FileDown size={30} strokeWidth={2.5} />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2>Data Translocation</h2>
                            <p>SECURE LEDGER EXPORT</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {exported ? (
                            <motion.div
                                key="success"
                                className={styles.successState}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className={styles.successIcon}
                                >
                                    <CheckCircle size={48} />
                                </motion.div>
                                <h3 className={styles.successTitle}>Transmission Successful!</h3>
                                <p className={styles.successDesc}>
                                    Your {selectedFormat.toUpperCase()} archive has been synthesized and downloaded.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className={styles.sectionHeader}>
                                    <h4 className={styles.sectionTitle}>Select Protocol</h4>
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px]">
                                        {transactions.length} RECORDS DETECTED
                                    </Badge>
                                </div>

                                <div className={styles.protocolGrid}>
                                    {EXPORT_FORMATS.map(f => {
                                        const Icon = f.icon;
                                        const isActive = selectedFormat === f.id;
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => setSelectedFormat(f.id)}
                                                className={cn(
                                                    styles.protocolCard,
                                                    isActive && styles.protocolCardActive
                                                )}
                                            >
                                                <div className={cn(
                                                    styles.iconWrapper,
                                                    `bg-gradient-to-br ${f.gradient}`
                                                )}>
                                                    <Icon size={24} />
                                                </div>
                                                <div className={styles.cardInfo}>
                                                    <span className={styles.cardName}>{f.name}</span>
                                                    <span className={styles.cardDescription}>{f.description}</span>
                                                </div>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-check"
                                                        className={styles.checkmark}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                    >
                                                        <CheckCircle size={14} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={styles.statusBar}>
                                    <div className={styles.statusIcon}>
                                        <ShieldCheck size={16} />
                                    </div>
                                    <span className={styles.statusText}>
                                        Data is encrypted and sanitized prior to transmission.
                                    </span>
                                </div>

                                <div className={styles.footer}>
                                    <button
                                        className={styles.exportBtn}
                                        onClick={handleExport}
                                        disabled={isExporting}
                                    >
                                        {isExporting ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Database size={20} />
                                                </motion.div>
                                                Synthesizing Data...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={20} />
                                                Execute {selectedFormat.toUpperCase()} Export
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExportModal;
