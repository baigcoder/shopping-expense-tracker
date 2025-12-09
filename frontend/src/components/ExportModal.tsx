// Export Modal Component
// Beautiful popup for exporting transactions in different formats

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, FileSpreadsheet, FileJson, FileText,
    Calendar, CheckCircle, Sparkles
} from 'lucide-react';
import { exportTransactions } from '../services/exportService';
import { toast } from 'react-toastify';
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
        description: 'Compatible with Excel, Google Sheets',
        color: '#10B981',
    },
    {
        id: 'json' as ExportFormat,
        name: 'JSON Data',
        icon: FileJson,
        description: 'Structured data for developers',
        color: '#F59E0B',
    },
    {
        id: 'pdf' as ExportFormat,
        name: 'PDF Report',
        icon: FileText,
        description: 'Printable summary report',
        color: '#EF4444',
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
            await new Promise(r => setTimeout(r, 500));

            exportTransactions(transactions, {
                format: selectedFormat,
                fileName: `expense-tracker-export-${new Date().toISOString().split('T')[0]}`,
            });

            setExported(true);
            toast.success(`Exported ${transactions.length} transactions! 📁`);

            // Auto close after success
            setTimeout(() => onClose(), 2000);
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
                className={styles.modal}
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Success State */}
                {exported ? (
                    <motion.div
                        className={styles.successState}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        >
                            <CheckCircle size={80} className={styles.successIcon} />
                        </motion.div>
                        <h2>Export Complete! 🎉</h2>
                        <p>Your {selectedFormat.toUpperCase()} file is ready</p>
                    </motion.div>
                ) : (
                    <>
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.headerIcon}>
                                <Download size={28} />
                            </div>
                            <h2>Export Transactions</h2>
                            <p>{transactions.length} transactions ready to export</p>
                        </div>

                        {/* Format Selection */}
                        <div className={styles.formats}>
                            {EXPORT_FORMATS.map(format => {
                                const Icon = format.icon;
                                return (
                                    <motion.button
                                        key={format.id}
                                        className={`${styles.formatCard} ${selectedFormat === format.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedFormat(format.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            '--format-color': format.color,
                                        } as React.CSSProperties}
                                    >
                                        <div className={styles.formatIcon} style={{ background: format.color }}>
                                            <Icon size={24} />
                                        </div>
                                        <div className={styles.formatInfo}>
                                            <span className={styles.formatName}>{format.name}</span>
                                            <span className={styles.formatDesc}>{format.description}</span>
                                        </div>
                                        {selectedFormat === format.id && (
                                            <motion.div
                                                className={styles.checkMark}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <CheckCircle size={20} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Preview Info */}
                        <div className={styles.preview}>
                            <div className={styles.previewItem}>
                                <Sparkles size={16} />
                                <span>
                                    {selectedFormat === 'csv' && 'Downloads as .csv file you can open in Excel'}
                                    {selectedFormat === 'json' && 'Downloads structured JSON with summary data'}
                                    {selectedFormat === 'pdf' && 'Opens print dialog for PDF export'}
                                </span>
                            </div>
                        </div>

                        {/* Export Button */}
                        <motion.button
                            className={styles.exportBtn}
                            onClick={handleExport}
                            disabled={isExporting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isExporting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Download size={20} />
                                    </motion.div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Export as {selectedFormat.toUpperCase()}
                                </>
                            )}
                        </motion.button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ExportModal;
