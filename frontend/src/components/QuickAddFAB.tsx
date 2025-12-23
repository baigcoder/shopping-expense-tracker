// Quick Add FAB - Floating Action Button for quick transaction entry
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, ShoppingBag, Coffee, Car, Film, Utensils, Loader2 } from 'lucide-react';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { formatCurrency } from '../services/currencyService';
import { useAuthStore, useModalStore } from '../store/useStore';
import genZToast from '../services/genZToast';
import styles from './QuickAddFAB.module.css';

interface QuickCategory {
    name: string;
    icon: React.ReactNode;
    emoji: string;
}

const QUICK_CATEGORIES: QuickCategory[] = [
    { name: 'Food', icon: <Utensils size={20} />, emoji: '🍔' },
    { name: 'Coffee', icon: <Coffee size={20} />, emoji: '☕' },
    { name: 'Shopping', icon: <ShoppingBag size={20} />, emoji: '🛍️' },
    { name: 'Transport', icon: <Car size={20} />, emoji: '🚗' },
    { name: 'Entertainment', icon: <Film size={20} />, emoji: '🎬' },
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

const QuickAddFAB = () => {
    const { user } = useAuthStore();
    const { isQuickAddOpen, openQuickAdd, closeQuickAdd } = useModalStore();
    // const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'category' | 'amount' | 'confirm'>('category');
    const [selectedCategory, setSelectedCategory] = useState<QuickCategory | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOpen = () => {
        openQuickAdd();
        setStep('category');
        setSelectedCategory(null);
        setAmount('');
        setCustomAmount('');
    };

    const handleClose = () => {
        closeQuickAdd();
    };

    const handleCategorySelect = (category: QuickCategory) => {
        setSelectedCategory(category);
        setStep('amount');
    };

    const handleAmountSelect = (amt: number) => {
        setAmount(amt.toString());
        setStep('confirm');
    };

    const handleCustomAmountSubmit = () => {
        if (customAmount && parseFloat(customAmount) > 0) {
            setAmount(customAmount);
            setStep('confirm');
        }
    };

    const handleSubmit = async () => {
        if (!user?.id || !selectedCategory || !amount) return;

        setIsSubmitting(true);
        try {
            const transaction = await supabaseTransactionService.create({
                user_id: user.id,
                description: `Quick ${selectedCategory.name}`,
                amount: parseFloat(amount),
                category: selectedCategory.name,
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                source: 'quick-add'
            });

            if (transaction) {
                genZToast.cash(`${selectedCategory.emoji} Added ${formatCurrency(parseFloat(amount))} for ${selectedCategory.name}!`);

                // Dispatch event for real-time updates
                window.dispatchEvent(new CustomEvent('new-transaction', { detail: transaction }));

                handleClose();
            }
        } catch (error) {
            console.error('Error adding quick transaction:', error);
            genZToast.error('Failed to add transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                className={styles.fab}
                onClick={handleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Plus size={28} />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isQuickAddOpen && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={styles.modalHeader}>
                                <h3>
                                    {step === 'category' && 'What did you spend on?'}
                                    {step === 'amount' && `${selectedCategory?.emoji} How much?`}
                                    {step === 'confirm' && 'Confirm'}
                                </h3>
                                <button className={styles.closeBtn} onClick={handleClose}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Step: Category */}
                            {step === 'category' && (
                                <div className={styles.categoryGrid}>
                                    {QUICK_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.name}
                                            className={styles.categoryBtn}
                                            onClick={() => handleCategorySelect(cat)}
                                        >
                                            <span className={styles.categoryEmoji}>{cat.emoji}</span>
                                            <span className={styles.categoryName}>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step: Amount */}
                            {step === 'amount' && (
                                <div className={styles.amountSection}>
                                    <div className={styles.quickAmounts}>
                                        {QUICK_AMOUNTS.map((amt) => (
                                            <button
                                                key={amt}
                                                className={styles.amountBtn}
                                                onClick={() => handleAmountSelect(amt)}
                                            >
                                                {formatCurrency(amt)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.customAmount}>
                                        <span className={styles.currencySymbol}>$</span>
                                        <input
                                            ref={inputRef}
                                            type="number"
                                            placeholder="Custom amount"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCustomAmountSubmit()}
                                        />
                                        <button
                                            className={styles.goBtn}
                                            onClick={handleCustomAmountSubmit}
                                            disabled={!customAmount}
                                        >
                                            →
                                        </button>
                                    </div>
                                    <button
                                        className={styles.backBtn}
                                        onClick={() => setStep('category')}
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}

                            {/* Step: Confirm */}
                            {step === 'confirm' && (
                                <div className={styles.confirmSection}>
                                    <div className={styles.confirmPreview}>
                                        <span className={styles.confirmEmoji}>{selectedCategory?.emoji}</span>
                                        <div className={styles.confirmDetails}>
                                            <span className={styles.confirmCategory}>{selectedCategory?.name}</span>
                                            <span className={styles.confirmAmount}>{formatCurrency(parseFloat(amount))}</span>
                                        </div>
                                    </div>
                                    <div className={styles.confirmActions}>
                                        <button
                                            className={styles.cancelBtn}
                                            onClick={() => setStep('amount')}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className={styles.submitBtn}
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <Loader2 size={20} className={styles.spin} /> : 'Add Expense'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default QuickAddFAB;
