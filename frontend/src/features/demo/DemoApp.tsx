// /demo: the real app shell and screens, fed with sample data and walked through by the guide.
import { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AppShell, appNav } from '@/components/app/AppShell';
import { HomeView } from '../home/HomeView';
import { InboxView, type InboxStatus } from '../inbox/InboxView';
import { BudgetsView } from '../budgets/BudgetsView';
import { buildBudgets } from '../budgets/budgetModel';
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
                    <p>You are in the demo. Sample data, nothing is saved.</p>
                    <Link to="/signup" className="font-semibold underline underline-offset-4">Create a free account</Link>
                </div>
            }
        >
            <Routes>
                <Route path="dashboard" element={<DemoHome />} />
                <Route path="transaction-inbox" element={<DemoInbox />} />
                <Route path="budgets" element={<DemoBudgets />} />
                {screens.filter((s) => !['/transaction-inbox', '/budgets'].includes(s.to)).map((s) => (
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
