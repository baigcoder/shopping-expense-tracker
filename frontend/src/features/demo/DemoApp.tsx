// /demo: the real app shell and screens, fed with sample data and walked through by the guide.
import { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppShell, appNav } from '@/components/app/AppShell';
import { HomeView } from '../home/HomeView';
import { InboxView, type InboxStatus } from '../inbox/InboxView';
import { BudgetsView } from '../budgets/BudgetsView';
import { buildBudgets } from '../budgets/budgetModel';
import { CommitmentsView, type CommitmentTab } from '../commitments/CommitmentsView';
import { buildCommitments } from '../commitments/commitmentsModel';
import { GoalsView } from '../goals/GoalsView';
import { buildGoals } from '../goals/goalsModel';
import { AssistView, type ChatMessage, type PlanAction } from '../assist/AssistView';
import { linkFor } from '../assist/linkFor';
import { demoAnswer } from './demoAnswers';
import { TwinView } from '../twin/TwinView';
import { ActivityView } from '../activity/ActivityView';
import { CalendarView } from '../calendar/CalendarView';
import { SpendingView } from '../spending/SpendingView';
import { TransactionSideSheet } from '@/components/TransactionSideSheet';
import type { SupabaseTransaction } from '@/services/supabaseTransactionService';
import { buildHomeModel } from '../home/homeModel';
import { DemoProvider, useDemo } from './DemoContext';
import { DemoGuide } from './DemoGuide';
import { DEMO_NOW, DEMO_USER } from './demoData';
import { formatCurrency } from '@/services/currencyService';

const money = (n: number) => formatCurrency(n, 'PKR');

function DemoHome() {
    const { input, approve, dismiss } = useDemo();
    const model = useMemo(() => buildHomeModel({ ...input, now: DEMO_NOW }), [input]);
    return (
        <HomeView
            model={model}
            firstName={DEMO_USER.firstName}
            money={money}
            basePath="/demo"
            onApprove={approve}
            onDismiss={dismiss}
            onAdd={() => undefined}
        />
    );
}

function DemoInbox() {
    const { inbox, rules, approve, dismiss, merge, bulk, addRule } = useDemo();
    const [status, setStatus] = useState<InboxStatus>('pending');
    return (
        <InboxView items={inbox[status]} rules={rules} status={status} money={money} onStatus={setStatus}
            onApprove={approve} onReject={dismiss} onMerge={merge} onBulk={bulk} onAddRule={addRule} />
    );
}

function DemoBudgets() {
    const { budgets, input, addBudget, removeBudget } = useDemo();
    const model = useMemo(() => buildBudgets(budgets, input.transactions, DEMO_NOW), [budgets, input.transactions]);
    return <BudgetsView model={model} money={money} onAdd={addBudget} onRemove={(l) => removeBudget(l.id)} />;
}

function DemoCommitments() {
    const { commitments, updateCommitment, addCommitment } = useDemo();
    const [tab, setTab] = useState<CommitmentTab>('all');
    const model = useMemo(() => buildCommitments(commitments, DEMO_NOW), [commitments]);
    return (
        <CommitmentsView model={model} tab={tab} money={money} onTab={setTab}
            onToggle={(l) => updateCommitment(l.id, { active: !l.active, isTrial: l.active ? false : l.isTrial })}
            onPaid={(l) => updateCommitment(l.id, { paid: true })}
            onRemove={(l) => updateCommitment(l.id, null)}
            onAdd={(c) => {
                const start = new Date(c.date);
                if (c.isTrial) start.setDate(start.getDate() + c.trialDays);
                addCommitment({ id: `c-${Date.now()}`, kind: c.kind, name: c.name, category: c.category, amount: c.amount, cycle: c.cycle, nextDate: start.toISOString().slice(0, 10), active: true, isTrial: c.isTrial, paid: false });
            }} />
    );
}

function DemoGoals() {
    const { goals, addGoal, depositGoal, removeGoal } = useDemo();
    const model = useMemo(() => buildGoals(goals, DEMO_NOW), [goals]);
    return <GoalsView model={model} money={money} onAdd={addGoal} onDeposit={(g, n) => depositGoal(g.id, n)} onRemove={(g) => removeGoal(g.id)} />;
}

const DEMO_PLAN: PlanAction[] = [
    { id: 'a1', title: 'Cancel Adobe Express before the trial ends', status: 'pending' },
    { id: 'a2', title: 'Keep eating out under Rs 4,000 this week', status: 'pending' },
    { id: 'a3', title: 'Move Rs 10,000 to the laptop goal', status: 'pending' },
];

