// /demo: the real app shell and screens, fed with sample data and walked through by the guide.
import { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
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
import { ReportsView } from '../reports/ReportsView';
import { CardsView, type AccountRow, type CardRow } from '../cards/CardsView';
import { ExtensionView } from '../extension/ExtensionView';
import { SettingsView, type SettingsPrefs } from '../settings/SettingsView';
import { SUPPORTED_CURRENCIES } from '@/services/currencyService';
import { toast } from 'sonner';
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

function DemoReports() {
    const { input } = useDemo();
    return <ReportsView transactions={input.transactions} money={money} now={DEMO_NOW} />;
}

// Sample accounts and cards live only in this screen; Reset on the tour reloads them with the page.
const DEMO_ACCOUNTS: AccountRow[] = [
    { id: 'a1', name: 'Salary account', bank: 'Meezan Bank', type: 'checking', balance: 182400 },
    { id: 'a2', name: 'Savings', bank: 'HBL', type: 'savings', balance: 240000 },
    { id: 'a3', name: 'Cash at home', bank: '', type: 'cash', balance: 12000 },
    { id: 'a4', name: 'Credit card', bank: 'Alfalah', type: 'credit', balance: 38750 },
];
const DEMO_CARDS: CardRow[] = [
    { id: 'c1', name: 'Everyday card', brand: 'visa', last4: '4021', expiry: '08/28', limit: 60000, primary: true },
    { id: 'c2', name: 'Online shopping', brand: 'mastercard', last4: '7716', expiry: '02/27', limit: 15000 },
];

function DemoCards() {
    const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);
    const [cards, setCards] = useState(DEMO_CARDS);
    const patch = (id: string, p: Partial<CardRow>) => setCards((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)));
    return (
        <CardsView accounts={accounts} cards={cards} money={money}
            onSaveAccount={(d, id) => setAccounts((l) => (id ? l.map((a) => (a.id === id ? { ...d, id } : a)) : [...l, { ...d, id: `a${Date.now()}` }]))}
            onRemoveAccount={(id) => setAccounts((l) => l.filter((a) => a.id !== id))}
            onAddCard={() => setCards((l) => [...l, { id: `c${Date.now()}`, name: 'New card', brand: 'visa', last4: String(1000 + l.length * 1111).slice(-4), expiry: '12/29' }])}
            onFreeze={(id, frozen) => patch(id, { frozen })}
            onPrimary={(id) => setCards((l) => l.map((c) => ({ ...c, primary: c.id === id })))}
            onLimit={(id, limit) => patch(id, { limit })}
            onRemoveCard={(id) => setCards((l) => l.filter((c) => c.id !== id))} />
    );
}

function DemoExtension() {
    const [checking, setChecking] = useState(false);
    const at = (minutesAgo: number) => new Date(DEMO_NOW.getTime() - minutesAgo * 60000).toISOString();
    return (
        <ExtensionView state="connected" lastSync={at(4)} queued={0} failed={1} now={DEMO_NOW} checking={checking}
            onCheck={() => { setChecking(true); setTimeout(() => setChecking(false), 600); }}
            sites={[
                { hostname: 'daraz.pk', name: 'Daraz', visits: 14, caught: 6, lastSeen: at(4) },
                { hostname: 'foodpanda.pk', name: 'Foodpanda', visits: 9, caught: 5, lastSeen: at(95) },
                { hostname: 'open.spotify.com', name: 'Spotify', visits: 3, caught: 1, lastSeen: at(60 * 26) },
                { hostname: 'paypro.com.pk', visits: 1, caught: 1, lastSeen: at(60 * 30) },
            ]}
            events={[
                { id: 'e1', type: 'capture', status: 'success', message: 'Caught a Daraz checkout for Rs 8,499', site: 'daraz.pk', at: at(4) },
                { id: 'e2', type: 'capture', status: 'success', message: 'Caught a Foodpanda order for Rs 3,260', site: 'foodpanda.pk', at: at(95) },
                { id: 'e3', type: 'capture', status: 'error', message: 'Could not read the total on this page', site: 'paypro.com.pk', at: at(60 * 30) },
                { id: 'e4', type: 'sync', status: 'success', message: 'Signed in as Ayesha', at: at(60 * 72) },
            ]} />
    );
}

function DemoSettings() {
    const [name, setName] = useState(DEMO_USER.name);
    const [prefs, setPrefs] = useState<SettingsPrefs>({
        currency: 'PKR', theme: 'light', soundEnabled: true, reducedMotion: false, emailNotifications: true, weeklyReport: true,
        aiLiveEnabled: true, aiMemoryEnabled: true, aiIncludePendingCandidates: true,
    });
    const update = (u: Partial<SettingsPrefs>) => setPrefs((p) => ({ ...p, ...u }));
    const noAccount = () => toast('The demo has no account. Create one to use this.');
    return (
        <SettingsView key={name} name={name} email="ayesha@cashly.app" prefs={prefs} currencies={SUPPORTED_CURRENCIES}
            onSaveName={async (n) => setName(n)} onPref={update} onAI={update} onClearChat={async () => { toast('Conversation cleared'); }}
            onPasswordReset={noAccount} onSignOut={noAccount}
            onRequestCode={async () => { noAccount(); return false; }} onConfirmDelete={async () => false} />
    );
}

function DemoShell() {
    const { input } = useDemo();
    const navigate = useNavigate();
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
                <Route path="reports" element={<DemoReports />} />
                <Route path="cards" element={<DemoCards />} />
                <Route path="extension-health" element={<DemoExtension />} />
                <Route path="settings" element={<DemoSettings />} />
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
