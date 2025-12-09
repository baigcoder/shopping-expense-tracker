// Transaction Edit/Delete Dialog Component
// Beautiful Neo-Brutalist popup for editing and deleting transactions

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Trash2, Save, Edit2, AlertTriangle, Calendar,
    DollarSign, Tag, FileText, Check, ChevronDown
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { toast } from 'react-toastify';
import styles from './TransactionDialog.module.css';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    merchant?: string;
    source?: string;
}

interface TransactionDialogProps {
    transaction: Transaction;
    onSave: (updated: Transaction) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
}

const CATEGORIES = [
    { name: 'Food', emoji: '🍔' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Transport', emoji: '🚗' },
    { name: 'Entertainment', emoji: '🎮' },
    { name: 'Bills', emoji: '📱' },
    { name: 'Transfer', emoji: '💸' },
    { name: 'Salary', emoji: '💰' },
    { name: 'Tax', emoji: '📋' },
    { name: 'Health', emoji: '💊' },
    { name: 'Other', emoji: '📦' },
];

const TransactionDialog = ({ transaction, onSave, onDelete, onClose }: TransactionDialogProps) => {
    const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave({
                ...transaction,
                ...formData,
            });
            toast.success('Transaction updated! 🎉');
            onClose();
        } catch (error) {
            toast.error('Failed to update transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await onDelete(transaction.id);
            toast.success('Transaction deleted! 🗑️');
            onClose();
        } catch (error) {
            toast.error('Failed to delete transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryEmoji = (category: string) => {
        const cat = CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
        return cat?.emoji || '📦';
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
                className={styles.dialog}
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.emoji}>{getCategoryEmoji(formData.category)}</span>
                        <span>{mode === 'delete' ? 'Delete Transaction?' : mode === 'edit' ? 'Edit Transaction' : 'Transaction Details'}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Delete Confirmation */}
                {mode === 'delete' && (
                    <motion.div
                        className={styles.deleteConfirm}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className={styles.deleteIcon}>
                            <AlertTriangle size={48} />
                        </div>
                        <h3>Are you sure?</h3>
                        <p>This will permanently delete this transaction. This action cannot be undone.</p>

                        <div className={styles.deletePreview}>
                            <span className={styles.deleteAmount}>
                                {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                            </span>
                            <span className={styles.deleteDesc}>{formData.description}</span>
                        </div>

                        <div className={styles.deleteActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setMode('view')}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={handleDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deleting...' : 'Yes, Delete'}
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* View/Edit Mode */}
                {mode !== 'delete' && (
                    <>
                        <div className={styles.content}>
                            {/* Amount Display/Edit */}
                            <div className={styles.amountSection}>
                                {mode === 'edit' ? (
                                    <div className={styles.amountEdit}>
                                        <span className={styles.currencySymbol}>{getCurrencySymbol()}</span>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className={styles.amountInput}
                                            step="0.01"
                                        />
                                    </div>
                                ) : (
                                    <div className={`${styles.amountDisplay} ${styles[formData.type]}`}>
                                        {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                                    </div>
                                )}

                                {/* Type Toggle */}
                                {mode === 'edit' && (
                                    <div className={styles.typeToggle}>
                                        <button
                                            className={`${styles.typeBtn} ${formData.type === 'expense' ? styles.active : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                                        >
                                            Expense
                                        </button>
                                        <button
                                            className={`${styles.typeBtn} ${formData.type === 'income' ? styles.active : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'income' })}
                                        >
                                            Income
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className={styles.fields}>
                                {/* Description */}
                                <div className={styles.field}>
                                    <label>
                                        <FileText size={16} />
                                        Description
                                    </label>
                                    {mode === 'edit' ? (
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className={styles.input}
                                            placeholder="What was this for?"
                                        />
                                    ) : (
                                        <span className={styles.fieldValue}>{formData.description}</span>
                                    )}
                                </div>

                                {/* Date */}
                                <div className={styles.field}>
                                    <label>
                                        <Calendar size={16} />
                                        Date
                                    </label>
                                    {mode === 'edit' ? (
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className={styles.input}
                                        />
                                    ) : (
                                        <span className={styles.fieldValue}>
                                            {new Date(formData.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    )}
                                </div>

                                {/* Category */}
                                <div className={styles.field}>
                                    <label>
                                        <Tag size={16} />
                                        Category
                                    </label>
                                    {mode === 'edit' ? (
                                        <div className={styles.categorySelect}>
                                            <button
                                                className={styles.categoryBtn}
                                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                            >
                                                <span>{getCategoryEmoji(formData.category)} {formData.category}</span>
                                                <ChevronDown size={16} />
                                            </button>

                                            <AnimatePresence>
                                                {showCategoryDropdown && (
                                                    <motion.div
                                                        className={styles.categoryDropdown}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                    >
                                                        {CATEGORIES.map(cat => (
                                                            <button
                                                                key={cat.name}
                                                                className={`${styles.categoryOption} ${formData.category === cat.name ? styles.selected : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, category: cat.name });
                                                                    setShowCategoryDropdown(false);
                                                                }}
                                                            >
                                                                <span>{cat.emoji}</span>
                                                                <span>{cat.name}</span>
                                                                {formData.category === cat.name && <Check size={14} />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <span className={styles.fieldValue}>
                                            {getCategoryEmoji(formData.category)} {formData.category}
                                        </span>
                                    )}
                                </div>

                                {/* Source Badge */}
                                {transaction.source && (
                                    <div className={styles.sourceBadge}>
                                        {transaction.source === 'pdf_import' ? '📄 Imported from PDF' :
                                            transaction.source === 'csv_import' ? '📊 Imported from CSV' :
                                                '✏️ Manual Entry'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {mode === 'view' ? (
                                <>
                                    <button className={styles.deleteBtn} onClick={() => setMode('delete')}>
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                    <button className={styles.editBtn} onClick={() => setMode('edit')}>
                                        <Edit2 size={18} />
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className={styles.cancelBtn} onClick={() => setMode('view')}>
                                        Cancel
                                    </button>
                                    <button
                                        className={styles.saveBtn}
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                        <Save size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default TransactionDialog;