function DemoAssist() {
    const { input, budgets, commitments } = useDemo();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [plan, setPlan] = useState<PlanAction[] | null>(null);
    const home = useMemo(() => buildHomeModel({ ...input, now: DEMO_NOW }), [input]);
    const budgetModel = useMemo(() => buildBudgets(budgets, input.transactions, DEMO_NOW), [budgets, input.transactions]);
    const bills = useMemo(() => buildCommitments(commitments, DEMO_NOW), [commitments]);
    const insights = [
        ...bills.trials.map((t) => ({ id: t.id, title: `${t.name} starts charging in ${t.daysUntil} days`, message: `${money(t.amount)} a month after the free trial.`, path: '/subscriptions', urgent: true })),
        ...budgetModel.lines.filter((l) => l.pace !== 'ok').map((l) => ({ id: l.id, title: `${l.category} is running fast`, message: `Heading for ${money(l.projected)} against ${money(l.amount)}.`, path: '/budgets' })),
    ];
    return (
        <AssistView basePath="/demo" messages={messages} sending={sending} insights={insights}
            suggestions={['Can I afford a Rs 30,000 phone?', 'Where did my money go this month?', 'Which subscriptions should I cancel?']}
            onSend={(q) => {
                setMessages((m) => [...m, { role: 'user', text: q }]);
                setSending(true);
                window.setTimeout(() => {
                    const a = demoAnswer(q, home, budgetModel, bills, money);
                    setMessages((m) => [...m, { role: 'assistant', text: a, link: linkFor(a) }]);
                    setSending(false);
                }, 650);
            }}
            plan={plan} onMakePlan={() => setPlan(DEMO_PLAN)}
            onToggle={(a) => setPlan((p) => p?.map((x) => (x.id === a.id ? { ...x, status: x.status === 'done' ? 'pending' : 'done' } : x)) ?? p)} />
    );
}

function DemoTwin() {
    const { input, commitments } = useDemo();
    const charges = useMemo(() => buildCommitments(commitments, DEMO_NOW).lines.map((l) => ({
        id: l.id, name: l.name, amount: l.amount, daysUntil: l.daysUntil, cycle: l.cycle, kind: l.kind, active: l.active && !l.paid, isTrial: l.isTrial,
    })), [commitments]);
    return (
        <TwinView transactions={input.transactions} charges={charges} money={money} now={DEMO_NOW}
            alerts={[{ id: 'w1', title: 'Rent lands in 16 days', message: 'Keep about Rs 65,000 free until then.', urgent: false }]} />
    );
}

function DemoActivity() {
    const { input, updateTx, deleteTx } = useDemo();
    const [open, setOpen] = useState<SupabaseTransaction | null>(null);
    const rows = useMemo(() => input.transactions.map((t) => ({ ...t, user_id: 'demo', created_at: t.date })), [input.transactions]);
    return (
        <>
            <ActivityView transactions={rows} money={money} now={DEMO_NOW} onOpen={(t) => setOpen(t as SupabaseTransaction)} />
            <TransactionSideSheet transaction={open} open={open !== null} onOpenChange={(o) => !o && setOpen(null)}
                onUpdate={async (u) => { updateTx(u); setOpen(null); }} onDelete={async (id) => { deleteTx(id); setOpen(null); }} />
        </>
    );
}

function DemoCalendar() {
    const { input, commitments } = useDemo();
    const charges = useMemo(() => commitments.map((c) => ({ ...c, active: c.active && !c.paid })), [commitments]);
    return <CalendarView transactions={input.transactions} charges={charges} money={money} now={DEMO_NOW} />;
}

function DemoSpending() {
    const { input } = useDemo();
    return <SpendingView transactions={input.transactions} money={money} now={DEMO_NOW} />;
}

// Screens not yet rebuilt on the shared views say what they do instead of showing a fake.
function DemoScreenNote({ label }: { label: string }) {
    return (
        <section className="rounded-[20px] bg-[var(--color-surface)] p-8">
            <h1 className="font-display text-[28px] font-bold tracking-tight">{label}</h1>
            <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">
                This screen is part of the full app. Follow the tour on Home to see how it fits in, or create a free account to use it with your own money.
            </p>
            <Link to="/demo/dashboard" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 text-[15px] font-semibold text-white">
                Back to Home <ArrowRight size={16} />
            </Link>
        </section>
    );
}

function DemoShell() {
    const { input } = useDemo();
    const navigate = useNavigate();
    const screens = appNav(0).flatMap((g) => g.items).filter((i) => i.to !== '/dashboard');
    return (
        <AppShell
            basePath="/demo"
            userName={DEMO_USER.name}
            userDetail={DEMO_USER.detail}
            inboxCount={input.pending.length}
            onSignOut={() => navigate('/')}
            signOutLabel="Leave the demo"
            banner={
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-ink)] px-4 py-2.5 text-[14px] text-white sm:px-6 lg:px-10">
                    <p>Demo · sample data</p>
                    <Link to="/signup" className="font-semibold underline underline-offset-4">Create a free account</Link>
                </div>
            }
        >
            <Routes>
                <Route path="dashboard" element={<DemoHome />} />
                <Route path="transaction-inbox" element={<DemoInbox />} />
                <Route path="budgets" element={<DemoBudgets />} />
                <Route path="subscriptions" element={<DemoCommitments />} />
                <Route path="goals" element={<DemoGoals />} />
                <Route path="insights" element={<DemoAssist />} />
                <Route path="money-twin" element={<DemoTwin />} />
                <Route path="transactions" element={<DemoActivity />} />
                <Route path="cashflow-calendar" element={<DemoCalendar />} />
                <Route path="analytics" element={<DemoSpending />} />
                {screens.filter((s) => !['/transaction-inbox', '/budgets', '/subscriptions', '/goals', '/insights', '/money-twin', '/transactions', '/cashflow-calendar', '/analytics'].includes(s.to)).map((s) => (
                    <Route key={s.to} path={s.to.slice(1)} element={<DemoScreenNote label={s.label} />} />
                ))}
                <Route path="*" element={<Navigate to="/demo/dashboard" replace />} />
            </Routes>
            <DemoGuide />
        </AppShell>
    );
}

export default function DemoApp() {
    return (
        <DemoProvider>
            <DemoShell />
        </DemoProvider>
    );
}
