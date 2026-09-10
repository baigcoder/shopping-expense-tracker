import { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Link2, Pencil, RefreshCw, Settings2, Trash2, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { merchantRulesApi, MerchantRule, transactionInboxApi, TransactionCandidate, invalidateInboxCache } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import { emitFinancialDataEvent } from '../services/financialDataEvents';
import { invalidateTransactionCache } from '../services/supabaseTransactionService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

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
        } catch (error) {
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

    const approve = async (item: TransactionCandidate) => {
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
            toast.success('Transaction approved');
            load(true);
        } catch {
            toast.error('Approve failed');
        }
    };

    const merge = async (item: TransactionCandidate) => {
        if (!item.duplicate_transaction_id) return;
        try {
            await transactionInboxApi.merge(item.id, item.duplicate_transaction_id);
            emitFinancialDataEvent('cashly-data-updated', { area: 'inbox', source: 'inbox-merge' });
            toast.success('Merged into existing ledger item');
            load(true);
        } catch {
            toast.error('Merge failed');
        }
    };

    const reject = async (id: string) => {
        try {
            await transactionInboxApi.reject(id);
            cancelEdit(id);
            toast.success('Candidate rejected');
            load();
        } catch {
            toast.error('Reject failed');
        }
    };

    const bulk = async (action: 'approve' | 'reject') => {
        if (!selected.length) return;
        try {
            await transactionInboxApi.bulk(selected, action);
            if (action === 'approve') {
                invalidateTransactionCache();
                emitFinancialDataEvent('transaction-added', { count: selected.length });
                emitFinancialDataEvent('cashly-data-updated', { area: 'transactions', source: 'inbox-bulk-approve' });
            }
            toast.success(action === 'approve' ? 'Bulk complete — duplicates were merged' : 'Bulk reject complete');
            setSelected([]);
            load();
        } catch {
            toast.error(`Bulk ${action} failed`);
        }
    };

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
        <div className="min-h-screen bg-[var(--bg-page)] p-1 text-[var(--text-primary)] sm:p-2">
            <PageHeader
                title="Review inbox"
                description="Approve, edit, merge, or reject captures before they hit your ledger."
                actions={
                    <Button variant="outline" onClick={() => void load()}>
                        <RefreshCw size={16} /> Refresh
                    </Button>
                }
            />

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-10">
                <Surface padded={false} className="overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-[#E7E5E4] bg-[#F4F0EB] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#E7E5E4] bg-white p-1 sm:w-auto">
                                {['pending', 'approved', 'rejected', 'merged'].map(value => (
                                    <button
                                        key={value}
                                        onClick={() => setStatus(value)}
                                        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${status === value ? 'bg-[#E11D48] text-white' : 'text-[#57534E] hover:bg-[#F4F0EB]'}`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>

                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-10 rounded-[var(--r-md)] border border-[#E7E5E4] bg-white px-3 text-sm outline-none"
                            >
                                <option value="date">Sort: Date</option>
                                <option value="confidence">Sort: Review needed</option>
                                <option value="amount">Sort: Amount</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 min-[420px]:flex-row">
                            <Button
                                onClick={() => bulk('approve')}
                                disabled={!selected.length}
                                className="bg-[#059669] hover:bg-[#047857]"
                            >
                                Approve ({selected.length})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => bulk('reject')}
                                disabled={!selected.length}
                            >
                                Reject ({selected.length})
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-sm text-[var(--text-muted)]">
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
                                <thead className="bg-[#F4F0EB] text-[var(--text-muted)]">
                                    <tr>
                                        <th className="w-16 p-4 text-left">
                                            <div className="relative h-5 w-5 rounded border border-[#D6D3D1] bg-white">
                                                <input 
                                                    type="checkbox" 
                                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                    onChange={(e) => setSelected(e.target.checked ? items.map(i => i.id) : [])}
                                                    checked={selected.length === items.length && items.length > 0}
                                                />
                                                {selected.length === items.length && items.length > 0 && <Check size={14} className="absolute inset-0 m-auto text-[#E11D48]" />}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-xs font-medium">Transaction</th>
                                        <th className="p-4 text-left text-xs font-medium">Source</th>
                                        <th className="p-4 text-left text-xs font-medium">Confidence</th>
                                        <th className="p-4 text-right text-xs font-medium">Amount</th>
                                        <th className="p-4 text-right text-xs font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[#FAF8F5] transition-colors">
                                            <td className="p-4">
                                                <div className="relative h-5 w-5 rounded border border-[#D6D3D1] bg-white">
                                                    <input
                                                        type="checkbox"
                                                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                                        checked={selected.includes(item.id)}
                                                        onChange={(e) => setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))}
                                                    />
                                                    {selected.includes(item.id) && <Check size={14} className="absolute inset-0 m-auto text-[#E11D48]" />}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {editDrafts[item.id] ? (
                                                    <div className="min-w-[220px] space-y-2">
                                                        <input
                                                            value={editDrafts[item.id].description}
                                                            onChange={(e) => updateDraft(item.id, 'description', e.target.value)}
                                                            className="h-10 w-full rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-sm outline-none focus:border-[#E11D48]"
                                                        />
                                                        <select
                                                            value={editDrafts[item.id].category}
                                                            onChange={(e) => updateDraft(item.id, 'category', e.target.value)}
                                                            className="h-10 w-full cursor-pointer rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-sm outline-none"
                                                        >
                                                            {categories.map((category) => <option key={category}>{category}</option>)}
                                                            {!categories.includes(item.category) && item.category ? <option>{item.category}</option> : null}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {item.description}
                                                            {item.duplicate_transaction_id && (
                                                                <span className="rounded-full border border-[#E11D48]/30 bg-[#FFE4E6] px-2 py-0.5 text-[10px] font-medium text-[#E11D48]">Possible duplicate</span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-xs text-[var(--text-muted)]">{item.date} · {item.category}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {(() => {
                                                    const srcMap: Record<string, { label: string; bg: string; color: string }> = {
                                                        pdf:       { label: 'PDF', bg: '#F4F0EB', color: '#57534E' },
                                                        csv:       { label: 'CSV', bg: '#F4F0EB', color: '#57534E' },
                                                        extension: { label: 'Extension', bg: '#FFE4E6', color: '#E11D48' },
                                                        ai:        { label: 'AI', bg: '#ECFDF5', color: '#059669' },
                                                    };
                                                    const s = srcMap[item.source?.toLowerCase()] || { label: item.source, bg: '#F4F0EB', color: '#57534E' };
                                                    return (
                                                        <span style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', background: s.bg, color: s.color, border: '1px solid #E7E5E4', display: 'inline-block', borderRadius: 999 }}>
                                                            {s.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-4">
                                                {(() => {
                                                    const pct = Math.round((item.confidence || 0) * 100);
                                                    const color = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#E11D48';
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold" style={{ color }}>{pct}%</span>
                                                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F4F0EB]">
                                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-4 text-right text-sm font-semibold">
                                                {editDrafts[item.id] ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editDrafts[item.id].amount}
                                                        onChange={(e) => updateDraft(item.id, 'amount', e.target.value)}
                                                        className="ml-auto h-10 w-28 rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-right text-sm outline-none focus:border-[#E11D48]"
                                                    />
                                                ) : (
                                                    formatCurrency(Number(item.amount || 0))
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    {status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => editDrafts[item.id] ? cancelEdit(item.id) : startEdit(item)}
                                                                title={editDrafts[item.id] ? 'Cancel edit' : 'Edit before approve'}
                                                                className={`flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] border border-[#E7E5E4] ${editDrafts[item.id] ? 'bg-[#FEF3C7] text-[#1C1917]' : 'bg-white text-[#1C1917] hover:bg-[#F4F0EB]'}`}
                                                            >
                                                                <Pencil size={16} strokeWidth={2} />
                                                            </button>
                                                            {item.duplicate_transaction_id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => merge(item)}
                                                                    title="Merge into existing ledger item"
                                                                    className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] border border-[#E7E5E4] bg-[#FEF3C7] text-[#1C1917]"
                                                                >
                                                                    <Link2 size={16} strokeWidth={2} />
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => approve(item)} title={item.duplicate_transaction_id ? 'Keep as a new ledger item' : 'Approve to ledger'} className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-[#059669] text-white"><Check size={16} strokeWidth={2} /></button>
                                                            <button type="button" onClick={() => reject(item.id)} className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-[#E11D48] text-white"><X size={16} strokeWidth={2} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Surface>

                <aside className="space-y-6 sm:space-y-8 min-w-0">
                    <Surface>
                        <div className="mb-4 flex items-center gap-2">
                            <Wand2 size={18} className="text-[#E11D48]" />
                            <h2 className="font-display text-lg font-semibold">Merchant rule</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#57534E]">Merchant pattern</label>
                                <input value={ruleForm.merchantPattern} onChange={e => setRuleForm({ ...ruleForm, merchantPattern: e.target.value })} placeholder="e.g. Foodpanda" className="h-11 w-full rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-sm outline-none focus:border-[#E11D48]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#57534E]">Category</label>
                                <select value={ruleForm.category} onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })} className="h-11 w-full rounded-[var(--r-md)] border border-[#E7E5E4] px-3 text-sm">
                                    {categories.map(category => <option key={category}>{category}</option>)}
                                </select>
                            </div>
                            <Button onClick={addRule} className="w-full">Create rule</Button>
                            <p className="text-xs leading-relaxed text-[#78716C]">
                                Matching extension captures with high confidence auto-post to the ledger. Everything else stays here until you approve.
                            </p>
                        </div>
                    </Surface>
                    
                    <Surface>
                        <div className="mb-4 flex items-center gap-2">
                            <Settings2 size={18} />
                            <h2 className="font-display text-lg font-semibold">Active rules</h2>
                        </div>
                        <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-auto pr-1">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex flex-col justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] p-3 min-[420px]:flex-row min-[420px]:items-center">
                                    <div>
                                        <div className="text-sm font-medium">{rule.merchant_pattern}</div>
                                        <div className="mt-0.5 text-xs text-[#78716C]">{rule.match_type} • <span className="text-[#E11D48]">{rule.category}</span></div>
                                    </div>
                                    <button
                                        onClick={async () => { await merchantRulesApi.delete(rule.id); load(); }}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#78716C] hover:bg-[#FFE4E6] hover:text-[#E11D48]"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {rules.length === 0 && (
                                <p className="py-6 text-center text-sm text-[#78716C]">No rules yet.</p>
                            )}
                        </div>
                    </Surface>
                </aside>
            </section>
        </div>
    );
};

export default TransactionInboxPage;
