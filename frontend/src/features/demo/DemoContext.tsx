import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HomeInput, HomeTransaction } from '../home/homeModel';
import type { Edits, InboxItem, InboxRule } from '../inbox/InboxView';
import { withRules } from '../inbox/inboxRules';
import { demoBudgets, demoCommitments, demoGoals, demoInbox, demoRules, demoTransactions } from './demoData';
import type { CommitmentInput } from '../commitments/commitmentsModel';

interface DemoState {
    input: Omit<HomeInput, 'now'>;
    budgets: { id: string; category: string; amount: number }[];
    addBudget: (category: string, amount: number) => void;
    removeBudget: (id: string) => void;
    updateBudget: (id: string, amount: number) => void;
    commitments: CommitmentInput[];
    updateCommitment: (id: string, patch: Partial<CommitmentInput> | null) => void;
    addCommitment: (c: CommitmentInput) => void;
    goals: ReturnType<typeof demoGoals>;
    addGoal: (g: { name: string; target: number; deadline: string | null }) => void;
    depositGoal: (id: string, amount: number) => void;
    removeGoal: (id: string) => void;
    updateTx: (t: HomeTransaction) => void;
    deleteTx: (id: string) => void;
    inbox: { pending: InboxItem[]; approved: InboxItem[]; rejected: InboxItem[] };
    rules: InboxRule[];
    approve: (item: InboxItem | { id: string }, edits?: Edits) => void;
    dismiss: (item: InboxItem | { id: string }) => void;
    merge: (item: InboxItem) => void;
    bulk: (ids: string[], action: 'approve' | 'reject') => void;
    addRule: (r: { pattern: string; category: string; matchType: string }) => void;
    toggleRule: (r: InboxRule) => void;
    removeRule: (r: InboxRule) => void;
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
    const [goals, setGoals] = useState(demoGoals);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const take = (ids: string[]) => {
        const picked = pending.filter((p) => ids.includes(p.id));
        setPending((p) => p.filter((x) => !ids.includes(x.id)));
        return picked;
    };

    const book = (items: InboxItem[]) => {
        setTransactions((t) => [...items.map((i) => ({ id: `a-${i.id}`, date: i.date, description: i.merchant, amount: i.amount, type: i.type ?? 'expense', category: i.category })), ...t]);
        setApproved((a) => [...items, ...a]);
    };

    const approve = useCallback((ref: InboxItem | { id: string }, edits?: Edits) => {
        const [item] = take([ref.id]);
        if (!item) return;
        const final = edits ? { ...item, ...edits } : withRules([item], rules)[0];
        book([final]);
        setLastAction(`${final.merchant} approved. It now counts toward ${final.category} and your safe-to-spend.`);
    }, [pending, rules]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (action === 'approve') book(withRules(items, rules)); else setRejected((r) => [...items, ...r]);
        setLastAction(`${items.length} ${action === 'approve' ? 'approved' : 'marked not yours'} in one go.`);
    }, [pending, rules]); // eslint-disable-line react-hooks/exhaustive-deps

    const addRule = useCallback((r: { pattern: string; category: string; matchType: string }) => {
        setRules((list) => [{ id: `r-${Date.now()}`, enabled: true, ...r }, ...list]);
        setLastAction(`Rule saved. Purchases from “${r.pattern}”, including any already waiting, go to ${r.category}.`);
    }, []);
    const toggleRule = useCallback((r: InboxRule) => setRules((list) => list.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x))), []);
    const removeRule = useCallback((r: InboxRule) => setRules((list) => list.filter((x) => x.id !== r.id)), []);

    const addBudget = useCallback((category: string, amount: number) => {
        setBudgets((b) => [...b, { id: `b-${Date.now()}`, category, amount }]);
        setLastAction(`${category} budget added. Approved ${category.toLowerCase()} purchases now fill it.`);
    }, []);

    const updateBudget = useCallback((id: string, amount: number) => setBudgets((b) => b.map((x) => (x.id === id ? { ...x, amount } : x))), []);
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

    const addGoal = useCallback((g: { name: string; target: number; deadline: string | null }) => {
        setGoals((list) => [...list, { id: `g-${Date.now()}`, saved: 0, ...g }]);
        setLastAction(`${g.name} added. What you set aside for goals comes off safe-to-spend.`);
    }, []);
    const depositGoal = useCallback((id: string, amount: number) => {
        setGoals((list) => list.map((g) => (g.id === id ? { ...g, saved: g.saved + amount } : g)));
        setLastAction('Added. The goal moves closer and its monthly amount shrinks.');
    }, []);
    const removeGoal = useCallback((id: string) => { setGoals((list) => list.filter((g) => g.id !== id)); setLastAction('Goal removed.'); }, []);

    const updateTx = useCallback((t: HomeTransaction) => { setTransactions((list) => list.map((x) => (x.id === t.id ? { ...x, ...t } : x))); setLastAction('Saved. Every chart and total uses the change.'); }, []);
    const deleteTx = useCallback((id: string) => { setTransactions((list) => list.filter((x) => x.id !== id)); setLastAction('Removed from the ledger.'); }, []);

    const reset = useCallback(() => {
        setTransactions(demoTransactions()); setPending(demoInbox()); setApproved([]); setRejected([]); setRules(demoRules()); setBudgets(demoBudgets()); setCommitments(demoCommitments()); setGoals(demoGoals()); setLastAction(null);
    }, []);

    const value = useMemo<DemoState>(() => ({
        input: {
            transactions, budgets, commitments, goals,
            pending: pending.map(({ id, merchant, description, amount, category, date, source }) => ({ id, merchant, description, amount, category, date, source })),
        },
        budgets, addBudget, removeBudget, updateBudget, commitments, updateCommitment, addCommitment, goals, addGoal, depositGoal, removeGoal, updateTx, deleteTx,
        inbox: { pending: withRules(pending, rules), approved, rejected }, rules,
        approve, dismiss, merge, bulk, addRule, toggleRule, removeRule, reset, lastAction,
    }), [transactions, budgets, addBudget, removeBudget, updateBudget, commitments, updateCommitment, addCommitment, goals, addGoal, depositGoal, removeGoal, updateTx, deleteTx, pending, approved, rejected, rules, approve, dismiss, merge, bulk, addRule, toggleRule, removeRule, reset, lastAction]);

    return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
    const ctx = useContext(DemoCtx);
    if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
    return ctx;
}
