// Transaction Modal - Stark Gen Z Brutalist Data Input
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, DollarSign, FileText, Tag, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { useModalStore, useAuthStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { name: 'Food', emoji: '🍔' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Transport', emoji: '🚗' },
    { name: 'Entertainment', emoji: '🎬' },
    { name: 'Bills', emoji: '📄' },
    { name: 'Transfer', emoji: '↔️' },
    { name: 'Salary', emoji: '💼' },
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
            toast.error('Please fill in the required fields');
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
                toast.success('Transaction added');
                handleClose();
            } else {
                toast.error('Couldn’t save');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('Network error');
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
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 12 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                            <div>
                                <h2 className="font-display text-lg font-semibold">Add a transaction</h2>
                                <p className="text-xs text-[var(--text-muted)]">Saved to your ledger</p>
                            </div>
                            <button
                                className="rounded-[var(--r-md)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                                onClick={handleClose}
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            <div className="flex rounded-[var(--r-md)] border border-[var(--border)] bg-[#FAF8F5] p-1">
                                <button
                                    type="button"
                                    className={cn(
                                        "flex flex-1 items-center justify-center gap-2 rounded-[8px] py-2.5 text-sm font-semibold transition-colors",
                                        formData.type === 'expense'
                                            ? "bg-[var(--brand)] text-white"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex flex-1 items-center justify-center gap-2 rounded-[8px] py-2.5 text-sm font-semibold transition-colors",
                                        formData.type === 'income'
                                            ? "bg-[var(--success)] text-white"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                >
                                    Income
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                                    <DollarSign size={14} strokeWidth={2} /> Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full rounded-[var(--r-md)] border border-[var(--border)] px-4 py-3 text-2xl font-semibold outline-none placeholder:text-[#D6D3D1] focus:border-[var(--brand)]"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                                    <FileText size={14} strokeWidth={2} /> Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What was this for?"
                                    className="w-full rounded-[var(--r-md)] border border-[var(--border)] px-4 py-3 text-sm outline-none placeholder:text-[#A8A29E] focus:border-[var(--brand)]"
                                    required
                                />
                            </div>

                            <div className="relative space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                                    <Tag size={14} strokeWidth={2} /> Category
                                </label>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-[var(--r-md)] border border-[var(--border)] bg-white px-4 py-3 text-sm hover:bg-[#FAF8F5]"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <span className="font-medium">{getCategoryEmoji(formData.category)} {formData.category}</span>
                                    <ChevronDown size={18} strokeWidth={2} className={cn("transition-transform", showCategoryDropdown && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showCategoryDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-[var(--r-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    className={cn(
                                                        "flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 text-left text-sm last:border-0 hover:bg-[#FAF8F5]",
                                                        formData.category === cat.name && "bg-[#F4F0EB]"
                                                    )}
                                                    onClick={() => {
                                                        setFormData({ ...formData, category: cat.name });
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    <span>{cat.emoji}</span>
                                                    <span className="flex-1">{cat.name}</span>
                                                    {formData.category === cat.name && <Check size={16} strokeWidth={2} />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                                    <Calendar size={14} strokeWidth={2} /> Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full rounded-[var(--r-md)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded-[var(--r-md)] border border-[var(--border)] py-3 text-sm font-semibold hover:bg-[#FAF8F5]"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-[var(--r-md)] bg-[var(--brand)] py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                                    ) : (
                                        <>Save <ArrowRight size={16} strokeWidth={2} /></>
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
