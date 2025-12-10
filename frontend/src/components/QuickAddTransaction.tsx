// Quick Add Transaction Modal - Gen Z Style with Category Selector 🎯
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Loader2 } from 'lucide-react';
import { useModalStore, useAuthStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { toast } from 'react-toastify';
import styles from './QuickAddTransaction.module.css';

// Category definitions with emojis
const CATEGORIES = [
    { id: 'food', name: 'FOOD', emoji: '🍔', color: '#000' },
    { id: 'coffee', name: 'COFFEE', emoji: '☕', color: '#8B5CF6' },
    { id: 'shopping', name: 'SHOPPING', emoji: '🛍️', color: '#EC4899' },
    { id: 'transport', name: 'TRANSPORT', emoji: '🚗', color: '#3B82F6' },
    { id: 'entertainment', name: 'ENTERTAINMENT', emoji: '🎬', color: '#10B981' },
    { id: 'groceries', name: 'GROCERIES', emoji: '🛒', color: '#F59E0B' },
    { id: 'utilities', name: 'UTILITIES', emoji: '💡', color: '#6366F1' },
    { id: 'health', name: 'HEALTH', emoji: '🏥', color: '#EF4444' },
];

interface QuickAddTransactionProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickAddTransaction = ({ isOpen, onClose }: QuickAddTransactionProps) => {
    const { user } = useAuthStore();
    const [step, setStep] = useState<'category' | 'amount'>('category');
    const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [type, setType] = useState<'expense' | 'income'>('expense');

    const handleCategorySelect = (category: typeof CATEGORIES[0]) => {
        setSelectedCategory(category);
        setStep('amount');
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !amount || !user?.id) return;

        setIsSubmitting(true);
        try {
            await supabaseTransactionService.create({
                user_id: user.id,
                amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount)),
                description: description || `${selectedCategory.name} purchase`,
                category: selectedCategory.name,
                type: type,
                date: new Date().toISOString().split('T')[0]
            });

            toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added! 💰`);
            window.dispatchEvent(new CustomEvent('new-transaction'));
            resetAndClose();
        } catch (error) {
            toast.error('Failed to add transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setStep('category');
        setSelectedCategory(null);
        setAmount('');
        setDescription('');
        setType('expense');
        onClose();
    };

    const goBack = () => {
        if (step === 'amount') {
            setStep('category');
            setSelectedCategory(null);
        } else {
            resetAndClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={resetAndClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.9, opacity: 0, rotate: -3 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.9, opacity: 0, rotate: 3 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Corner Fold Effect */}
                    <div className={styles.cornerFold}></div>

                    {/* Close Button */}
                    <button className={styles.closeBtn} onClick={resetAndClose}>
                        <X size={20} strokeWidth={3} />
                    </button>

                    {/* Step: Category Selection */}
                    {step === 'category' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.stepContent}
                        >
                            <h2 className={styles.title}>WHAT DID YOU SPEND ON?</h2>

                            {/* Featured Category (First/Selected) */}
                            <motion.button
                                className={styles.featuredCategory}
                                onClick={() => handleCategorySelect(CATEGORIES[0])}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className={styles.featuredEmoji}>{CATEGORIES[0].emoji}</span>
                                <span className={styles.featuredName}>{CATEGORIES[0].name}</span>
                            </motion.button>

                            {/* Category Grid */}
                            <div className={styles.categoryGrid}>
                                {CATEGORIES.slice(1, 5).map((cat) => (
                                    <motion.button
                                        key={cat.id}
                                        className={styles.categoryCard}
                                        onClick={() => handleCategorySelect(cat)}
                                        whileHover={{ y: -4, boxShadow: '6px 6px 0 #000' }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className={styles.categoryEmoji}>{cat.emoji}</span>
                                        <span className={styles.categoryName}>{cat.name}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* More Categories Toggle */}
                            <div className={styles.moreCategories}>
                                {CATEGORIES.slice(5).map((cat) => (
                                    <motion.button
                                        key={cat.id}
                                        className={styles.miniCategory}
                                        onClick={() => handleCategorySelect(cat)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        {cat.emoji}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step: Amount Entry */}
                    {step === 'amount' && selectedCategory && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.stepContent}
                        >
                            <button className={styles.backBtn} onClick={goBack}>
                                ← Back
                            </button>

                            <div className={styles.selectedBadge} style={{ background: selectedCategory.color }}>
                                <span>{selectedCategory.emoji}</span>
                                <span>{selectedCategory.name}</span>
                            </div>

                            {/* Type Toggle */}
                            <div className={styles.typeToggle}>
                                <button
                                    className={`${styles.typeBtn} ${type === 'expense' ? styles.typeActive : ''}`}
                                    onClick={() => setType('expense')}
                                >
                                    <Minus size={16} /> Expense
                                </button>
                                <button
                                    className={`${styles.typeBtn} ${type === 'income' ? styles.typeActive : ''}`}
                                    onClick={() => setType('income')}
                                >
                                    <Plus size={16} /> Income
                                </button>
                            </div>

                            {/* Amount Input */}
                            <div className={styles.amountWrapper}>
                                <span className={styles.currency}>Rs</span>
                                <input
                                    type="number"
                                    className={styles.amountInput}
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <input
                                type="text"
                                className={styles.descInput}
                                placeholder="What was it? (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            {/* Submit Button */}
                            <motion.button
                                className={styles.submitBtn}
                                onClick={handleSubmit}
                                disabled={!amount || isSubmitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className={styles.spinner} />
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Add {type === 'expense' ? 'Expense' : 'Income'}
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuickAddTransaction;
