import { useState, useEffect } from 'react';
import {
    Receipt,
    Calendar,
    Tag,
    FileText,
    CreditCard,
    Trash2,
    Check,
    X,
    ExternalLink,
    Store,
    Clock,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../services/currencyService';
import { SupabaseTransaction } from '../services/supabaseTransactionService';
import { soundManager } from '@/lib/sounds';

interface TransactionSideSheetProps {
    transaction: SupabaseTransaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: (updatedTx: SupabaseTransaction) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

const CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Subscriptions',
    'Transport',
    'Bills & Utilities',
    'Health',
    'Entertainment',
    'Travel',
    'Income',
    'Other',
];

export function TransactionSideSheet({
    transaction,
    open,
    onOpenChange,
    onUpdate,
    onDelete,
}: TransactionSideSheetProps) {
    const [category, setCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (transaction) {
            setCategory(transaction.category || 'Other');
            setNotes(transaction.description || '');
        }
    }, [transaction]);

    if (!transaction) return null;

    const isExpense = transaction.type === 'expense';

    const handleSave = async () => {
        if (!onUpdate) return;
        setSaving(true);
        try {
            await onUpdate({
                ...transaction,
                category,
                description: notes,
            });
            soundManager.play('success');
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (confirm('Are you sure you want to delete this transaction from your ledger?')) {
            setDeleting(true);
            try {
                await onDelete(transaction.id);
                soundManager.play('success');
                onOpenChange(false);
            } finally {
                setDeleting(false);
            }
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
                <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <Badge variant={isExpense ? 'destructive' : 'success'}>
                            {isExpense ? 'Expense' : 'Income'}
                        </Badge>
                        <span className="text-xs text-[var(--cashly-text-muted)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    <div className="mt-3">
                        <h2 className="text-3xl font-display font-bold tabular-nums text-[var(--cashly-text-primary)]">
                            {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                        </h2>
                        <SheetTitle className="text-base font-semibold text-[var(--cashly-text-primary)] mt-1 truncate">
                            {transaction.description || 'Transaction Details'}
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-5 divide-y divide-[var(--cashly-border)]/60">
                    {/* Merchant & Store */}
                    <div className="space-y-2 pt-2 first:pt-0">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--cashly-text-muted)] flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5" /> Description / Merchant
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--cashly-border)] bg-[var(--cashly-bg-subtle)] focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[var(--cashly-brand)] text-[var(--cashly-text-primary)]"
                        />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-2 pt-4">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--cashly-text-muted)] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Category
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                                        category === cat
                                            ? 'bg-[var(--cashly-brand)] text-white shadow-sm'
                                            : 'bg-[var(--cashly-bg-subtle)] text-[var(--cashly-text-secondary)] hover:bg-[var(--cashly-border)]'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction Metadata */}
                    <div className="pt-4 space-y-3 text-xs">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--cashly-text-muted)]">
                            Ledger Information
                        </label>
                        <div className="p-3 rounded-xl bg-[var(--cashly-bg-subtle)] space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[var(--cashly-text-muted)]">Transaction ID</span>
                                <span className="font-mono text-[11px] truncate max-w-[180px]">
                                    {transaction.id}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--cashly-text-muted)]">Post Status</span>
                                <span className="text-emerald-700 font-medium">Reconciled in Ledger</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-[var(--cashly-border)] flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--cashly-text-secondary)] hover:bg-[var(--cashly-bg-subtle)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cashly-brand)] text-white hover:bg-[var(--cashly-brand-hover)] shadow-sm disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default TransactionSideSheet;
