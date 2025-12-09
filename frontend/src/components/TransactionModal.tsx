// Transaction Modal - Add/Edit Transaction
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, DollarSign, Store, Package, Tag, FileText } from 'lucide-react';
import { useModalStore } from '../store/useStore';
import { useCategories } from '../hooks/useCategories';
import { useTransaction, useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { TransactionFormData } from '../types';
import styles from './TransactionModal.module.css';

const TransactionModal = () => {
    const { isAddTransactionOpen, editingTransaction, closeTransactionModal } = useModalStore();
    const { data: categoriesData } = useCategories();
    const { data: transactionData, isLoading: loadingTransaction } = useTransaction(editingTransaction || '');
    const createMutation = useCreateTransaction();
    const updateMutation = useUpdateTransaction();

    const [formData, setFormData] = useState<TransactionFormData>({
        amount: '',
        storeName: '',
        storeUrl: '',
        productName: '',
        categoryId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const isEditing = !!editingTransaction;
    const isLoading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (isEditing && transactionData?.data) {
            const tx = transactionData.data;
            setFormData({
                amount: String(tx.amount),
                storeName: tx.storeName,
                storeUrl: tx.storeUrl || '',
                productName: tx.productName || '',
                categoryId: tx.categoryId || '',
                purchaseDate: new Date(tx.purchaseDate).toISOString().split('T')[0],
                notes: tx.notes || ''
            });
        }
    }, [isEditing, transactionData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || !formData.storeName) {
            return;
        }

        try {
            if (isEditing && editingTransaction) {
                await updateMutation.mutateAsync({ id: editingTransaction, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
            closeTransactionModal();
            resetForm();
        } catch {
            // Error handled by mutation
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            storeName: '',
            storeUrl: '',
            productName: '',
            categoryId: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            notes: ''
        });
    };

    const handleClose = () => {
        closeTransactionModal();
        resetForm();
    };

    return (
        <AnimatePresence>
            {isAddTransactionOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={styles.overlay}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <h2>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
                            <button className={styles.closeButton} onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        {loadingTransaction && isEditing ? (
                            <div className={styles.loading}>
                                <Loader2 size={32} className={styles.spinner} />
                                <p>Loading transaction...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                {/* Amount */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <DollarSign size={16} />
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                {/* Store Name */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <Store size={16} />
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.storeName}
                                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                        placeholder="e.g., Amazon, eBay"
                                        className={styles.input}
                                        required
                                    />
                                </div>

                                {/* Product Name */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <Package size={16} />
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.productName}
                                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                        placeholder="What did you buy?"
                                        className={styles.input}
                                    />
                                </div>

                                {/* Category */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <Tag size={16} />
                                        Category
                                    </label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="">Select category</option>
                                        {categoriesData?.data.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Purchase Date */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <Calendar size={16} />
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>

                                {/* Notes */}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>
                                        <FileText size={16} />
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        className={styles.textarea}
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={handleClose}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={18} className={styles.spinner} />
                                                {isEditing ? 'Updating...' : 'Adding...'}
                                            </>
                                        ) : (
                                            isEditing ? 'Update Transaction' : 'Add Transaction'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TransactionModal;
