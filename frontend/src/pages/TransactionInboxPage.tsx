import { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Link2, Pencil, RefreshCw, Settings2, Trash2, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { merchantRulesApi, MerchantRule, transactionInboxApi, TransactionCandidate, invalidateInboxCache } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import { emitFinancialDataEvent } from '../services/financialDataEvents';
import { invalidateTransactionCache } from '../services/supabaseTransactionService';

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
        <div className="min-h-screen bg-white p-4 text-black sm:p-6 lg:p-10 font-sans overflow-x-hidden">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between border-4 border-black p-5 sm:p-8 bg-white shadow-[5px_5px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] mb-6 sm:mb-10 relative z-20">
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-5 sm:gap-6">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-black text-white flex items-center justify-center border-4 border-black shadow-[5px_5px_0px_#E11D48] sm:shadow-[6px_6px_0px_#E11D48] shrink-0">
                        <Inbox size={32} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase italic text-black m-0 tracking-tight break-words">TRANSACTION INBOX</h1>
                        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#E11D48] mt-1 leading-relaxed">Review, edit amount or category, then authorize</p>
                    </div>
                </div>
                <button onClick={() => void load()} className="min-h-12 sm:h-14 px-5 sm:px-8 border-4 border-black bg-white flex items-center justify-center gap-3 font-black uppercase tracking-widest shadow-[5px_5px_0px_#000000] sm:shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] transition-all text-xs sm:text-sm">
                    <RefreshCw size={20} strokeWidth={3} /> Sync Inbox
                </button>
            </header>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-10">
                <div className="bg-white border-4 border-black shadow-[12px_12px_0px_#000000] overflow-hidden">
                    <div className="p-4 sm:p-6 border-b-4 border-black flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between bg-yellow-400">
                        <div className="flex min-w-0 flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
                            <div className="flex w-full sm:w-auto overflow-x-auto items-center gap-2 p-1 bg-white border-4 border-black shadow-[4px_4px_0px_#000000]">
                                {['pending', 'approved', 'rejected', 'merged'].map(value => (
                                    <button
                                        key={value}
                                        onClick={() => setStatus(value)}
                                        className={`px-4 sm:px-5 py-2 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${status === value ? 'bg-black text-white shadow-[2px_2px_0px_#E11D48]' : 'hover:bg-gray-100 text-black'}`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>

                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-12 px-4 text-xs font-black uppercase tracking-widest border-4 border-black bg-white shadow-[4px_4px_0px_#000000] outline-none cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all"
                            >
                                <option value="date">Sort: Date</option>
                                <option value="confidence">Sort: Review Needed</option>
                                <option value="amount">Sort: Amount</option>
                            </select>
                        </div>
                        <div className="flex flex-col min-[420px]:flex-row gap-3 sm:gap-4">
                            <button 
                                onClick={() => bulk('approve')} 
                                disabled={!selected.length} 
                                className="min-h-12 px-4 sm:px-6 border-4 border-black bg-[#10b981] text-black text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                            >
                                Approve ({selected.length})
                            </button>
                            <button 
                                onClick={() => bulk('reject')} 
                                disabled={!selected.length} 
                                className="min-h-12 px-4 sm:px-6 border-4 border-black bg-[#E11D48] text-white text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                            >
                                Reject ({selected.length})
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 sm:p-16 text-center font-black uppercase tracking-widest text-base sm:text-xl flex flex-col items-center gap-4">
                            <RefreshCw size={32} strokeWidth={3} className="animate-spin" />
                            Loading Inbox...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-10 sm:p-24 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 border-4 border-black flex items-center justify-center bg-gray-100 shadow-[6px_6px_0px_#000000]">
                                <Inbox size={40} strokeWidth={3} className="text-black" />
                            </div>
                            <h3 className="font-black uppercase italic text-2xl mb-2">Zero Transactions</h3>
                            <p className="font-bold opacity-60 uppercase tracking-widest text-sm">No candidates in this queue.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="p-5 text-left w-16 border-b-4 border-black">
                                            <div className="w-6 h-6 relative border-4 border-white bg-black">
                                                <input 
                                                    type="checkbox" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => setSelected(e.target.checked ? items.map(i => i.id) : [])}
                                                    checked={selected.length === items.length && items.length > 0}
                                                />
                                                {selected.length === items.length && items.length > 0 && <Check size={16} strokeWidth={4} className="absolute inset-0 m-auto text-rose-500" />}
                                            </div>
                                        </th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest text-left border-b-4 border-black border-r border-white/20">Transaction</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest text-left border-b-4 border-black border-r border-white/20">Source</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest text-left border-b-4 border-black border-r border-white/20">Confidence</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest text-right border-b-4 border-black border-r border-white/20">Amount</th>
                                        <th className="p-5 text-xs font-black uppercase tracking-widest text-right border-b-4 border-black">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className="border-b-4 border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-5">
                                                <div className="w-6 h-6 relative border-4 border-black bg-white">
                                                    <input
                                                        type="checkbox"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                        checked={selected.includes(item.id)}
                                                        onChange={(e) => setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))}
                                                    />
                                                    {selected.includes(item.id) && <Check size={16} strokeWidth={4} className="absolute inset-0 m-auto text-rose-600" />}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {editDrafts[item.id] ? (
                                                    <div className="space-y-2 min-w-[220px]">
                                                        <input
                                                            value={editDrafts[item.id].description}
                                                            onChange={(e) => updateDraft(item.id, 'description', e.target.value)}
                                                            className="w-full h-10 px-3 border-4 border-black font-black uppercase text-sm focus:outline-none focus:shadow-[3px_3px_0px_#E11D48]"
                                                        />
                                                        <select
                                                            value={editDrafts[item.id].category}
                                                            onChange={(e) => updateDraft(item.id, 'category', e.target.value)}
                                                            className="w-full h-10 px-3 border-4 border-black font-bold uppercase text-xs cursor-pointer focus:outline-none"
                                                        >
                                                            {categories.map((category) => <option key={category}>{category}</option>)}
                                                            {!categories.includes(item.category) && item.category ? <option>{item.category}</option> : null}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="font-black text-black text-lg uppercase flex items-center gap-3">
                                                            {item.description}
                                                            {item.duplicate_transaction_id && (
                                                                <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-rose-600 text-rose-600 bg-white shadow-[2px_2px_0px_#E11D48]">⚠ DUPE</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{item.date} • {item.category}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                {(() => {
                                                    const srcMap: Record<string, { label: string; bg: string; color: string }> = {
                                                        pdf:       { label: '📄 PDF',  bg: '#fef3c7', color: '#000' },
                                                        csv:       { label: '📊 CSV',  bg: '#dbeafe', color: '#000' },
                                                        extension: { label: '🔌 EXT',  bg: '#ede9fe', color: '#000' },
                                                        ai:        { label: '🤖 AI',   bg: '#d1fae5', color: '#000' },
                                                    };
                                                    const s = srcMap[item.source?.toLowerCase()] || { label: item.source, bg: '#f1f5f9', color: '#000' };
                                                    return (
                                                        <span style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', background: s.bg, color: s.color, border: '3px solid #000000', display: 'inline-block', boxShadow: '2px 2px 0px #000000' }}>
                                                            {s.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5">
                                                {(() => {
                                                    const pct = Math.round((item.confidence || 0) * 100);
                                                    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#e11d48';
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-lg" style={{ color: color }}>{pct}%</span>
                                                            <div className="w-16 h-3 border-2 border-black bg-white overflow-hidden">
                                                                <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5 text-right font-black text-xl">
                                                {editDrafts[item.id] ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editDrafts[item.id].amount}
                                                        onChange={(e) => updateDraft(item.id, 'amount', e.target.value)}
                                                        className="w-28 ml-auto h-10 px-3 border-4 border-black font-black text-right focus:outline-none focus:shadow-[3px_3px_0px_#E11D48]"
                                                    />
                                                ) : (
                                                    formatCurrency(Number(item.amount || 0))
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex justify-end gap-3">
                                                    {status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => editDrafts[item.id] ? cancelEdit(item.id) : startEdit(item)}
                                                                title={editDrafts[item.id] ? 'Cancel edit' : 'Edit before approve'}
                                                                className={`h-10 w-10 border-4 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all ${editDrafts[item.id] ? 'bg-yellow-300 text-black' : 'bg-white text-black'}`}
                                                            >
                                                                <Pencil size={18} strokeWidth={3} />
                                                            </button>
                                                            {item.duplicate_transaction_id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => merge(item)}
                                                                    title="Merge into existing ledger item"
                                                                    className="h-10 w-10 border-4 border-black bg-yellow-300 text-black shadow-[4px_4px_0px_#000000] flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all"
                                                                >
                                                                    <Link2 size={18} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                            <button type="button" onClick={() => approve(item)} title={item.duplicate_transaction_id ? 'Keep as a new ledger item' : 'Approve to ledger'} className="h-10 w-10 border-4 border-black bg-[#10b981] text-black shadow-[4px_4px_0px_#000000] flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all active:shadow-[0px_0px_0px_#000000] active:translate-x-1 active:translate-y-1"><Check size={20} strokeWidth={3} /></button>
                                                            <button type="button" onClick={() => reject(item.id)} className="h-10 w-10 border-4 border-black bg-[#E11D48] text-white shadow-[4px_4px_0px_#000000] flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000] transition-all active:shadow-[0px_0px_0px_#000000] active:translate-x-1 active:translate-y-1"><X size={20} strokeWidth={3} /></button>
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
                </div>

                <aside className="space-y-6 sm:space-y-8 min-w-0">
                    <div className="bg-white border-4 border-black p-5 sm:p-8 shadow-[6px_6px_0px_#000000] sm:shadow-[8px_8px_0px_#000000]">
                        <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                            <Wand2 size={24} strokeWidth={3} className="text-rose-600" />
                            <h2 className="font-black text-xl uppercase italic">Smart Merchant Rule</h2>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest">Merchant Pattern</label>
                                <input value={ruleForm.merchantPattern} onChange={e => setRuleForm({ ...ruleForm, merchantPattern: e.target.value })} placeholder="e.g. Foodpanda" className="w-full h-12 px-4 border-4 border-black font-bold uppercase focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[4px_4px_0px_#E11D48] transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest">Assign Category</label>
                                <select value={ruleForm.category} onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })} className="w-full h-12 px-4 border-4 border-black font-bold uppercase cursor-pointer focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[4px_4px_0px_#E11D48] transition-all">
                                    {categories.map(category => <option key={category}>{category}</option>)}
                                </select>
                            </div>
                            <button onClick={addRule} className="w-full h-14 mt-4 border-4 border-black bg-[#E11D48] text-white font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#000000] transition-all active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_#000000]">Create Rule</button>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 leading-relaxed">
                                Matching extension captures with high confidence auto-post to the ledger. Everything else stays here until you approve.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white border-4 border-black p-5 sm:p-8 shadow-[6px_6px_0px_#000000] sm:shadow-[8px_8px_0px_#000000]">
                        <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
                            <Settings2 size={24} strokeWidth={3} className="text-black" />
                            <h2 className="font-black text-xl uppercase italic">Active Rules</h2>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-4 p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#E11D48] transition-all group">
                                    <div>
                                        <div className="font-black text-base uppercase text-black">{rule.merchant_pattern}</div>
                                        <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{rule.match_type} • <span className="text-[#E11D48]">{rule.category}</span></div>
                                    </div>
                                    <button
                                        onClick={async () => { await merchantRulesApi.delete(rule.id); load(); }}
                                        className="h-10 w-10 flex items-center justify-center border-4 border-black bg-white group-hover:bg-[#E11D48] group-hover:text-white transition-colors shadow-[2px_2px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_#000000]"
                                    >
                                        <Trash2 size={16} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                            {rules.length === 0 && (
                                <div className="p-8 text-center border-4 border-dashed border-black">
                                    <p className="text-xs font-bold uppercase tracking-widest text-black opacity-60">No rules active.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
};

export default TransactionInboxPage;
