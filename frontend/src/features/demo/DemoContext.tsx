import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HomeInput, HomeTransaction } from '../home/homeModel';
import type { Edits, InboxItem, InboxRule } from '../inbox/InboxView';
import { demoBudgets, demoCommitments, demoGoals, demoInbox, demoRules, demoTransactions, toHomeSubscriptions } from './demoData';
import type { CommitmentInput } from '../commitments/commitmentsModel';

interface DemoState {
    input: Omit<HomeInput, 'now'>;
    budgets: { id: string; category: string; amount: number }[];
    addBudget: (category: string, amount: number) => void;
    removeBudget: (id: string) => void;
    commitments: CommitmentInput[];
    updateCommitment: (id: string, patch: Partial<CommitmentInput> | null) => void;
    addCommitment: (c: CommitmentInput) => void;
    inbox: { pending: InboxItem[]; approved: InboxItem[]; rejected: InboxItem[] };
    rules: InboxRule[];
    approve: (item: InboxItem | { id: string }, edits?: Edits) => void;
    dismiss: (item: InboxItem | { id: string }) => void;
    merge: (item: InboxItem) => void;
    bulk: (ids: string[], action: 'approve' | 'reject') => void;
    addRule: (r: { pattern: string; category: string; matchType: string }) => void;
    reset: () => void;
    lastAction: string | null;
}

const DemoCtx = createContext<DemoState | null>(null);

// In-memory only: nothing the visitor does in the demo is saved or sent anywhere.
export function DemoProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<HomeTransaction[]>(demoTransactions);
    const [pending, setPending] = useState<InboxItem[]>(demoInbox);
    const [approved, setApproved] = useState<InboxItem[]>([]);
    const [rejected, setRejected] = useState<InboxItem[]>([]);
    const [rules, setRules] = useState<InboxRule[]>(demoRules);
    const [budgets, setBudgets] = useState(demoBudgets);
    const [commitments, setCommitments] = useState(demoCommitments);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const take = (ids: string[]) => {
        const picked = pending.filter((p) => ids.includes(p.id));
        setPending((p) => p.filter((x) => !ids.includes(x.id)));
        return picked;
    };

    const book = (items: InboxItem[]) => {
        setTransactions((t) => [...items.map((i) => ({ id: `a-${i.id}`, date: i.date, description: i.merchant, amount: i.amount, type: 'expense' as const, category: i.category })), ...t]);
        setApproved((a) => [...items, ...a]);
    };

    const approve = useCallback((ref: InboxItem | { id: string }, edits?: Edits) => {
        const [item] = take([ref.id]);
        if (!item) return;
        const final = edits ? { ...item, ...edits } : item;
        book([final]);
        setLastAction(`${final.merchant} approved. It now counts toward ${final.category} and your safe-to-spend.`);
    }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

    const dismiss = useCallback((ref: InboxItem | { id: string }) => {
        const [item] = take([ref.id]);
        if (!item) return;
        setRejected((r) => [item, ...r]);
        setLastAction(`${item.merchant} marked not yours. It never touches your numbers.`);
    }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

    const merge = useCallback((item: InboxItem) => {
        take([item.id]);
        setLastAction(`${item.merchant} merged with the purchase already in your ledger, so it is not counted twice.`);
    }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

    const bulk = useCallback((ids: string[], action: 'approve' | 'reject') => {
        const items = take(ids);
        if (action === 'approve') book(items); else setRejected((r) => [...items, ...r]);
        setLastAction(`${items.length} ${action === 'approve' ? 'approved' : 'marked not yours'} in one go.`);
    }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

    const addRule = useCallback((r: { pattern: string; category: string; matchType: string }) => {
        setRules((list) => [{ id: `r-${Date.now()}`, enabled: true, ...r }, ...list]);
        setLastAction(`Rule saved. Purchases from “${r.pattern}” will skip the inbox and go to ${r.category}.`);
    }, []);

    const addBudget = useCallback((category: string, amount: number) => {
        setBudgets((b) => [...b, { id: `b-${Date.now()}`, category, amount }]);
        setLastAction(`${category} budget added. Approved ${category.toLowerCase()} purchases now fill it.`);
    }, []);

    const removeBudget = useCallback((id: string) => {
        setBudgets((b) => b.filter((x) => x.id !== id));
        setLastAction('Budget removed.');
    }, []);

    const updateCommitment = useCallback((id: string, patch: Partial<CommitmentInput> | null) => {
        setCommitments((list) => patch === null ? list.filter((c) => c.id !== id) : list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        setLastAction(patch === null ? 'Removed.' : patch.paid ? 'Marked paid. It drops out of what is coming up.' : patch.active === false ? 'Cancelled. Safe to spend goes up by its monthly cost.' : 'Updated.');
    }, []);

    const addCommitment = useCallback((c: CommitmentInput) => {
        setCommitments((list) => [...list, c]);
        setLastAction(`${c.name} added. It shows on the 30-day strip and in Coming up on Home.`);
    }, []);

    const reset = useCallback(() => {
        setTransactions(demoTransactions()); setPending(demoInbox()); setApproved([]); setRejected([]); setRules(demoRules()); setBudgets(demoBudgets()); setCommitments(demoCommitments()); setLastAction(null);
    }, []);

    const value = useMemo<DemoState>(() => ({
        input: {
            transactions, budgets, subscriptions: toHomeSubscriptions(commitments), goals: demoGoals,
            pending: pending.map(({ id, merchant, description, amount, category, date, source }) => ({ id, merchant, description, amount, category, date, source })),
        },
        budgets, addBudget, removeBudget, commitments, updateCommitment, addCommitment,
        inbox: { pending, approved, rejected }, rules,
        approve, dismiss, merge, bulk, addRule, reset, lastAction,
    }), [transactions, budgets, addBudget, removeBudget, commitments, updateCommitment, addCommitment, pending, approved, rejected, rules, approve, dismiss, merge, bulk, addRule, reset, lastAction]);

    return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
    const ctx = useContext(DemoCtx);
    if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
    return ctx;
}
