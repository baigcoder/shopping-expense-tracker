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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden relative border-2 border-slate-50"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-8 pb-12 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />

                    <div className="relative flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 border border-white/20">
                                {mode === 'delete' ? <Trash2 className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight font-display">
                                    {mode === 'delete' ? 'Remove Entry' : mode === 'edit' ? 'Alter Records' : 'Ledger Details'}
                                </h2>
                                <p className="text-blue-100 text-xs font-black uppercase tracking-widest mt-0.5">
                                    {mode === 'delete' ? 'Cautionary Action' : 'Financial Statement'}
                                </p>
                            </div>
                        </div>
                        <button
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors ring-1 ring-transparent hover:ring-white/30 border border-transparent hover:border-white/20"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 -mt-6 bg-white rounded-t-[2.5rem] relative">
                    {/* Delete Confirmation */}
                    {mode === 'delete' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="bg-amber-50 border-2 border-amber-100/50 rounded-[2rem] p-6 flex items-start gap-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">Irreversible Action</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">This record will be permanently purged from your financial history. It cannot be recovered.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border-2 border-slate-100/50 rounded-[2rem] p-8 text-center space-y-2">
                                <span className="text-3xl font-black text-slate-800 tracking-tighter block">
                                    {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                                </span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                                    {formData.description}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                    onClick={() => setMode('view')}
                                    disabled={isLoading}
                                >
                                    Abort
                                </Button>
                                <Button
                                    className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
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
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Magnitude</h4>
                                    {mode === 'edit' && (
                                        <div className="flex p-1 bg-slate-100 rounded-xl">
                                            <button
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.type === 'expense' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                                            >
                                                Expense
                                            </button>
                                            <button
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    formData.type === 'income' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
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
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                            {getCurrencySymbol()}
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full h-24 pl-14 pr-8 text-5xl font-black text-slate-800 tracking-tighter bg-slate-50/50 border-4 border-slate-50 rounded-[2rem] focus:bg-white focus:border-blue-100 focus:ring-8 focus:ring-blue-50 transition-all outline-none"
                                            step="0.01"
                                        />
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "h-24 flex items-center justify-center text-5xl font-black tracking-tighter rounded-[2rem] bg-slate-50/50 border-2 border-slate-50",
                                        formData.type === 'expense' ? "text-slate-800" : "text-blue-600"
                                    )}>
                                        {formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid gap-6">
                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <FileText size={12} className="text-blue-500" />
                                        Nomenclature
                                    </label>
                                    {mode === 'edit' ? (
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-100 transition-all font-bold text-slate-700 outline-none"
                                            placeholder="What was this for?"
                                        />
                                    ) : (
                                        <div className="h-14 flex items-center px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 text-slate-700 font-bold">
                                            {formData.description}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} className="text-indigo-500" />
                                            Timestamp
                                        </label>
                                        {mode === 'edit' ? (
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-100 transition-all font-bold text-slate-700 outline-none"
                                            />
                                        ) : (
                                            <div className="h-14 flex items-center px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 text-slate-700 font-bold">
                                                {format(new Date(formData.date), 'MMM dd, yyyy')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Tag size={12} className="text-emerald-500" />
                                            Classification
                                        </label>
                                        {mode === 'edit' ? (
                                            <div className="relative">
                                                <button
                                                    className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50 hover:bg-slate-100 focus:bg-white focus:border-blue-100 transition-all flex items-center justify-between outline-none group"
                                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                                >
                                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                                        <span>{getCategoryEmoji(formData.category)}</span>
                                                        <span>{formData.category}</span>
                                                    </div>
                                                    <ChevronDown size={16} className={cn("text-slate-400 transition-transform", showCategoryDropdown && "rotate-180")} />
                                                </button>

                                                <AnimatePresence>
                                                    {showCategoryDropdown && (
                                                        <motion.div
                                                            className="absolute bottom-full mb-2 left-0 right-0 z-[110] bg-white border-2 border-slate-50 rounded-[2rem] shadow-2xl overflow-hidden p-2"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                        >
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                                                {CATEGORIES.map(cat => (
                                                                    <button
                                                                        key={cat.name}
                                                                        className={cn(
                                                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 last:mb-0",
                                                                            formData.category === cat.name ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                                                                        )}
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, category: cat.name });
                                                                            setShowCategoryDropdown(false);
                                                                        }}
                                                                    >
                                                                        <span className="text-xl">{cat.emoji}</span>
                                                                        <span className="font-black text-xs uppercase tracking-widest">{cat.name}</span>
                                                                        {formData.category === cat.name && <Check size={14} className="ml-auto" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="h-14 flex items-center px-6 rounded-2xl border-2 border-slate-50 bg-slate-50/50">
                                                <Badge className="bg-white text-slate-600 border-none font-black text-[10px] uppercase tracking-tighter">
                                                    {getCategoryEmoji(formData.category)} {formData.category}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Source Info */}
                            {transaction.source && (
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border-2 border-slate-100/50">
                                    <div className="p-2 bg-white rounded-xl text-slate-400">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                                            className="flex-1 h-14 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-black text-xs uppercase tracking-widest"
                                            onClick={() => setMode('delete')}
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Purge
                                        </Button>
                                        <Button
                                            className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100"
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
                                            className="flex-1 h-14 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                            onClick={() => setMode('view')}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100"
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
