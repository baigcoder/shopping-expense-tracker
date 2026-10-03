import { useState } from 'react';
import { 
    LayoutDashboard, 
    ArrowLeftRight, 
    Target, 
    BarChart3, 
    Brain,
    Check,
    CreditCard,
    TrendingUp,
    AlertCircle,
    Calendar,
    Sparkles,
    ShieldCheck,
    ArrowRight
} from 'lucide-react';

export type PillarId = 'home' | 'activity' | 'plan' | 'analyze' | 'assist';

interface PillarDef {
    id: PillarId;
    name: string;
    tagline: string;
    category: string;
    icon: any;
    narrative: string;
    highlights: string[];
}

const PILLARS: PillarDef[] = [
    {
        id: 'home',
        name: 'Home',
        tagline: 'Command Center',
        category: 'PILLAR 01',
        icon: LayoutDashboard,
        narrative: 'Answers "What is happening right now, and what matters today?" within 5 seconds of opening the application.',
        highlights: [
            'Financial Pulse: Total Net Cash, Monthly Burn, and Discretionary Headroom',
            'Attention Rail: Live alerts for pending reviews, trial expirations, and bills',
            '14-Day Trajectory Curve comparing current burn rate to historical averages'
        ]
    },
    {
        id: 'activity',
        name: 'Activity',
        tagline: 'The Money Stream',
        category: 'PILLAR 02',
        icon: ArrowLeftRight,
        narrative: 'A quiet staging ground where unposted browser captures wait for approval, feeding an authoritative, immutable ledger.',
        highlights: [
            'Needs Review Inbox: Triage browser captures with 1-click approvals',
            'Canonical Ledger: High-performance search, filtering, and tag management',
            'Statement Imports: Drag-and-drop CSV parser and PDF OCR extractor'
        ]
    },
    {
        id: 'plan',
        name: 'Plan',
        tagline: 'Commitments & Headroom',
        category: 'PILLAR 03',
        icon: Target,
        narrative: 'Answers "What is already spoken for?" by unifying software subscriptions, utility bills, rent, and budget velocity into one schedule.',
        highlights: [
            'Unified Commitments: Consolidated schedule for SaaS, utilities, and rent',
            'Velocity Pace Budgets: Proactive alerts when spending outpaces calendar days',
            'Milestone Goals: Dynamic calculation of required monthly funding'
        ]
    },
    {
        id: 'analyze',
        name: 'Analyze',
        tagline: 'Decision Intelligence',
        category: 'PILLAR 04',
        icon: BarChart3,
        narrative: 'Question-oriented analytics that reveal where capital went, merchant concentration, and digital checkout versus POS terminal splits.',
        highlights: [
            'Where is money going? Dynamic category volume and merchant breakdowns',
            'Am I spending faster? Continuous velocity burn curves vs prior periods',
            'Channel split: 64% Digital Checkout vs 36% Physical In-Store POS'
        ]
    },
    {
        id: 'assist',
        name: 'Assist',
        tagline: 'Embedded Co-Pilot',
        category: 'PILLAR 05',
        icon: Brain,
        narrative: 'A grounded financial co-pilot connected directly to verified numbers, generating structured, clickable action buttons to execute decisions.',
        highlights: [
            'Weekly Coach: 3 bite-sized, high-impact habit tasks tailored each week',
            'Pattern Detection: Contextual advice grounded in approved ledger numbers',
            'Executable Action Chips: Instant links to adjust budgets or review candidates'
        ]
    }
];

