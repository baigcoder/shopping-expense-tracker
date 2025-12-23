// Transaction Modal - Add Transaction using Supabase
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, DollarSign, FileText, Tag, ChevronDown, Check } from 'lucide-react';
import { useModalStore, useAuthStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { name: 'Food', emoji: '🍔' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Transport', emoji: '🚗' },
    { name: 'Entertainment', emoji: '🎮' },
    { name: 'Bills', emoji: '📱' },
    { name: 'Transfer', emoji: '💸' },
    { name: 'Salary', emoji: '💰' },
    { name: 'Health', emoji: '💊' },
    { name: 'Travel', emoji: '✈️' },
    { name: 'Other', emoji: '📦' },
];

const TransactionModal = () => {
    const { isAddTransactionOpen, closeTransactionModal } = useModalStore();
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'Other',
        type: 'expense' as 'income' | 'expense',
        date: new Date().toISOString().split('T')[0],
    });

    const resetForm = () => {
        setFormData({
            amount: '',
            description: '',
            category: 'Other',
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
        });
        setShowCategoryDropdown(false);
    };

    const handleClose = () => {
        closeTransactionModal();
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || !formData.description || !user?.id) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await supabaseTransactionService.create({
                user_id: user.id,
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category,
                type: formData.type,
                date: formData.date,
                source: 'manual',
            });

            if (result) {
                toast.success('Transaction added! 🎉');
                handleClose();
                // Dispatch event to refresh transactions
                window.dispatchEvent(new CustomEvent('new-transaction'));
            } else {
                toast.error('Failed to add transaction');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('Failed to add transaction');
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryEmoji = (category: string) => {
        const cat = CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
        return cat?.emoji || '📦';
    };

    return (
        <AnimatePresence>
            {isAddTransactionOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">Add Transaction</h2>
                            <button
                                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                onClick={handleClose}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Type Toggle */}
                            <div className="flex gap-2 p-1 bg-muted rounded-xl">
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 py-2.5 px-4 rounded-lg font-medium transition-all",
                                        formData.type === 'expense'
                                            ? "bg-card shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                >
                                    💸 Expense
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 py-2.5 px-4 rounded-lg font-medium transition-all",
                                        formData.type === 'income'
                                            ? "bg-card shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                >
                                    💰 Income
                                </button>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <DollarSign size={16} className="text-muted-foreground" />
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <FileText size={16} className="text-muted-foreground" />
                                    Description *
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What was this for?"
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2 relative">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Tag size={16} className="text-muted-foreground" />
                                    Category
                                </label>
                                <button
                                    type="button"
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground flex items-center justify-between hover:bg-muted/80 transition-colors"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <span>{getCategoryEmoji(formData.category)} {formData.category}</span>
                                    <ChevronDown size={16} className={cn("transition-transform", showCategoryDropdown && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showCategoryDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    className={cn(
                                                        "w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left",
                                                        formData.category === cat.name && "bg-primary/10 text-primary"
                                                    )}
                                                    onClick={() => {
                                                        setFormData({ ...formData, category: cat.name });
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    <span>{cat.emoji}</span>
                                                    <span className="flex-1">{cat.name}</span>
                                                    {formData.category === cat.name && <Check size={14} />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Calendar size={16} className="text-muted-foreground" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    className="flex-1 py-3 px-4 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted transition-colors"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Transaction'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TransactionModal;
