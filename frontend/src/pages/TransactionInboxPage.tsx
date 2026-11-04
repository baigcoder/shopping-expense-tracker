// Review inbox: live data and actions around the shared InboxView (the demo renders the same view).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { InboxView, type Edits, type InboxItem, type InboxRule, type InboxStatus } from '../features/inbox/InboxView';
import { merchantRulesApi, transactionInboxApi, invalidateInboxCache, type TransactionCandidate } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import { emitFinancialDataEvent } from '../services/financialDataEvents';
import { invalidateTransactionCache } from '../services/supabaseTransactionService';
import { soundManager } from '@/lib/sounds';
import { withRules } from '../features/inbox/inboxRules';

const toItem = (c: TransactionCandidate): InboxItem => ({
    id: c.id,
    merchant: c.merchant_name || c.description,
    description: c.description,
    amount: Math.abs(Number(c.amount) || 0),
    category: c.category || 'Other',
    date: c.date,
    source: c.source,
    confidence: c.confidence || 0,
    duplicateOf: c.duplicate_transaction_id,
    type: c.type === 'income' ? 'income' : 'expense',
});

const ledgerChanged = (source: string, payload?: unknown) => {
    invalidateTransactionCache();
    emitFinancialDataEvent('transaction-added', payload);
    emitFinancialDataEvent('cashly-data-updated', { area: 'transactions', source });
};

const TransactionInboxPage = () => {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [rules, setRules] = useState<InboxRule[]>([]);
    const [status, setStatus] = useState<InboxStatus>('pending');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            invalidateInboxCache();
            const [inbox, ruleList] = await Promise.all([transactionInboxApi.list({ status, limit: 100 }), merchantRulesApi.list()]);
            setItems((inbox.data || []).map(toItem));
            setRules(ruleList.map((r) => ({ id: r.id, pattern: r.merchant_pattern, category: r.category, matchType: r.match_type, enabled: r.enabled })));
        } catch {
            toast.error('Could not load your inbox. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { void load(); }, [load]);

    // New captures from the extension refresh the list without a reload.
    useEffect(() => {
        const onUpdate = (event: Event) => {
            const d = (event as CustomEvent).detail || {};
            const t = String(d.type || d.area || '');
            if (event.type === 'cashly-data-updated' && !t.includes('inbox') && !t.startsWith('TRANSACTION_CANDIDATE') && !d.pendingReview) return;
            void load(true);
        };
        window.addEventListener('transaction-candidate-added', onUpdate);
        window.addEventListener('cashly-data-updated', onUpdate);
        return () => {
            window.removeEventListener('transaction-candidate-added', onUpdate);
            window.removeEventListener('cashly-data-updated', onUpdate);
        };
    }, [load]);

    // Rules saved after capture still decide the category of items waiting now.
    const shown = useMemo(() => (status === 'pending' ? withRules(items, rules) : items), [items, rules, status]);

    // Acted-on items leave the list at once; a failed save reloads them.
    const run = async (work: () => Promise<unknown>, ok: string, fail: string, sound: 'success' | 'whoosh' | 'click' = 'success', hide: string[] = []) => {
        if (hide.length) setItems((list) => list.filter((i) => !hide.includes(i.id)));
        try {
            await work();
            soundManager.play(sound);
            toast.success(ok);
            await load(true);
        } catch {
            soundManager.play('error');
            toast.error(fail);
            if (hide.length) await load(true);
        }
    };

    return (
        <InboxView
            items={shown}
            rules={rules}
            status={status}
            loading={loading}
            money={(n) => formatCurrency(n)}
            onStatus={setStatus}
            onApprove={(item, edits?: Edits) => void run(async () => {
                const r = await transactionInboxApi.approve(item.id, edits || (item.ruled ? { category: item.category } : {}));
                ledgerChanged('inbox-approve', r?.transaction || r?.data);
            }, `${item.merchant} approved`, 'That did not save. Try again.', 'success', [item.id])}
            onReject={(item) => void run(() => transactionInboxApi.reject(item.id), `${item.merchant} marked not yours`, 'That did not save. Try again.', 'whoosh', [item.id])}
            onMerge={(item) => void run(async () => {
                await transactionInboxApi.merge(item.id, item.duplicateOf!);
                emitFinancialDataEvent('cashly-data-updated', { area: 'inbox', source: 'inbox-merge' });
            }, 'Merged with the purchase already in your ledger', 'Merge failed. Try again.', 'click', [item.id])}
            onBulk={(ids, action) => void run(async () => {
                // Items recategorised by a rule are approved one by one so their new category is saved.
                const ruled = action === 'approve' ? shown.filter((i) => ids.includes(i.id) && i.ruled) : [];
                const rest = ids.filter((id) => !ruled.some((i) => i.id === id));
                if (rest.length) await transactionInboxApi.bulk(rest, action);
                for (const i of ruled) await transactionInboxApi.approve(i.id, { category: i.category });
                if (action === 'approve') ledgerChanged('inbox-bulk-approve', { count: ids.length });
            }, action === 'approve' ? `${ids.length} approved` : `${ids.length} marked not yours`, `Could not ${action} those. Try again.`, action === 'approve' ? 'success' : 'whoosh', ids)}
            onAddRule={(r) => void run(() => merchantRulesApi.create({
                merchantPattern: r.pattern, category: r.category, match_type: r.matchType as 'contains', transaction_type: 'expense', priority: 50, enabled: true,
            }), `Rule saved: “${r.pattern}” goes to ${r.category}`, 'Could not save the rule.', 'click')}
            onToggleRule={(r) => void run(() => merchantRulesApi.update(r.id, { enabled: !r.enabled }), r.enabled ? 'Rule paused' : 'Rule turned on', 'Could not change the rule.', 'click')}
            onRemoveRule={(r) => void run(() => merchantRulesApi.delete(r.id), 'Rule removed', 'Could not remove the rule.', 'click')}
        />
    );
};

export default TransactionInboxPage;