export default function PillarOrbit() {
    const [selectedPillar, setSelectedPillar] = useState<PillarId>('home');
    const activePillar = PILLARS.find((p) => p.id === selectedPillar) || PILLARS[0];

    return (
        <div className="space-y-12">
            {/* The Ecosystem Architecture Navigation Hub */}
            <div className="rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-6 sm:p-8 shadow-sm">
                <div className="text-center max-w-xl mx-auto mb-8">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
                        The Interconnected Ecosystem
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-[#142127]">
                        Five specialized pillars. One unified database.
                    </h3>
                </div>

                {/* Ecosystem Radial / Orbital Switcher */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
                    {PILLARS.map((pillar) => {
                        const Icon = pillar.icon;
                        const isSelected = pillar.id === selectedPillar;
                        return (
                            <button
                                key={pillar.id}
                                onClick={() => setSelectedPillar(pillar.id)}
                                className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200 ${
                                    isSelected
                                        ? 'border-[var(--color-brand)] bg-gradient-to-b from-[var(--color-brand-soft)] to-white shadow-md -translate-y-1'
                                        : 'border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] text-[#56656A] hover:bg-white hover:text-[#142127]'
                                }`}
                            >
                                <span className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2 transition-colors ${
                                    isSelected ? 'bg-[var(--color-brand)] text-white shadow-xs' : 'bg-white text-[#56656A] border border-[var(--color-border,#E2E8F0)]'
                                }`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className={`font-display text-sm font-bold ${
                                    isSelected ? 'text-[#142127]' : 'text-[#56656A]'
                                }`}>
                                    {pillar.name}
                                </span>
                                <span className="text-[11px] text-[#56656A] mt-0.5 line-clamp-1">
                                    {pillar.tagline}
                                </span>
                                {isSelected && (
                                    <span className="absolute -top-1.5 right-2 rounded-full bg-[var(--color-brand)] px-1.5 py-0.2 text-[8px] font-bold text-white uppercase tracking-wider">
                                        ACTIVE
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Pillar Deep-Dive Canvas */}
            <div className="rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-white p-6 sm:p-10 shadow-[0_4px_24px_rgba(20,33,39,0.06)]">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 items-center">
                    {/* Left: Pillar Overview & Philosophy */}
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                            <activePillar.icon className="h-3.5 w-3.5" />
                            <span>{activePillar.category}: {activePillar.tagline}</span>
                        </div>

                        <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1C1917]">
                            {activePillar.name} — {activePillar.tagline}
                        </h3>

                        <p className="text-base leading-relaxed text-[#57534E]">
                            {activePillar.narrative}
                        </p>

                        <div className="space-y-3 pt-2">
                            {activePillar.highlights.map((highlight, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                                        <Check className="h-2.5 w-2.5" />
                                    </div>
                                    <p className="text-sm font-medium text-[#1C1917]">{highlight}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Realistic Application Component Preview */}
                    <div className="rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] p-5 shadow-inner">
                        {renderPillarUIPreview(selectedPillar)}
                    </div>
                </div>
            </div>
        </div>
    );
}

{/* High-Fidelity UI Previews for Each of the 5 Pillars */}
function renderPillarUIPreview(pillarId: PillarId) {
    switch (pillarId) {
        case 'home':
            return (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-2.5">
                        <span className="font-display text-xs font-bold text-[#1C1917]">Financial Pulse & Attention Rail</span>
                        <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#059669] border border-[#E7E5E4]">
                            LIVE ENGINE
                        </span>
                    </div>

                    {/* Pulse Bento */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-lg border border-[#E7E5E4] bg-white p-3">
                            <span className="text-[10px] font-semibold text-[#78716C] uppercase">Net Discretionary Headroom</span>
                            <p className="mt-1 font-mono text-xl font-bold text-[#1C1917] tabular-nums">$2,840.00</p>
                            <p className="text-[10px] text-[#059669]">Unencumbered cash</p>
                        </div>
                        <div className="rounded-lg border border-[#E7E5E4] bg-white p-3">
                            <span className="text-[10px] font-semibold text-[#78716C] uppercase">Monthly Spend Velocity</span>
                            <p className="mt-1 font-mono text-xl font-bold text-[#1C1917] tabular-nums">$3,140.00</p>
                            <p className="text-[10px] text-[#D97706]">+4% vs 30-day average</p>
                        </div>
                    </div>

                    {/* Attention Rail Feed */}
                    <div className="rounded-lg border border-[#B8680B]/30 bg-[#FFF1DA]/60 p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#B8680B]">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Attention Rail Items (2)</span>
                        </div>
                        <p className="text-[#142127]">• 3 items in Review Inbox awaiting decision</p>
                        <p className="text-[#142127]">• Electric Utility ($142.50) due in 48 hours</p>
                    </div>
                </div>
            );

        case 'activity':
            return (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-2.5">
                        <span className="font-display text-xs font-bold text-[#142127]">Needs Review & Canonical Ledger</span>
                        <span className="rounded bg-[var(--color-brand-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-brand)] border border-[var(--color-brand)]/20">
                            STAGING QUEUE
                        </span>
                    </div>

                    {/* Unposted Item */}
                    <div className="rounded-lg border border-[var(--color-brand)]/30 bg-white p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand)] text-xs">
                                    FP
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-[#142127]">Foodpanda Delivery</p>
                                    <p className="text-[10px] text-[#56656A]">Staged 4m ago • Dining</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-mono text-xs font-bold text-[#142127]">Rs 1,240</span>
                                <span className="block text-[9px] font-semibold text-[var(--color-brand)]">[Approve ✓]</span>
                            </div>
                        </div>
                    </div>

                    {/* Canonical Posted Entry */}
                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3F4EA] text-[#17824F]">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-[#142127]">Amazon Prime • Subscription</p>
                                    <p className="text-[10px] text-[#56656A]">Canonical Ledger #8428 • Debit Card</p>
                                </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#142127]">-$14.99</span>
                        </div>
                    </div>
                </div>
            );

        case 'plan':
            return (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-2.5">
                        <span className="font-display text-xs font-bold text-[#142127]">Forward Commitments Schedule</span>
                        <span className="font-mono text-[10px] font-semibold text-[#56656A]">OCTOBER 2026</span>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#142127]">Apartment Rent</span>
                            <span className="font-mono font-bold text-[#142127]">$950.00 (Due 1st)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#142127]">Electric & Water</span>
                            <span className="font-mono font-bold text-[#142127]">$142.50 (Due Fri)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#142127]">Software Subscriptions (4)</span>
                            <span className="font-mono font-bold text-[#142127]">$78.90 (Scheduled)</span>
                        </div>
                    </div>

                    {/* Budget Pace Warning */}
                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-3">
                        <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#142127]">Dining Velocity Pace</span>
                            <span className="font-mono font-bold text-[#B8680B]">78% Used (Day 15)</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2,#E9ECE8)]">
                            <div className="h-full rounded-full bg-[#B8680B]" style={{ width: '78%' }} />
                        </div>
                        <p className="mt-1 text-[10px] text-[#B8680B]">⚠️ Spending faster than calendar day proportion</p>
                    </div>
                </div>
            );

        case 'analyze':
            return (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-2.5">
                        <span className="font-display text-xs font-bold text-[#142127]">Question-Driven Analytics</span>
                        <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#56656A] border border-[var(--color-border,#E2E8F0)]">
                            30-DAY WINDOW
                        </span>
                    </div>

                    {/* Channel Breakdown */}
                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-[#142127]">Online vs Physical POS Channel Split</span>
                        </div>
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2,#E9ECE8)]">
                            <div className="bg-[var(--color-brand)]" style={{ width: '64%' }} />
                            <div className="bg-[#142127]" style={{ width: '36%' }} />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px]">
                            <span className="text-[var(--color-brand)] font-bold">64% Online Checkouts</span>
                            <span className="text-[#142127] font-bold">36% Physical POS</span>
                        </div>
                    </div>

                    {/* Merchant Concentration */}
                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-3 text-xs space-y-1.5">
                        <span className="font-semibold text-[#142127]">Top Discretionary Merchant</span>
                        <div className="flex items-center justify-between">
                            <span className="text-[#56656A]">Amazon Commerce</span>
                            <span className="font-mono font-bold text-[#142127]">$482.00 (28% of total)</span>
                        </div>
                    </div>
                </div>
            );

        case 'assist':
            return (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[var(--color-border,#E2E8F0)] pb-2.5">
                        <span className="font-display text-xs font-bold text-[#142127]">Weekly Coach & Actionable AI</span>
                        <span className="rounded-full bg-[#F1ECFF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7753C7]">
                            2 OF 3 DONE
                        </span>
                    </div>

                    {/* Contextual Action Notification */}
                    <div className="rounded-lg border border-[#7753C7]/30 bg-white p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#7753C7]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Contextual Pattern Observation</span>
                        </div>
                        <p className="mt-1 text-xs text-[#142127] leading-relaxed">
                            "Dining burn rate is running 34% elevated. Consider trimming weekend orders to protect $210 Friday utility headroom."
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded border border-[#7753C7]/30 bg-[#F1ECFF] px-2 py-0.5 text-[10px] font-bold text-[#7753C7]">
                                [Protect Headroom]
                            </span>
                            <span className="rounded border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] px-2 py-0.5 text-[10px] font-bold text-[#142127]">
                                [Review Ledger]
                            </span>
                        </div>
                    </div>

                    {/* Weekly Coach Habits */}
                    <div className="rounded-lg border border-[var(--color-border,#E2E8F0)] bg-white p-2.5 text-xs space-y-1 text-[#56656A]">
                        <p className="line-through text-[#A8A29E]">✓ Categorized 3 browser checkouts</p>
                        <p className="line-through text-[#A8A29E]">✓ Verified SaaS free-trial conversion</p>
                        <p className="font-semibold text-[#142127]">○ Allocate $50 to Emergency Goal</p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
