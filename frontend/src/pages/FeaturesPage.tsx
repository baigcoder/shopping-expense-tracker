import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    Bell,
    Brain,
    CalendarDays,
    CheckCircle2,
    Chrome,
    ClipboardList,
    FileText,
    Inbox,
    ReceiptText,
    Repeat,
    Settings,
    ShieldCheck,
    Sparkles,
    Target,
    UploadCloud,
    WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BRAND from '@/config/branding';

const featureGroups = [
    {
        title: 'Capture + Review',
        description: 'Automated detections land in a review layer first, so users stay in control before anything becomes final.',
        features: [
            {
                icon: Inbox,
                title: 'Transaction Inbox',
                description: 'Approve, reject, edit, or merge detected transactions before they enter the ledger.',
            },
            {
                icon: UploadCloud,
                title: 'Import Review Pipeline',
                description: 'Review parsed CSV, Excel, PDF, and document rows with confidence, row errors, and duplicate warnings.',
            },
            {
                icon: Chrome,
                title: 'Extension Auto-Detection',
                description: 'Browser detections can queue purchases into the inbox while Extension Health tracks sync issues.',
            },
            {
                icon: ReceiptText,
                title: 'Manual Transactions',
                description: 'Manual entries still save directly when the user wants fast, explicit transaction capture.',
            },
        ],
    },
    {
        title: 'Planning',
        description: 'Cashly organizes upcoming commitments, recurring costs, goals, and reminders into practical planning views.',
        features: [
            {
                icon: CalendarDays,
                title: 'Cashflow Calendar',
                description: 'See income, bills, subscriptions, goals, and predicted spending together on one timeline.',
            },
            {
                icon: Repeat,
                title: 'Subscription Command Center',
                description: 'Track recurring spend, trial reminders, price changes, unused subscription signals, and cost impact.',
            },
            {
                icon: Target,
                title: 'Budgets + Goals',
                description: 'Use budget and goal progress alongside transactions, reports, and AI coach recommendations.',
            },
            {
                icon: Bell,
                title: 'Bills + Reminders',
                description: 'Keep upcoming obligations visible so cashflow decisions include what is due next.',
            },
        ],
    },
    {
        title: 'Intelligence',
        description: 'AI and reports use backend-owned financial context, including approved data and optional pending candidates.',
        features: [
            {
                icon: FileText,
                title: 'Reports 2.0',
                description: 'Generate tax, category, merchant, subscription, and monthly summary reports with export history.',
            },
            {
                icon: Brain,
                title: 'AI Financial Coach',
                description: 'Get a weekly plan with three concrete actions for spending, savings, and bills or goals.',
            },
            {
                icon: Sparkles,
                title: 'Money Insights',
                description: 'Ask questions about spending patterns using refreshed financial context and user AI controls.',
            },
            {
                icon: ClipboardList,
                title: 'Smart Merchant Rules',
                description: 'Create deterministic rules such as merchant matching, category assignment, amount ranges, and priority.',
            },
        ],
    },
    {
        title: 'System',
        description: 'Operational views keep the automation understandable, debuggable, and user-controlled.',
        features: [
            {
                icon: Activity,
                title: 'Extension Health',
                description: 'Review tracked sites, queued syncs, failed detections, last sync, permission state, and recent errors.',
            },
            {
                icon: Settings,
                title: 'Backend Settings',
                description: 'Persist profile, notifications, sound, theme, currency, security actions, and AI preferences.',
            },
            {
                icon: ShieldCheck,
                title: 'Server-Side AI Controls',
                description: 'Live AI, memory, pending data inclusion, and cache refresh are controlled without exposing API keys.',
            },
            {
                icon: WalletCards,
                title: 'Consistent Currency',
                description: 'Currency preferences are shared through settings so money formatting stays consistent across the app.',
            },
        ],
    },
];

