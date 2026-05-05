// Transaction Modal - Stark Gen Z Brutalist Data Input
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, DollarSign, FileText, Tag, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { useModalStore, useAuthStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { name: 'Food', emoji: '??' },
    { name: 'Shopping', emoji: '???' },
    { name: 'Transport', emoji: '??' },
    { name: 'Entertainment', emoji: '??' },
    { name: 'Bills', emoji: '??' },
    { name: 'Transfer', emoji: '??' },
    { name: 'Salary', emoji: '??' },
    { name: 'Health', emoji: '??' },
    { name: 'Travel', emoji: '??' },
    { name: 'Other', emoji: '??' },
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
            toast.error('INPUT_REQUIRED: FIELDS_EMPTY');
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
                toast.success('TRANSACTION_COMMITTED');
                handleClose();
            } else {
                toast.error('COMMIT_FAILED');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('NETWORK_ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryEmoji = (category: string) => {
        const cat = CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase());
        return cat?.emoji || '??';
    };

    return (
        <AnimatePresence>
            {isAddTransactionOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white border-8 border-black shadow-[16px_16px_0px_#000000] w-full max-w-md overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b-8 border-black bg-black text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white text-black border-4 border-white flex items-center justify-center font-black italic">TX</div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">COMMIT_INTEL</h2>
                            </div>
                            <button
                                className="p-2 bg-[#E11D48] border-4 border-white hover:bg-white hover:text-black transition-colors"
                                onClick={handleClose}
                            >
                                <X size={20} strokeWidth={4} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Type Toggle */}
                            <div className="flex border-4 border-black">
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 py-4 font-black uppercase transition-all flex items-center justify-center gap-2",
                                        formData.type === 'expense'
                                            ? "bg-[#E11D48] text-white"
                                            : "bg-white text-black hover:bg-slate-100"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                >
                                    ?? BURN
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex-1 py-4 font-black uppercase transition-all flex items-center justify-center gap-2 border-l-4 border-black",
                                        formData.type === 'income'
                                            ? "bg-emerald-500 text-white"
                                            : "bg-white text-black hover:bg-slate-100"
                                    )}
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                >
                                    ?? INFLOW
                                </button>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <DollarSign size={14} strokeWidth={3} /> RESOURCE_MAGNITUDE *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-6 py-4 bg-white border-4 border-black text-2xl font-black placeholder:text-slate-300 focus:outline-none focus:bg-slate-50 transition-all"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText size={14} strokeWidth={3} /> SECTOR_DESCRIPTION *
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="IDENTIFY TRANSACTION SOURCE"
                                    className="w-full px-6 py-4 bg-white border-4 border-black font-black uppercase placeholder:text-slate-300 focus:outline-none focus:bg-slate-50 transition-all"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2 relative">
                                <label className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Tag size={14} strokeWidth={3} /> CATEGORY_CLUSTER
                                </label>
                                <button
                                    type="button"
                                    className="w-full px-6 py-4 bg-white border-4 border-black flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <span className="font-black uppercase">{getCategoryEmoji(formData.category)} {formData.category}</span>
                                    <ChevronDown size={20} strokeWidth={3} className={cn("transition-transform", showCategoryDropdown && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showCategoryDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-black shadow-[8px_8px_0px_#000000] z-50 max-h-60 overflow-y-auto"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    className={cn(
                                                        "w-full px-6 py-3 flex items-center gap-4 hover:bg-black hover:text-white transition-colors text-left font-black uppercase text-sm border-b-2 border-black last:border-0",
                                                        formData.category === cat.name && "bg-slate-100"
                                                    )}
                                                    onClick={() => {
                                                        setFormData({ ...formData, category: cat.name });
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    <span className="text-lg">{cat.emoji}</span>
                                                    <span className="flex-1">{cat.name}</span>
                                                    {formData.category === cat.name && <Check size={16} strokeWidth={4} />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={14} strokeWidth={3} /> TEMPORAL_STAMP
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-6 py-4 bg-white border-4 border-black font-black focus:outline-none focus:bg-slate-50 transition-all"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    className="flex-1 py-4 bg-white text-black border-4 border-black font-black uppercase hover:bg-slate-100 transition-colors"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    ABORT
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-black text-white border-4 border-black font-black uppercase hover:bg-[#E11D48] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" strokeWidth={3} />
                                    ) : (
                                        <>COMMIT <ArrowRight size={20} strokeWidth={4} /></>
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
