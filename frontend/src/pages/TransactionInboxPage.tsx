import { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Link2, Pencil, RefreshCw, Settings2, Trash2, Wand2, X, Zap, Keyboard, ArrowDown, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { merchantRulesApi, MerchantRule, transactionInboxApi, TransactionCandidate, invalidateInboxCache } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import { emitFinancialDataEvent } from '../services/financialDataEvents';
import { invalidateTransactionCache } from '../services/supabaseTransactionService';
import { soundManager } from '@/lib/sounds';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categories = ['Food & Dining', 'Shopping', 'Subscriptions', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Other'];

const TransactionInboxPage = () => {
    const [items, setItems] = useState<TransactionCandidate[]>([]);
    const [rules, setRules] = useState<MerchantRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('pending');
    const [selected, setSelected] = useState<string[]>([]);
    const [ruleForm, setRuleForm] = useState({ merchantPattern: '', category: 'Shopping', matchType: 'contains' });
    const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'amount'>('date');
    const [editDrafts, setEditDrafts] = useState<Record<string, { description: string; amount: string; category: string }>>({});

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            invalidateInboxCache();
            const [inboxResult, ruleResult] = await Promise.all([
                transactionInboxApi.list({ status, limit: 100 }),
                merchantRulesApi.list(),
            ]);
            let data = inboxResult.data || [];
            
            // Apply sorting
            data = data.sort((a, b) => {
                if (sortBy === 'confidence') return (a.confidence || 0) - (b.confidence || 0);
                if (sortBy === 'amount') return Math.abs(Number(b.amount)) - Math.abs(Number(a.amount));
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setItems(data);
            setRules(ruleResult);
        } catch {
            toast.error('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    }, [status, sortBy]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const onInboxUpdate = (event: Event) => {
            const detail = (event as CustomEvent).detail || {};
            if (event.type === 'cashly-data-updated') {
                const type = String(detail.type || detail.area || '');
                if (!type.includes('inbox') && type !== 'TRANSACTION_CANDIDATE_ADDED' && type !== 'TRANSACTION_CANDIDATE_UPDATED' && !detail.pendingReview) {
                    return;
                }
            }
            void load(true);
        };
        window.addEventListener('transaction-candidate-added', onInboxUpdate);
        window.addEventListener('cashly-data-updated', onInboxUpdate);
        return () => {
            window.removeEventListener('transaction-candidate-added', onInboxUpdate);
            window.removeEventListener('cashly-data-updated', onInboxUpdate);
        };
    }, [load]);

    const startEdit = (item: TransactionCandidate) => {
        setEditDrafts((prev) => ({
            ...prev,
            [item.id]: {
                description: item.description,
                amount: String(item.amount ?? 0),
                category: item.category || 'Shopping',
            },
        }));
    };

    const cancelEdit = (id: string) => {
        setEditDrafts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const updateDraft = (id: string, field: 'description' | 'amount' | 'category', value: string) => {
        setEditDrafts((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || { description: '', amount: '0', category: 'Shopping' }),
                [field]: value,
            },
        }));
    };

    const [focusedIndex, setFocusedIndex] = useState(0);

    const approve = useCallback(async (item: TransactionCandidate) => {
        const draft = editDrafts[item.id];
        const updates: Partial<TransactionCandidate> = {};
        if (draft) {
            const amount = Number(draft.amount);
            if (draft.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) {
                toast.error('Enter a valid amount before approving');
                return;
            }
            updates.description = draft.description.trim() || item.description;
            updates.amount = amount;
            updates.category = draft.category || item.category;
        }
        try {
            const result = await transactionInboxApi.approve(item.id, updates);
            invalidateTransactionCache();
            emitFinancialDataEvent('transaction-added', result?.transaction || result?.data);
            emitFinancialDataEvent('cashly-data-updated', { area: 'transactions', source: 'inbox-approve' });
            cancelEdit(item.id);
            soundManager.play('success');
            toast.success('Transaction approved');
            load(true);
        } catch {
            soundManager.play('error');
            toast.error('Approve failed');
        }
    }, [editDrafts, load]);

    const merge = useCallback(async (item: TransactionCandidate) => {
        if (!item.duplicate_transaction_id) return;
        try {
            await transactionInboxApi.merge(item.id, item.duplicate_transaction_id);
            emitFinancialDataEvent('cashly-data-updated', { area: 'inbox', source: 'inbox-merge' });
            soundManager.play('click');
            toast.success('Merged into existing ledger item');
            load(true);
        } catch {
            soundManager.play('error');
            toast.error('Merge failed');
        }
    }, [load]);

    const reject = useCallback(async (id: string) => {
        try {
            await transactionInboxApi.reject(id);
            cancelEdit(id);
            soundManager.play('whoosh');
            toast.success('Candidate rejected');
            load();
        } catch {
            soundManager.play('error');
            toast.error('Reject failed');
        }
    }, [load]);

    const bulk = useCallback(async (action: 'approve' | 'reject') => {
        if (!selected.length) return;
        try {
            await transactionInboxApi.bulk(selected, action);
            if (action === 'approve') {
                invalidateTransactionCache();
                emitFinancialDataEvent('transaction-added', { count: selected.length });
                emitFinancialDataEvent('cashly-data-updated', { area: 'transactions', source: 'inbox-bulk-approve' });
                soundManager.play('success');
            } else {
                soundManager.play('whoosh');
            }
            toast.success(action === 'approve' ? 'Bulk complete — duplicates were merged' : 'Bulk reject complete');
            setSelected([]);
            load();
        } catch {
            soundManager.play('error');
            toast.error(`Bulk ${action} failed`);
        }
    }, [selected, load]);

    const batchApproveVerifiedClean = useCallback(async () => {
        const cleanItems = items.filter(i => (i.confidence || 0) >= 0.85);
        if (cleanItems.length === 0) {
            toast.info('No pending candidates with ≥85% confidence to batch-approve');
            return;
        }
        soundManager.play('click');
        try {
            await transactionInboxApi.bulk(cleanItems.map(i => i.id), 'approve');
            invalidateTransactionCache();
            emitFinancialDataEvent('transaction-added', { count: cleanItems.length });
            emitFinancialDataEvent('cashly-data-updated', { area: 'transactions', source: 'inbox-bulk-clean' });
            soundManager.play('success');
            toast.success(`Batch approved ${cleanItems.length} verified candidates (≥85% confidence)!`);
            load(true);
        } catch {
            soundManager.play('error');
            toast.error('Failed to batch approve clean candidates');
        }
    }, [items, load]);

    // Global keyboard hotkeys: [A] Approve, [R] Reject, [M] Merge, [Shift+A] Batch Clean, [J/K] Navigate
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
                return;
            }

            if (status !== 'pending' || items.length === 0) return;

            const safeIndex = Math.min(Math.max(0, focusedIndex), items.length - 1);
            const currentItem = items[safeIndex];

            if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                batchApproveVerifiedClean();
                return;
            }

            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                if (currentItem) {
                    approve(currentItem);
                }
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                if (currentItem) {
                    reject(currentItem.id);
                }
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                if (currentItem && currentItem.duplicate_transaction_id) {
                    merge(currentItem);
                }
            } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
                soundManager.play('click');
            } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                soundManager.play('click');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, items, focusedIndex, approve, reject, merge, batchApproveVerifiedClean]);

    const addRule = async () => {
        if (!ruleForm.merchantPattern.trim()) return;
        await merchantRulesApi.create({
            merchantPattern: ruleForm.merchantPattern,
            category: ruleForm.category,
            match_type: ruleForm.matchType as any,
            transaction_type: 'expense',
            priority: 50,
            enabled: true,
        });
        setRuleForm({ merchantPattern: '', category: 'Shopping', matchType: 'contains' });
        toast.success('Rule saved');
        load();
    };

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] p-1 text-[var(--color-ink)] sm:p-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-orange)] text-white font-mono">
                            Sovereign Review Terminal
                        </span>
                        <span className="text-xs text-[var(--color-muted)] font-mono">
                            Explicit consent before ledger mutation
                        </span>
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl text-[var(--color-ink)] mt-2">
                        REVIEW INBOX.
                    </h1>
                    <p className="text-xs text-[var(--color-muted)] font-mono mt-1">
                        Approve, edit, merge, or reject captures before they affect your cash runway.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => void load()} className="rounded-full">
                        <RefreshCw size={14} className="mr-1.5" /> Refresh Terminal
                    </Button>
                </div>
            </div>

            {/* Power-User Hotkey Guide Strip */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-surface-2)]/80 border border-[var(--color-border)] text-xs font-mono text-[var(--color-muted)] overflow-x-auto shadow-xs">
                <div className="flex items-center gap-1.5 text-[var(--color-ink)] font-bold shrink-0">
                    <Keyboard size={14} className="text-[var(--color-brand)]" />
                    <span>Terminal Shortcuts:</span>
                </div>
                <span className="shrink-0"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">A</kbd> Approve</span>
                <span className="shrink-0 opacity-40">·</span>
                <span className="shrink-0"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">R</kbd> Reject</span>
                <span className="shrink-0 opacity-40">·</span>
                <span className="shrink-0"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">M</kbd> Merge</span>
                <span className="shrink-0 opacity-40">·</span>
                <span className="shrink-0"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">Shift+A</kbd> Batch Clean (≥85%)</span>
                <span className="shrink-0 opacity-40">·</span>
                <span className="shrink-0"><kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">J</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] font-bold text-[10px]">K</kbd> Navigate Focus</span>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
                <Surface padded={false} className="overflow-hidden border-[var(--color-border)] shadow-xs rounded-2xl">
                    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 sm:w-auto">
                                {['pending', 'approved', 'rejected', 'merged'].map(value => (
                                    <button
                                        key={value}
                                        onClick={() => setStatus(value)}
                                        className={cn(
                                            'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-colors',
                                            status === value
                                                ? 'bg-[var(--color-ink)] text-white shadow-xs'
                                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
                                        )}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>

                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                            >
                                <option value="date">Sort: Date</option>
                                <option value="confidence">Sort: Review needed</option>
                                <option value="amount">Sort: Amount</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {status === 'pending' && (
                                <Button
                                    onClick={batchApproveVerifiedClean}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs flex items-center gap-1.5"
                                >
                                    <Zap size={13} />
                                    <span>Batch Clean</span>
                                    <kbd className="px-1 py-0.5 rounded text-[9px] bg-emerald-800/80 text-emerald-100 font-mono font-bold">Shift+A</kbd>
                                </Button>
                            )}
                            <Button
                                onClick={() => bulk('approve')}
                                disabled={!selected.length}
                                className="bg-[var(--color-success)] text-white hover:opacity-90 shadow-xs text-xs"
                            >
                                Approve ({selected.length})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => bulk('reject')}
                                disabled={!selected.length}
                                className="text-xs"
                            >
                                Reject ({selected.length})
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-sm text-[var(--color-muted)]">
                            <RefreshCw size={22} className="animate-spin" />
                            Loading inbox…
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState
                            icon={<Inbox size={22} />}
                            title="Nothing waiting"
                            description="No candidates in this queue."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-[var(--color-surface-2)] text-[var(--color-muted)]">
                                    <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wider font-semibold">
                                        <th className="w-16 p-4 text-left">
                                            <div className="relative h-4 w-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                                                <input 
                                                    type="checkbox" 
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                    onChange={(e) => setSelected(e.target.checked ? items.map(i => i.id) : [])}
                                                    checked={selected.length === items.length && items.length > 0}
                                                />
                                                {selected.length === items.length && items.length > 0 && <Check size={12} className="absolute inset-0 m-auto text-[var(--color-brand)]" />}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left">Transaction</th>
                                        <th className="p-4 text-left">Source</th>
                                        <th className="p-4 text-left">Confidence</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => {
                                        const isFocused = index === focusedIndex && status === 'pending';
                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => setFocusedIndex(index)}
                                                className={cn(
                                                    'border-b border-[var(--color-border)] transition-all cursor-pointer',
                                                    isFocused
                                                        ? 'bg-[var(--color-brand)]/8 ring-1 ring-inset ring-[var(--color-brand)]/35'
                                                        : 'hover:bg-[var(--color-surface-2)]/60'
                                                )}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {isFocused && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-pulse shrink-0" />
                                                        )}
                                                        <div className="relative h-4 w-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                                                            <input
                                                                type="checkbox"
                                                                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                                checked={selected.includes(item.id)}
                                                                onChange={(e) => setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))}
                                                            />
                                                            {selected.includes(item.id) && <Check size={12} className="absolute inset-0 m-auto text-[var(--color-brand)]" />}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {editDrafts[item.id] ? (
                                                        <div className="min-w-[220px] space-y-2">
                                                            <input
                                                                value={editDrafts[item.id].description}
                                                                onChange={(e) => updateDraft(item.id, 'description', e.target.value)}
                                                                className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                                                            />
                                                            <select
                                                                value={editDrafts[item.id].category}
                                                                onChange={(e) => updateDraft(item.id, 'category', e.target.value)}
                                                                className="h-9 w-full cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs outline-none"
                                                            >
                                                                {categories.map((category) => <option key={category}>{category}</option>)}
                                                                {!categories.includes(item.category) && item.category ? <option>{item.category}</option> : null}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                                                                {item.description}
                                                                {item.duplicate_transaction_id && (
                                                                    <span className="rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-brand)]">Possible duplicate</span>
                                                                )}
                                                            </div>
                                                            <div className="mt-1 text-xs font-mono text-[var(--color-muted)]">{item.date} · {item.category}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {(() => {
                                                        const srcMap: Record<string, { label: string; bg: string; color: string }> = {
                                                            pdf:       { label: 'PDF', bg: 'var(--color-surface-2)', color: 'var(--color-muted)' },
                                                            csv:       { label: 'CSV', bg: 'var(--color-surface-2)', color: 'var(--color-muted)' },
                                                            extension: { label: 'Extension', bg: 'var(--color-brand-soft)', color: 'var(--color-brand)' },
                                                            ai:        { label: 'AI', bg: 'var(--color-ai-soft)', color: 'var(--color-ai)' },
                                                        };
                                                        const s = srcMap[item.source?.toLowerCase()] || { label: item.source, bg: 'var(--color-surface-2)', color: 'var(--color-muted)' };
                                                        return (
                                                            <span style={{ padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600, background: s.bg, color: s.color, border: '1px solid var(--color-border)', display: 'inline-block', borderRadius: 999 }}>
                                                                {s.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-4">
                                                    {(() => {
                                                        const pct = Math.round((item.confidence || 0) * 100);
                                                        const color = pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold tabular-nums font-mono" style={{ color }}>{pct}%</span>
                                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-4 text-right text-sm font-semibold tabular-nums font-mono">
                                                    {editDrafts[item.id] ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={editDrafts[item.id].amount}
                                                            onChange={(e) => updateDraft(item.id, 'amount', e.target.value)}
                                                            className="ml-auto h-9 w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-right text-xs outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                                                        />
                                                    ) : (
                                                        formatCurrency(Number(item.amount || 0))
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-end gap-1.5">
                                                        {status === 'pending' && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editDrafts[item.id] ? cancelEdit(item.id) : startEdit(item)}
                                                                    title={editDrafts[item.id] ? 'Cancel edit' : 'Edit before approve'}
                                                                    className={cn(
                                                                        'flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)]',
                                                                        editDrafts[item.id] ? 'bg-amber-100 text-amber-900' : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
                                                                    )}
                                                                >
                                                                    <Pencil size={14} strokeWidth={2} />
                                                                </button>
                                                                {item.duplicate_transaction_id && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => merge(item)}
                                                                        title="Merge into existing ledger item (M)"
                                                                        className="flex h-8 px-2 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-mono text-xs font-semibold"
                                                                    >
                                                                        <Link2 size={13} strokeWidth={2} />
                                                                        {isFocused && (
                                                                            <kbd className="px-1 py-0.5 rounded text-[9px] bg-amber-200/80 text-amber-900 font-mono font-bold">M</kbd>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => approve(item)}
                                                                    title={item.duplicate_transaction_id ? 'Keep as a new ledger item' : 'Approve to ledger (A)'}
                                                                    className="flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg bg-[var(--color-success)] text-white hover:opacity-90 font-mono text-xs font-semibold shadow-xs"
                                                                >
                                                                    <Check size={14} strokeWidth={2.5} />
                                                                    {isFocused && (
                                                                        <kbd className="px-1 py-0.5 rounded text-[9px] bg-black/20 text-white font-mono font-bold">A</kbd>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => reject(item.id)}
                                                                    title="Reject candidate (R)"
                                                                    className="flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg bg-[var(--color-danger)] text-white hover:opacity-90 font-mono text-xs font-semibold shadow-xs"
                                                                >
                                                                    <X size={14} strokeWidth={2.5} />
                                                                    {isFocused && (
                                                                        <kbd className="px-1 py-0.5 rounded text-[9px] bg-black/20 text-white font-mono font-bold">R</kbd>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Surface>

                <aside className="space-y-6 sm:space-y-8 min-w-0">
                    <Surface className="border-[var(--color-border)] shadow-xs">
                        <div className="mb-4 flex items-center gap-2">
                            <Wand2 size={18} className="text-[var(--color-brand)]" />
                            <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Merchant rule</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--color-muted)]">Merchant pattern</label>
                                <input value={ruleForm.merchantPattern} onChange={e => setRuleForm({ ...ruleForm, merchantPattern: e.target.value })} placeholder="e.g. Foodpanda" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs outline-none focus:ring-2 focus:ring-[var(--color-brand)]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--color-muted)]">Category</label>
                                <select value={ruleForm.category} onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-ink)]">
                                    {categories.map(category => <option key={category}>{category}</option>)}
                                </select>
                            </div>
                            <Button onClick={addRule} className="w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white">Create rule</Button>
                            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                                Matching extension captures with high confidence auto-post to the ledger. Everything else stays here until you approve.
                            </p>
                        </div>
                    </Surface>
                    
                    <Surface className="border-[var(--color-border)] shadow-xs">
                        <div className="mb-4 flex items-center gap-2">
                            <Settings2 size={18} className="text-[var(--color-muted)]" />
                            <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Active rules</h2>
                        </div>
                        <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-auto pr-1">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 min-[420px]:flex-row min-[420px]:items-center">
                                    <div>
                                        <div className="text-xs font-semibold text-[var(--color-ink)]">{rule.merchant_pattern}</div>
                                        <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">{rule.match_type} • <span className="text-[var(--color-brand)] font-medium">{rule.category}</span></div>
                                    </div>
                                    <button
                                        onClick={async () => { await merchantRulesApi.delete(rule.id); load(); }}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {rules.length === 0 && (
                                <p className="py-6 text-center text-xs text-[var(--color-muted)]">No rules yet.</p>
                            )}
                        </div>
                    </Surface>
                </aside>
            </section>
        </div>
    );
};

export default TransactionInboxPage;