const workflowSteps = [
    'Create account and choose preferences',
    'Import, add, or detect transactions',
    'Review inbox candidates and apply rules',
    'Use calendar, reports, and coach actions',
];

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-white text-black">
            <nav className="sticky top-0 z-50 border-b-4 border-black bg-white">
                    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center bg-black text-white border-2 border-black shadow-[3px_3px_0_#E11D48]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <span className="hidden font-display text-lg font-black uppercase italic tracking-tight sm:inline sm:text-xl">{BRAND.name}</span>
                    </Link>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Home</span>
                            </Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" className="gap-1.5 px-2 sm:gap-2 sm:px-3">
                                <span className="hidden min-[430px]:inline">Create account</span>
                                <span className="min-[430px]:hidden">Join</span>
                                <ArrowRight className="hidden h-4 w-4 sm:block" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                <section className="border-b-4 border-black bg-black text-white">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-20">
                        <div className="flex flex-col justify-center">
                            <div className="mb-5 inline-flex w-fit items-center gap-2 border-2 border-[#E11D48] bg-[#E11D48]/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#E11D48]">
                                <CheckCircle2 className="h-4 w-4" />
                                Backend-owned finance workflows
                            </div>
                            <h1 className="font-display text-4xl font-black uppercase italic tracking-tight sm:text-5xl md:text-6xl">
                                Cashly Features
                            </h1>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-lg sm:leading-8 break-words" style={{ overflowWrap: 'anywhere' }}>
                                Cashly is built around review-first automation: detected data enters an inbox, rules make repeated decisions predictable, and AI works from refreshed financial context.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link to="/signup">
                                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                                        Create account
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Button asChild size="lg" className="w-full gap-2 bg-[#E11D48] border-2 border-[#E11D48] text-white shadow-[3px_3px_0_#FFFFFF] hover:bg-[#BE123C] hover:shadow-[4px_4px_0_#FFFFFF] sm:w-auto">
                                    <a href="/cashly-extension.zip">
                                        Install extension
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-hidden border-4 border-[#E11D48] bg-white p-4 sm:p-5 shadow-[10px_10px_0_#E11D48]">
                            <div className="min-w-0 bg-white text-black">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Review queue</p>
                                        <h2 className="text-2xl font-black uppercase italic">Pending automation</h2>
                                    </div>
                                    <Inbox className="h-8 w-8 text-[#E11D48]" />
                                </div>
                                <div className="space-y-3">
                                    {[
                                        ['Foodpanda', 'Food rule matched', 'High confidence'],
                                        ['Netflix', 'Subscription alert', 'Price check'],
                                        ['CSV import row 42', 'Duplicate warning', 'Needs review'],
                                    ].map(([title, meta, status]) => (
                                        <div key={title} className="flex flex-col gap-3 border-2 border-black p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="font-black uppercase">{title}</p>
                                                <p className="text-sm text-zinc-500 font-medium">{meta}</p>
                                            </div>
                                            <span className="w-fit border-2 border-black bg-[#E11D48] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white break-words">
                                                {status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b-4 border-black bg-[#F4F4F5]">
                    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            {workflowSteps.map((step, index) => (
                                <div key={step} className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0_#09090B]">
                                    <div className="mb-3 flex h-8 w-8 items-center justify-center bg-black text-sm font-black text-[#E11D48] border-2 border-black">
                                        {index + 1}
                                    </div>
                                    <p className="font-black uppercase tracking-wide">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {featureGroups.map((group, index) => (
                    <section key={group.title} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F4F4F5]'}>
                        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
                            <div className="mb-8 max-w-3xl">
                                <h2 className="font-display text-3xl font-black uppercase italic tracking-tight md:text-4xl">{group.title}</h2>
                                <p className="mt-3 text-zinc-600 font-medium">{group.description}</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {group.features.map((feature) => (
                                    <article key={feature.title} className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0_#09090B] transition-all hover:shadow-[6px_6px_0_#E11D48] hover:-translate-x-0.5 hover:-translate-y-0.5">
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center bg-black text-[#E11D48] border-2 border-black">
                                            <feature.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-black uppercase tracking-wide">{feature.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-zinc-600 font-medium">{feature.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}

                <section className="bg-black text-white border-t-4 border-black">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:py-14 md:flex-row md:items-center md:px-6">
                        <div>
                            <h2 className="font-display text-3xl font-black uppercase italic tracking-tight">Start with the review inbox.</h2>
                            <p className="mt-2 max-w-2xl text-zinc-400 font-medium">
                                Add transactions manually, import files, or connect the extension. Automated detections wait for approval before they affect reports and AI context.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <Link to="/signup">
                                <Button className="w-full gap-2 sm:w-auto">
                                    Create account
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="outline" className="w-full border-white bg-black text-white hover:bg-[#E11D48] hover:border-[#E11D48] sm:w-auto">
                                    Back home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t-4 border-black bg-white py-8">
                <div className="mx-auto max-w-7xl px-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 md:px-6">
                    © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default FeaturesPage;
