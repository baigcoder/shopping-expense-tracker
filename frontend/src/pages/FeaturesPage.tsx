import { Link } from 'react-router-dom';
import {
    Activity,
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
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import BRAND from '@/config/branding';

const featureGroups = [
    {
        title: 'Capture and review',
        description: 'Detections land in a review layer first, so you stay in control before anything becomes final.',
        features: [
            { icon: Inbox, title: 'Transaction inbox', description: 'Approve, reject, edit, or merge detected purchases before they enter the ledger.' },
            { icon: UploadCloud, title: 'Import review', description: 'Review parsed CSV, Excel, and PDF rows with confidence, errors, and duplicate warnings.' },
            { icon: Chrome, title: 'Extension capture', description: 'Browser detections queue into the inbox while Extension Health tracks sync issues.' },
            { icon: ReceiptText, title: 'Manual entries', description: 'Add a transaction yourself when you want something posted right away.' },
        ],
    },
    {
        title: 'Planning',
        description: 'Upcoming bills, recurring costs, goals, and reminders sit in one calm workspace.',
        features: [
            { icon: CalendarDays, title: 'Cashflow calendar', description: 'See income, bills, subscriptions, and predicted spending on one timeline.' },
            { icon: Repeat, title: 'Subscriptions', description: 'Track recurring spend, trials, price changes, and unused services.' },
            { icon: Target, title: 'Budgets and goals', description: 'Progress sits next to real transactions, not a separate spreadsheet.' },
            { icon: Bell, title: 'Bills and reminders', description: 'Keep what is due next visible so cashflow decisions stay honest.' },
        ],
    },
    {
        title: 'Intelligence',
        description: 'AI and reports use backend-owned financial context, including approved data and optional pending candidates.',
        features: [
            { icon: FileText, title: 'Reports', description: 'Generate tax, category, merchant, and monthly summaries with export history.' },
            { icon: Brain, title: 'AI coach', description: 'A weekly plan with a few concrete actions for spending, savings, and bills.' },
            { icon: Sparkles, title: 'Money insights', description: 'Ask questions about spending using refreshed financial context.' },
            { icon: ClipboardList, title: 'Merchant rules', description: 'Match a store, assign a category, and skip the inbox when you trust it.' },
        ],
    },
    {
        title: 'System',
        description: 'Operational views keep the automation understandable and user-controlled.',
        features: [
            { icon: Activity, title: 'Extension health', description: 'Tracked sites, queued syncs, failed detections, and recent errors.' },
            { icon: Settings, title: 'Settings', description: 'Profile, notifications, currency, security, and AI preferences in one place.' },
            { icon: ShieldCheck, title: 'Server-side AI', description: 'Live AI, memory, and pending-data inclusion without exposing API keys.' },
            { icon: WalletCards, title: 'Consistent currency', description: 'Your currency preference formats money the same way across the app.' },
        ],
    },
];

const workflowSteps = [
    'Create an account and choose preferences',
    'Import, add, or detect transactions',
    'Review inbox candidates and apply rules',
    'Use the calendar, reports, and coach',
];

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
            <MarketingNav />
            <main>
                <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#E11D48]">
                            <CheckCircle2 className="h-4 w-4" />
                            Review-first workflows
                        </p>
                        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Everything in Cashly</h1>
                        <p className="mt-4 max-w-xl text-[#57534E] leading-relaxed">
                            Detected data enters an inbox, rules make repeated decisions predictable, and AI works from refreshed financial context.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg">
                                <Link to="/signup">
                                    Create account
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <a href="/cashly-extension.zip">Install extension</a>
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-md)]">
                        <p className="text-xs font-medium text-[#78716C]">Review queue</p>
                        <h2 className="mt-1 font-display text-xl font-semibold">Pending automation</h2>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Foodpanda', 'Food rule matched', 'High confidence'],
                                ['Netflix', 'Subscription alert', 'Price check'],
                                ['CSV import row 42', 'Duplicate warning', 'Needs review'],
                            ].map(([title, meta, status]) => (
                                <div key={title} className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-3.5 py-3">
                                    <div>
                                        <p className="text-sm font-medium">{title}</p>
                                        <p className="text-xs text-[#78716C]">{meta}</p>
                                    </div>
                                    <span className="rounded-full bg-[#FFE4E6] px-2.5 py-1 text-[11px] font-medium text-[#E11D48]">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-[#E7E5E4] bg-[#F4F0EB]">
                    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
                        {workflowSteps.map((step, index) => (
                            <div key={step} className="rounded-2xl border border-[#E7E5E4] bg-white p-4">
                                <p className="text-sm font-medium text-[#E11D48]">{index + 1}</p>
                                <p className="mt-2 text-sm font-medium leading-snug">{step}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {featureGroups.map((group) => (
                    <section key={group.title} className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{group.title}</h2>
                        <p className="mt-2 max-w-2xl text-[#57534E]">{group.description}</p>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {group.features.map((feature) => (
                                <article key={feature.title} className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-sm)]">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-display font-semibold">{feature.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
            <MarketingFooter />
            <p className="sr-only">{BRAND.name}</p>
        </div>
    );
};

export default FeaturesPage;
