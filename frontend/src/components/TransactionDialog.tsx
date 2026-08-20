import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X, Trash2, Save, Edit2, AlertTriangle, Calendar, DollarSign, Tag, FileText, Check, ChevronDown, Receipt, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../services/currencyService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white w-full max-w-lg border-4 border-black shadow-[10px_10px_0_#E11D48] overflow-hidden relative"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 pb-6 overflow-hidden bg-black border-b-4 border-black">
                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#E11D48] border-2 border-white">
                                {mode === 'delete' ? <Trash2 className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase font-display">
                                    {mode === 'delete' ? 'Remove Entry' : mode === 'edit' ? 'Alter Records' : 'Ledger Details'}
                                </h2>
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                    {mode === 'delete' ? 'Cautionary Action' : 'Financial Statement'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="p-2 border-2 border-white hover:bg-[#E11D48] transition-colors"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-white relative">
                    {/* Delete Confirmation */}
                    {mode === 'delete' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="bg-[#FFF7ED] border-[3px] border-black p-5 flex items-start gap-4 shadow-[4px_4px_0_#F59E0B]">
                                <div className="p-2 bg-[#F59E0B] text-black border-2 border-black">
                                    <AlertTriangle size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-black text-lg uppercase">Irreversible Action</h3>
                                    <p className="text-zinc-600 text-sm font-medium leading-relaxed">This record will be permanently purged from your financial history. It cannot be recovered.</p>
                                </div>
                            </div>

                            <div className="bg-zinc-50 border-[3px] border-black p-6 text-center space-y-2 shadow-[4px_4px_0_#09090B]">
                                <span className="text-3xl font-black text-black tracking-tighter block">
                                    {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                                </span>
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block">
                                    {formData.description}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-14"
                                    onClick={() => setMode('view')}
                                    disabled={isLoading}
                                >
                                    Abort
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 h-14"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Purging...' : 'Commit Deletion'}
                                    <Trash2 size={16} className="ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* View/Edit Mode */}
                    {mode !== 'delete' && (
                        <div className="space-y-8">
                            {/* Amount Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Financial Magnitude</h4>
                                    {mode === 'edit' && (
                                        <div className="flex border-2 border-black">
                                            <button
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.type === 'expense' ? "bg-black text-white" : "bg-white text-zinc-400 hover:text-black"
                                                )}
                                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                                            >
                                                Expense
                                            </button>
                                            <button
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all border-l-2 border-black",
                                                    formData.type === 'income' ? "bg-[#E11D48] text-white" : "bg-white text-zinc-400 hover:text-black"
                                                )}
                                                onClick={() => setFormData({ ...formData, type: 'income' })}
                                            >
                                                Income
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {mode === 'edit' ? (
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-zinc-300 group-focus-within:text-[#E11D48] transition-colors">
                                            {getCurrencySymbol()}
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-20 pl-14 pr-8 text-4xl font-black text-black tracking-tighter bg-white border-[3px] border-black focus:border-[#E11D48] focus:shadow-[4px_4px_0_#E11D48] transition-all outline-none"
                                            step="0.01"
                                        />
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "h-20 flex items-center justify-center text-4xl font-black tracking-tighter bg-zinc-50 border-[3px] border-black shadow-[4px_4px_0_#09090B]",
                                        formData.type === 'expense' ? "text-black" : "text-[#E11D48]"
                                    )}>
                                        {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid gap-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        <FileText size={12} className="text-[#E11D48]" />
                                        Nomenclature
                                    </label>
                                    {mode === 'edit' ? (
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full h-14 px-6 border-2 border-black bg-white focus:border-[#E11D48] focus:shadow-[3px_3px_0_#E11D48] transition-all font-bold text-black outline-none"
                                            placeholder="What was this for?"
                                        />
                                    ) : (
                                        <div className="h-14 flex items-center px-6 border-2 border-black bg-white text-black font-bold">
                                            {formData.description}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            <Calendar size={12} className="text-[#E11D48]" />
                                            Timestamp
                                        </label>
                                        {mode === 'edit' ? (
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full h-14 px-6 border-2 border-black bg-white focus:border-[#E11D48] focus:shadow-[3px_3px_0_#E11D48] transition-all font-bold text-black outline-none"
                                            />
                                        ) : (
                                            <div className="h-14 flex items-center px-6 border-2 border-black bg-white text-black font-bold">
                                                {format(new Date(formData.date), 'MMM dd, yyyy')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            <Tag size={12} className="text-[#E11D48]" />
                                            Classification
                                        </label>
                                        {mode === 'edit' ? (
                                            <div className="relative">
                                                <button
                                                    className="w-full h-14 px-6 border-2 border-black bg-white hover:bg-zinc-50 focus:border-[#E11D48] transition-all flex items-center justify-between outline-none group"
                                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                                >
                                                    <div className="flex items-center gap-2 font-bold text-black">
                                                        <span>{getCategoryEmoji(formData.category)}</span>
                                                        <span>{formData.category}</span>
                                                    </div>
                                                    <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showCategoryDropdown && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {showCategoryDropdown && (
                                                        <motion.div
                                                            className="absolute bottom-full mb-2 left-0 right-0 z-[110] bg-white border-[3px] border-black shadow-[6px_6px_0_#E11D48] overflow-hidden p-2"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                        >
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                                                {CATEGORIES.map(cat => (
                                                                    <button
                                                                        key={cat.name}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-3 px-4 py-3 transition-colors mb-1 last:mb-0 border-2",
                                                                            formData.category === cat.name ? "bg-black text-white border-black" : "border-transparent hover:bg-zinc-100 text-zinc-700"
                                                                        )}
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, category: cat.name });
                                                                            setShowCategoryDropdown(false);
                                                                        }}
                                                                    >
                                                                        <span className="text-xl">{cat.emoji}</span>
                                                                        <span className="font-black text-xs uppercase tracking-widest">{cat.name}</span>
                                                                        {formData.category === cat.name && <Check size={14} className="ml-auto text-[#E11D48]" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="h-14 flex items-center px-6 border-2 border-black bg-white">
                                                <Badge className="bg-black text-white border-none font-black text-[10px] uppercase tracking-tighter rounded-none">
                                                    {getCategoryEmoji(formData.category)} {formData.category}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Source Info */}
                            {transaction.source && (
                                <div className="p-4 bg-zinc-50 flex items-center gap-3 border-2 border-black shadow-[3px_3px_0_#09090B]">
                                    <div className="p-2 bg-black text-[#E11D48]">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        Origin: {transaction.source.replace('_', ' ')}
                                    </span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                {mode === 'view' ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-14 text-[#E11D48] hover:bg-[#E11D48] hover:text-white"
                                            onClick={() => setMode('delete')}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Purge
                                        </Button>
                                        <Button
                                            className="flex-1 h-14"
                                            onClick={() => setMode('edit')}
                                        >
                                            <Edit2 size={16} className="mr-2" />
                                            Update
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-14"
                                            onClick={() => setMode('view')}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 h-14"
                                            onClick={handleSave}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Saving...' : 'Commit Changes'}
                                            <Save size={16} className="ml-2" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TransactionDialog;
