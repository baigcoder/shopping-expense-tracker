import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Target,
    BarChart3,
    Sparkles,
    CreditCard,
    Activity,
    Settings,
    ArrowRight,
    Check,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    ShieldCheck,
    AlertTriangle,
    ShoppingBag,
    Lock,
    Zap,
    Plus,
    X,
    Inbox,
    CheckCircle2,
    Clock,
    Repeat,
    PiggyBank,
    Eye,
    EyeOff,
    ExternalLink,
    Sliders,
    Globe,
    Terminal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { CashlyMark } from '@/components/brand/CashlyLogo';
import { useLandingSettings, LandingCurrency } from '@/components/landing/useLandingSettings';
import { soundManager } from '@/lib/sounds';

interface StagedTransaction {
    id: string;
    merchant: string;
    item: string;
    amount: number;
    category: string;
    source: string;
    storeId: string;
    date: string;
}

interface ApprovedTransaction {
    id: string;
    merchant: string;
    details: string;
    amount: number;
    category: string;
    source: string;
    date: string;
}

const INITIAL_STAGED: StagedTransaction[] = [
    {
        id: 'staged-1',
        merchant: 'Amazon Electronics',
        item: 'Sony WH-1000XM5 Wireless Headphones',
        amount: 34990,
        category: 'Electronics • Discretionary',
        source: 'Extension Intercept',
        storeId: 'amazon',
        date: 'Just now',
    },
    {
        id: 'staged-2',
        merchant: 'Foodpanda PK',
        item: 'Team Gourmet Lunch & Beverages',
        amount: 1850,
        category: 'Dining • Discretionary',
        source: 'Extension Intercept',
        storeId: 'foodpanda',
        date: '42m ago',
    },
    {
        id: 'staged-3',
        merchant: 'Gymshark App',
        item: 'Seamless Compression Training Set',
        amount: 4200,
        category: 'Apparel • Discretionary',
        source: 'Extension Intercept',
        storeId: 'shopify',
        date: '2h ago',
    },
];

const INITIAL_APPROVED: ApprovedTransaction[] = [
    {
        id: 'app-1',
        merchant: 'Whole Foods Market',
        details: 'Weekly Organic Groceries & Provisions',
        amount: 14800,
        category: 'Groceries',
        source: 'Manual Card',
        date: 'Yesterday, 4:15 PM',
    },
    {
        id: 'app-2',
        merchant: 'K-Electric Utility',
        details: 'Monthly Commercial Electricity Bill',
        amount: 18200,
        category: 'Utilities',
        source: 'Bank Direct',
        date: 'Oct 04, 2026',
    },
    {
        id: 'app-3',
        merchant: 'DigitalOcean Cloud',
        details: 'App Production Cluster Hosting',
        amount: 3400,
        category: 'Subscriptions',
        source: 'Recurring Auto',
        date: 'Oct 02, 2026',
    },
    {
        id: 'app-4',
        merchant: 'Shell Mobility',
        details: 'Commute Vehicle Fuel Refill',
        amount: 4500,
        category: 'Transport',
        source: 'Debit Card',
        date: 'Sep 29, 2026',
    },
];

const STORES = [
    { id: 'amazon', name: 'amazon.com', item: 'Sony WH-1000XM5 Wireless Headphones', price: 34990, cat: 'Electronics' },
    { id: 'shopify', name: 'gymshark.com', item: 'Seamless Compression Training Set', price: 4200, cat: 'Apparel' },
    { id: 'uber', name: 'uber.com', item: 'Airport Premium Comfort Transit', price: 950, cat: 'Transit' },
    { id: 'foodpanda', name: 'foodpanda.pk', item: 'Team Gourmet Lunch & Beverages', price: 1850, cat: 'Dining' },
];

export default function DemoOSPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currency, setCurrency, formatAmount, playSound, acoustic, setAcoustic } = useLandingSettings();

    // Active subpage tab
    const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'plan' | 'money-twin' | 'assist' | 'cards' | 'extension'>('home');
    const [activitySubTab, setActivitySubTab] = useState<'inbox' | 'ledger'>('inbox');

    // Live financial telemetry in demo
    const [stagedList, setStagedList] = useState<StagedTransaction[]>(INITIAL_STAGED);
    const [approvedList, setApprovedList] = useState<ApprovedTransaction[]>(INITIAL_APPROVED);
    const [baseSafeToSpend, setBaseSafeToSpend] = useState(42870);
    const [baseRunwayDays, setBaseRunwayDays] = useState(42);
    const [showNumbers, setShowNumbers] = useState(true);

    // Extension simulator modal state
    const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
    const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
    const [extensionApproved, setExtensionApproved] = useState(false);

    // Check search params on mount
    useEffect(() => {
        const ext = searchParams.get('ext');
        if (ext === 'open') {
            setIsExtensionModalOpen(true);
        }
        const tab = searchParams.get('tab');
        if (tab && ['home', 'activity', 'plan', 'money-twin', 'assist', 'cards', 'extension'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // Runway simulator restraint in Money Twin / Home
    const [restraintOffset, setRestraintOffset] = useState(200);

    // AI Action chips executed
    const [executedActions, setExecutedActions] = useState<{ [key: string]: boolean }>({});

    // Mobile sidebar drawer
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

    // Dynamic metrics
    const safeToSpend = useMemo(() => {
        let val = baseSafeToSpend;
        if (executedActions['vault-surplus']) val -= 3000;
        return Math.max(0, val);
    }, [baseSafeToSpend, executedActions]);

    const runwayDays = useMemo(() => {
        let r = baseRunwayDays + Math.round(restraintOffset / 20);
        if (executedActions['vault-surplus']) r += 3;
        return r;
    }, [baseRunwayDays, restraintOffset, executedActions]);

    // Deficit Collision Radar state
    const hasDeficitAlert = restraintOffset === 0;

    // Handle approving an item from the review inbox
    const handleApproveStaged = useCallback((item: StagedTransaction) => {
        playSound('success');
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
        toast.success(`Approved & Reconciled: ${item.item}`, {
            description: `Posted to Canonical Double-Entry Ledger (${formatAmount(item.amount)})`,
        });

        setStagedList((prev) => prev.filter((s) => s.id !== item.id));
        setApprovedList((prev) => [
            {
                id: `app-gen-${Date.now()}`,
                merchant: item.merchant,
                details: item.item,
                amount: item.amount,
                category: item.category.split('•')[0].trim(),
                source: 'Extension Verified',
                date: 'Just now',
            },
            ...prev,
        ]);

        setBaseSafeToSpend((prev) => Math.max(0, prev - item.amount));
        setBaseRunwayDays((prev) => Math.max(12, prev - Math.round(item.amount / 4000)));
    }, [playSound, formatAmount]);

    // Handle dismissing / holding a staged item
    const handleDismissStaged = useCallback((id: string) => {
        playSound('click');
        setStagedList((prev) => prev.filter((s) => s.id !== id));
        toast.info('Item deferred to next billing cycle review');
    }, [playSound]);

    // Handle approving from the real Extension Simulator Modal
    const handleApproveFromExtensionModal = useCallback(() => {
        const store = STORES[selectedStoreIndex];
        setExtensionApproved(true);
        playSound('success');
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
        toast.success(`⚡ Intercepted & Cleared: ${store.item}`, {
            description: `Pre-swipe checkout synced to Cashly ledger (${formatAmount(store.price)})`,
        });

        // Add to approved ledger
        setApprovedList((prev) => [
            {
                id: `ext-sync-${Date.now()}`,
                merchant: store.name,
                details: store.item,
                amount: store.price,
                category: store.cat,
                source: 'Companion Intercept',
                date: 'Just now (Real-time)',
            },
            ...prev,
        ]);

        // Reduce safe-to-spend
        setBaseSafeToSpend((prev) => Math.max(0, prev - store.price));
        setBaseRunwayDays((prev) => Math.max(12, prev - Math.round(store.price / 4000)));
    }, [selectedStoreIndex, playSound, formatAmount]);

    // Reset Demo to initial pristine state
    const handleResetDemo = useCallback(() => {
        playSound('click');
        setStagedList(INITIAL_STAGED);
        setApprovedList(INITIAL_APPROVED);
        setBaseSafeToSpend(42870);
        setBaseRunwayDays(42);
        setRestraintOffset(200);
        setExecutedActions({});
        setExtensionApproved(false);
        toast.success('Demo environment reset to baseline telemetry');
    }, [playSound]);

    // Handle AI Action Chip Execution
    const handleExecuteAiAction = useCallback((actionKey: string, toastMsg: string) => {
        playSound('success');
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
        setExecutedActions((prev) => ({ ...prev, [actionKey]: true }));
        toast.success(toastMsg);
    }, [playSound]);

    // Navigation Switcher
    const handleNav = (tab: typeof activeTab) => {
        playSound('click');
        setActiveTab(tab);
        setSidebarMobileOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F4F3EE] text-[#111111] font-sans flex flex-col selection:bg-[#EE5024] selection:text-white">
            
            {/* ═══════════════════════════════════════════════════════════
                TOP DEMO AMBIENT CONTROL BAR
                ═══════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-[#111111] text-white border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                        <CashlyMark size={24} variant="orange" />
                        <span className="font-bold tracking-tight text-sm font-display">CASHLY OS</span>
                    </Link>
                    <span className="hidden sm:inline-block w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE INTERACTIVE DEMO</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Live Currency Selector */}
                    <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/15 text-[11px] font-mono font-bold">
                        {(['PKR', 'USD', 'EUR', 'GBP', 'INR'] as LandingCurrency[]).map((cur) => (
                            <button
                                key={cur}
                                type="button"
                                onClick={() => setCurrency(cur)}
                                className={`px-2 py-0.5 rounded-full transition-all whitespace-nowrap ${
                                    currency === cur
                                        ? 'bg-[#EE5024] text-white shadow-xs'
                                        : 'text-white/70 hover:text-white'
                                }`}
                            >
                                {cur === 'PKR' ? 'Rs ' : cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£'}{cur}
                            </button>
                        ))}
                    </div>

                    {/* Button to Open Extension Simulator */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsExtensionModalOpen(true);
                            setExtensionApproved(false);
                            playSound('click');
                        }}
                        className="bg-gradient-to-r from-[#EE5024] to-[#F59E0B] text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                        <ShoppingBag size={13} />
                        <span>Test Extension Interceptor</span>
                    </button>

                    {/* Reset State Button */}
                    <button
                        type="button"
                        onClick={handleResetDemo}
                        title="Reset Demo Values"
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors text-xs"
                    >
                        <RotateCcw size={13} />
                    </button>

                    {/* Exit Demo to Landing */}
                    <Link
                        to="/"
                        className="text-white/70 hover:text-white text-xs px-2.5 py-1 rounded-md transition-colors"
                    >
                        Exit Demo
                    </Link>

                    {/* Sign Up CTA */}
                    <Link
                        to="/signup"
                        className="bg-white text-[#111111] hover:bg-[#F4F3EE] font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-transform active:scale-95"
                    >
                        <span>Start Free</span>
                        <ArrowRight size={12} />
                    </Link>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════
                WORKSPACE BODY: SIDEBAR + DYNAMIC MAIN STAGE
                ═══════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative min-h-[calc(100vh-50px)]">
                
                {/* ── DESKTOP & MOBILE SIDEBAR ── */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E2E1DA] flex flex-col justify-between p-4 transition-transform duration-200
                    lg:static lg:translate-x-0
                    ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div>
                        {/* Sidebar Brand Header */}
                        <div className="flex items-center justify-between pb-5 border-b border-[#E2E1DA] mb-4">
                            <div className="flex items-center gap-2.5">
                                <CashlyMark size={32} variant="orange" />
                                <div>
                                    <div className="font-extrabold text-base tracking-tight leading-none">Cashly</div>
                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Sovereign Financial OS</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSidebarMobileOpen(false)}
                                className="lg:hidden p-1 text-neutral-400 hover:text-neutral-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick New Transaction / Intercept Trigger */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsExtensionModalOpen(true);
                                playSound('click');
                            }}
                            className="w-full bg-[#EE5024] hover:bg-[#D64218] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all mb-5"
                        >
                            <Plus size={15} />
                            <span>Simulate Checkout Intercept</span>
                        </button>

                        {/* Navigation Groups */}
                        <div className="space-y-6">
                            {/* Group 1: Core Pillars */}
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2 font-mono">
                                    Core Pillars
                                </div>
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => handleNav('home')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'home'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <LayoutDashboard size={15} className={activeTab === 'home' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Home (Dashboard)</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNav('activity')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'activity'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Receipt size={15} className={activeTab === 'activity' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Activity & Inbox</span>
                                        </div>
                                        {stagedList.length > 0 && (
                                            <span className="bg-[#EE5024] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                                                {stagedList.length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNav('plan')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'plan'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Target size={15} className={activeTab === 'plan' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Plan (Budgets & Bills)</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNav('money-twin')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'money-twin'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <BarChart3 size={15} className={activeTab === 'money-twin' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Money Twin™ Forecast</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded">Radar</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNav('assist')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'assist'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Sparkles size={15} className={activeTab === 'assist' ? 'text-amber-400' : 'text-neutral-400'} />
                                            <span>Assist Co-Pilot</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1 rounded">Agent</span>
                                    </button>
                                </div>
                            </div>

                            {/* Group 2: System & Utilities */}
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2 font-mono">
                                    Hardware & Network
                                </div>
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => handleNav('cards')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'cards'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <CreditCard size={15} className={activeTab === 'cards' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Cards & Accounts</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleNav('extension')}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            activeTab === 'extension'
                                                ? 'bg-[#111111] text-white shadow-xs'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Activity size={15} className={activeTab === 'extension' ? 'text-[#EE5024]' : 'text-neutral-400'} />
                                            <span>Companion Status</span>
                                        </div>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Footer User Card */}
                    <div className="pt-4 border-t border-[#E2E1DA]">
                        <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center justify-center">
                                    DD
                                </div>
                                <div>
                                    <div className="font-bold text-xs text-neutral-800">David Daniels</div>
                                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>Pro Verified</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAcoustic(!acoustic)}
                                title={acoustic ? 'Sound: Enabled' : 'Sound: Muted'}
                                className="text-neutral-400 hover:text-neutral-700 p-1"
                            >
                                <Zap size={14} className={acoustic ? 'text-amber-500' : 'text-neutral-300'} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── MOBILE SIDEBAR TOGGLE BUTTON ── */}
                <div className="lg:hidden fixed bottom-5 left-5 z-40">
                    <button
                        type="button"
                        onClick={() => setSidebarMobileOpen(true)}
                        className="bg-[#111111] text-white p-3 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold"
                    >
                        <LayoutDashboard size={16} />
                        <span>Menu</span>
                    </button>
                </div>

                {/* ── MAIN CONTENT WORKSPACE STAGE ── */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 1: HOME (DASHBOARD)
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'home' && (
                        <div className="space-y-6 max-w-6xl">
                            {/* Dashboard Header Bar */}
                            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#E2E1DA]">
                                <div>
                                    <div className="text-xs font-mono font-bold text-[#EE5024] uppercase tracking-wider">
                                        Deterministic Pacing Control
                                    </div>
                                    <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 font-display mt-0.5">
                                        Good evening, David
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowNumbers(!showNumbers)}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 flex items-center gap-1.5 text-neutral-600"
                                    >
                                        {showNumbers ? <Eye size={13} /> : <EyeOff size={13} />}
                                        <span>{showNumbers ? 'Hide Figures' : 'Show Figures'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExtensionModalOpen(true);
                                            playSound('click');
                                        }}
                                        className="bg-[#111111] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-sm"
                                    >
                                        <ShoppingBag size={13} />
                                        <span>Simulate Intercept</span>
                                    </button>
                                </div>
                            </div>

                            {/* 4 Core KPI Tiles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Tile 1: Safe to Spend */}
                                <div className="bg-[#EE5024] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">Safe To Spend</span>
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    </div>
                                    <div className="my-2">
                                        <div className="text-3xl font-extrabold font-display">
                                            {showNumbers ? formatAmount(safeToSpend) : '••••••'}
                                        </div>
                                        <div className="text-xs text-white/80 font-medium mt-0.5">Discretionary headroom remaining</div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-white/80 pt-2 border-t border-white/20">
                                        <span>Velocity: Healthy</span>
                                        <span>30-day window</span>
                                    </div>
                                </div>

                                {/* Tile 2: Forward Runway */}
                                <div className="bg-[#111111] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[140px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Cash Runway</span>
                                        <TrendingUp size={14} className="text-emerald-400" />
                                    </div>
                                    <div className="my-2">
                                        <div className="text-3xl font-extrabold font-display text-emerald-400">
                                            {runwayDays} Days
                                        </div>
                                        <div className="text-xs text-neutral-400 font-medium mt-0.5">Based on 30-day moving burn</div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                                        <span>Zero Deficit Risk</span>
                                        <span className="font-mono text-emerald-400 font-bold">+12d buffer</span>
                                    </div>
                                </div>

                                {/* Tile 3: Committed Bills */}
                                <div className="bg-white p-5 rounded-2xl border border-[#E2E1DA] shadow-xs flex flex-col justify-between min-h-[140px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Locked Bills</span>
                                        <Repeat size={14} className="text-neutral-400" />
                                    </div>
                                    <div className="my-2">
                                        <div className="text-3xl font-extrabold font-display text-neutral-900">
                                            {showNumbers ? formatAmount(68200) : '••••••'}
                                        </div>
                                        <div className="text-xs text-neutral-500 font-medium mt-0.5">Rent, power, cloud & utilities</div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                                        <span>4 recurring bills</span>
                                        <span>Covered 100%</span>
                                    </div>
                                </div>

                                {/* Tile 4: Daily Burn Pacing */}
                                <div className="bg-white p-5 rounded-2xl border border-[#E2E1DA] shadow-xs flex flex-col justify-between min-h-[140px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Daily Burn</span>
                                        <Zap size={14} className="text-amber-500" />
                                    </div>
                                    <div className="my-2">
                                        <div className="text-3xl font-extrabold font-display text-neutral-900">
                                            {showNumbers ? `${formatAmount(1420)}/d` : '••••••'}
                                        </div>
                                        <div className="text-xs text-neutral-500 font-medium mt-0.5">Normalized daily outflow</div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                                        <span className="text-emerald-600 font-bold">-14% vs last week</span>
                                        <span>Under cap</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Review Queue Banner (If items exist) */}
                            {stagedList.length > 0 && (
                                <div className="bg-white border-2 border-[#EE5024] rounded-2xl p-4 lg:p-5 shadow-sm">
                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#EE5024] animate-pulse" />
                                            <span className="font-extrabold text-sm text-neutral-900">
                                                Sovereign Review Queue ({stagedList.length} Awaiting Approval)
                                            </span>
                                        </div>
                                        <span className="text-xs text-neutral-500 font-medium">
                                            Purchases staged before touching your balance
                                        </span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {stagedList.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between bg-neutral-50 border border-neutral-200 p-3.5 rounded-xl hover:bg-neutral-100/70 transition-colors flex-wrap gap-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#EE5024] flex items-center justify-center font-bold text-base">
                                                        📦
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-neutral-900">{item.item}</div>
                                                        <div className="text-xs text-neutral-500 flex items-center gap-2">
                                                            <span className="font-mono font-medium">{item.merchant}</span>
                                                            <span>•</span>
                                                            <span className="text-neutral-400">{item.source}</span>
                                                            <span>•</span>
                                                            <span className="text-neutral-400">{item.date}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 ml-auto">
                                                    <div className="text-right">
                                                        <div className="font-extrabold text-sm text-neutral-900 font-display">
                                                            {formatAmount(item.amount)}
                                                        </div>
                                                        <span className="text-[10px] text-amber-600 font-semibold">Unreconciled</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveStaged(item)}
                                                        className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                                                    >
                                                        <Check size={13} />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDismissStaged(item.id)}
                                                        className="text-neutral-400 hover:text-neutral-700 text-xs px-2 py-1 rounded"
                                                    >
                                                        Hold
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Runway Simulator & Velocity Restraint Widget */}
                            <div className="bg-[#111111] text-white p-6 rounded-3xl shadow-lg border border-neutral-800">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#EE5024]" />
                                        <h3 className="font-extrabold text-base tracking-tight font-display">
                                            MONEY TWIN™ RUNWAY SIMULATOR
                                        </h3>
                                    </div>
                                    <div className="text-xs font-mono text-neutral-400">
                                        Simulated Pacing: +{formatAmount(restraintOffset * 25)}/mo Preserved
                                    </div>
                                </div>

                                {/* Deficit Collision Radar Alert Banner */}
                                <div className={`p-3 rounded-xl mb-4 border flex items-center justify-between gap-3 text-xs ${
                                    hasDeficitAlert
                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {hasDeficitAlert ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
                                        <span>
                                            {hasDeficitAlert
                                                ? 'Deficit Collision Warning: Without restraint, reserves risk breaching the fixed rent barrier on Day 24.'
                                                : `Deficit Collision Averted: Preserving ${formatAmount(restraintOffset * 25)} extends cash runway beyond Day 55.`}
                                        </span>
                                    </div>
                                    {hasDeficitAlert && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRestraintOffset(200);
                                                playSound('click');
                                            }}
                                            className="bg-[#EE5024] text-white px-2.5 py-1 rounded font-bold text-[11px] whitespace-nowrap"
                                        >
                                            Apply Safe Buffer
                                        </button>
                                    )}
                                </div>

                                {/* Tactile Presets */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="text-[11px] text-neutral-400 font-medium">Quick Pacing:</span>
                                    {[0, 100, 200, 320, 480].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setRestraintOffset(val);
                                                playSound('click');
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold font-mono transition-all ${
                                                restraintOffset === val
                                                    ? 'bg-[#EE5024] text-white'
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                            }`}
                                        >
                                            {val === 0 ? 'Baseline (0)' : `−${formatAmount(val * 25)}`}
                                        </button>
                                    ))}
                                </div>

                                {/* Range Slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    step="20"
                                    value={restraintOffset}
                                    onChange={(e) => setRestraintOffset(Number(e.target.value))}
                                    className="w-full accent-[#EE5024] cursor-pointer"
                                />

                                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
                                    <span>{formatAmount(0)} (As-is velocity)</span>
                                    <span>{formatAmount(5000)}/mo restraint (+25 days)</span>
                                    <span>{formatAmount(12500)}/mo high restraint (+62 days)</span>
                                </div>
                            </div>

                            {/* Recent Canonical Double-Entry Transactions */}
                            <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-extrabold text-base text-neutral-900 font-display">
                                            Canonical Ledger Activity
                                        </h3>
                                        <p className="text-xs text-neutral-500">
                                            Verified double-entry transactions feeding your Money Twin
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleNav('activity')}
                                        className="text-xs font-bold text-[#EE5024] hover:underline flex items-center gap-1"
                                    >
                                        <span>View All Ledger</span>
                                        <ArrowRight size={12} />
                                    </button>
                                </div>

                                <div className="divide-y divide-neutral-100">
                                    {approvedList.map((tx) => (
                                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                                                    ✓
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-neutral-900">{tx.merchant}</div>
                                                    <div className="text-xs text-neutral-500">{tx.details} · {tx.date}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-sm text-neutral-900 font-display">
                                                    -{formatAmount(tx.amount)}
                                                </div>
                                                <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                    {tx.category}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 2: ACTIVITY & REVIEW INBOX
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'activity' && (
                        <div className="space-y-5 max-w-5xl">
                            <div className="flex items-center justify-between pb-4 border-b border-[#E2E1DA]">
                                <div>
                                    <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                        Activity & Review Pipeline
                                    </h1>
                                    <p className="text-xs text-neutral-500">
                                        Sovereign review queue separating intent from canonical financial records
                                    </p>
                                </div>
                                <div className="flex items-center bg-white p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActivitySubTab('inbox')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activitySubTab === 'inbox'
                                                ? 'bg-[#111111] text-white'
                                                : 'text-neutral-600 hover:text-black'
                                        }`}
                                    >
                                        <Inbox size={13} />
                                        <span>Review Inbox ({stagedList.length})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActivitySubTab('ledger')}
                                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                            activitySubTab === 'ledger'
                                                ? 'bg-[#111111] text-white'
                                                : 'text-neutral-600 hover:text-black'
                                        }`}
                                    >
                                        <Receipt size={13} />
                                        <span>Canonical Ledger ({approvedList.length})</span>
                                    </button>
                                </div>
                            </div>

                            {activitySubTab === 'inbox' ? (
                                <div className="space-y-3">
                                    {stagedList.length === 0 ? (
                                        <div className="bg-white border border-[#E2E1DA] rounded-2xl p-10 text-center">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <h3 className="font-extrabold text-lg text-neutral-900 font-display">Inbox Zero Achieved</h3>
                                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                                                All intercepted purchases have been reviewed and balanced to your canonical ledger.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsExtensionModalOpen(true);
                                                    playSound('click');
                                                }}
                                                className="bg-[#EE5024] text-white text-xs font-bold px-4 py-2 rounded-xl"
                                            >
                                                Simulate New Checkout Interception
                                            </button>
                                        </div>
                                    ) : (
                                        stagedList.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-white border-2 border-orange-300 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-100 text-[#EE5024] px-2 py-0.5 rounded-full">
                                                            {item.source}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 font-mono">{item.date}</span>
                                                    </div>
                                                    <h4 className="font-extrabold text-base text-neutral-900">{item.item}</h4>
                                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.merchant} · {item.category}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-2">
                                                        <div className="text-xl font-extrabold font-display text-neutral-900">
                                                            {formatAmount(item.amount)}
                                                        </div>
                                                        <span className="text-[10px] text-amber-600 font-semibold">Pending Approval</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveStaged(item)}
                                                        className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Check size={14} />
                                                        <span>Approve to Ledger</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDismissStaged(item.id)}
                                                        className="border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium px-3 py-2 rounded-xl"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border border-[#E2E1DA] rounded-2xl divide-y divide-neutral-100">
                                    {approvedList.map((tx) => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                    ✓
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-neutral-900">{tx.merchant}</div>
                                                    <div className="text-xs text-neutral-500">{tx.details} · {tx.date}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-sm text-neutral-900 font-display">
                                                    -{formatAmount(tx.amount)}
                                                </div>
                                                <span className="text-[10px] text-neutral-500 font-mono">{tx.source}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 3: PLAN (BUDGETS & COMMITMENTS)
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'plan' && (
                        <div className="space-y-6 max-w-5xl">
                            <div className="pb-4 border-b border-[#E2E1DA]">
                                <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                    Budgets & Fixed Commitments
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Envelopes protect essential cash while locking upcoming bills
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-neutral-900">Apartment Rent & Housing</span>
                                        <span className="text-xs font-mono font-bold text-neutral-600">100% Locked</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-[#80383D] h-full rounded-full" style={{ width: '100%' }} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span>Committed: {formatAmount(65000)}</span>
                                        <span>Cap: {formatAmount(65000)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-neutral-900">Food & Dining</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600">70% Paced</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-[#EE5024] h-full rounded-full" style={{ width: '70%' }} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span>Spent: {formatAmount(24500)}</span>
                                        <span>Cap: {formatAmount(35000)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-neutral-900">Tech & Subscriptions</span>
                                        <span className="text-xs font-mono font-bold text-purple-600">51% Paced</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '51%' }} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span>Spent: {formatAmount(7650)}</span>
                                        <span>Cap: {formatAmount(15000)}</span>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-neutral-900">Power & Utility Bills</span>
                                        <span className="text-xs font-mono font-bold text-blue-600">65% Paced</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '65%' }} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span>Spent: {formatAmount(18200)}</span>
                                        <span>Cap: {formatAmount(28000)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 4: MONEY TWIN™ FORECAST
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'money-twin' && (
                        <div className="space-y-6 max-w-5xl">
                            <div className="pb-4 border-b border-[#E2E1DA]">
                                <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                    Money Twin™ Predictive Forecast
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Deterministic curve projecting cash balance through Day 30 and detecting deficit collision
                                </p>
                            </div>

                            <div className="bg-[#111111] text-white p-6 rounded-3xl shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Live Curve Generator</span>
                                        <div className="text-2xl font-extrabold font-display">
                                            {formatAmount(24150 + restraintOffset * 25)} Month-End Buffer
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-neutral-400">Total Runway</span>
                                        <div className="text-xl font-bold font-mono text-emerald-400">{runwayDays} Days</div>
                                    </div>
                                </div>

                                {/* SVG Chart Artwork */}
                                <div className="bg-neutral-900/80 rounded-2xl p-4 border border-white/10 mb-5">
                                    <svg viewBox="0 0 700 180" className="w-full h-44" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="demoRunwayArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d={`M 0 100 Q 250 90, 400 70 T 700 ${Math.max(20, 80 - (restraintOffset / 500) * 60)} L 700 180 L 0 180 Z`}
                                            fill="url(#demoRunwayArea)"
                                        />
                                        <line x1="0" y1="130" x2="700" y2="130" stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="4 4" strokeWidth="1.5" />
                                        <text x="10" y="125" fill="#EF4444" fontSize="10" fontFamily="Inter" fontWeight="bold">
                                            Rent Threshold Barrier ({formatAmount(18000)})
                                        </text>
                                        {/* Trajectory */}
                                        <path
                                            d={`M 0 100 Q 250 90, 400 70 T 700 ${Math.max(20, 80 - (restraintOffset / 500) * 60)}`}
                                            fill="none"
                                            stroke="#EE5024"
                                            strokeWidth="3.5"
                                        />
                                        <circle cx="400" cy="70" r="4.5" fill="#FFFFFF" stroke="#EE5024" strokeWidth="2.5" />
                                        <text x="408" y="70" fill="white" fontSize="10" fontFamily="Inter">Today (Day 18)</text>
                                    </svg>
                                </div>

                                {/* Restraint Slider Controls */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Simulate Discretionary Restraint</span>
                                        <strong className="text-[#EE5024] font-mono">+{formatAmount(restraintOffset * 25)} Preserved</strong>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        step="20"
                                        value={restraintOffset}
                                        onChange={(e) => setRestraintOffset(Number(e.target.value))}
                                        className="w-full accent-[#EE5024] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 5: ASSIST (AI CO-PILOT DECISION SURFACE)
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'assist' && (
                        <div className="space-y-6 max-w-5xl">
                            <div className="pb-4 border-b border-[#E2E1DA]">
                                <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                    Cashly AI Decision Surface
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Active financial agent with clickable Action Chips that mutate budgets directly
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Insight 1 */}
                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-purple-600" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
                                            Velocity Anomaly Detected
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-base text-neutral-900 mb-1">
                                        Dining spend is pacing 28% ahead of your 30-day runway safety envelope.
                                    </h4>
                                    <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                                        At current pace, dining will consume {formatAmount(12000)} more than projected. Capping dining preserves 6 days of cash runway.
                                    </p>

                                    {!executedActions['cap-dining'] ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleExecuteAiAction('cap-dining', 'Dining budget capped at Rs 20,000')}
                                                className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                                            >
                                                <span>Cap Dining at {formatAmount(20000)}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => playSound('click')}
                                                className="text-neutral-500 text-xs px-3 py-2 rounded-xl hover:bg-neutral-100"
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                            <Check size={13} />
                                            <span>Cap Enforced • Pacing Saved</span>
                                        </div>
                                    )}
                                </div>

                                {/* Insight 2 */}
                                <div className="bg-white border border-[#E2E1DA] rounded-2xl p-5 shadow-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={16} className="text-amber-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 font-mono">
                                            Runway Expansion Opportunity
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-base text-neutral-900 mb-1">
                                        {formatAmount(3200)} discretionary headroom detected above your 30-day threshold.
                                    </h4>
                                    <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                                        Moving this surplus into the Vault locks in an additional 3.4 days of cash buffer.
                                    </p>

                                    {!executedActions['vault-surplus'] ? (
                                        <button
                                            type="button"
                                            onClick={() => handleExecuteAiAction('vault-surplus', `Moved ${formatAmount(3000)} to Vault (+3.4d Runway)`)}
                                            className="bg-[#EE5024] hover:bg-[#D64218] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                                        >
                                            <span>+ Vault {formatAmount(3000)} Surplus</span>
                                        </button>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                            <Check size={13} />
                                            <span>Surplus Vaulted (+3.4 Days Gained)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 6: CARDS & ACCOUNTS
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'cards' && (
                        <div className="space-y-6 max-w-5xl">
                            <div className="pb-4 border-b border-[#E2E1DA]">
                                <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                    Cards & Accounts
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Virtual cards & linked accounts supporting zero-password interception
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Card Graphic */}
                                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between h-52 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs tracking-wider uppercase font-mono text-white/70">CASHLY TITANIUM</span>
                                        <CashlyMark size={24} variant="orange" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-lg tracking-widest text-white/90">•••• •••• •••• 4289</div>
                                        <div className="flex items-center gap-4 text-xs font-mono text-white/60 mt-1">
                                            <span>EXP 10/29</span>
                                            <span>CVC •••</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                                        <span className="font-bold">David Daniels</span>
                                        <span className="font-mono text-emerald-400 font-bold">{formatAmount(safeToSpend)} Limit</span>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#E2E1DA] rounded-3xl p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-extrabold text-base text-neutral-900">Virtual Card Controls</h3>
                                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                            Auto-freezes purchases when your Money Twin predicts a deficit collision.
                                        </p>
                                    </div>
                                    <div className="space-y-2 my-4">
                                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100">
                                            <span>Pre-Swipe Defense</span>
                                            <span className="font-bold text-emerald-600">Active</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100">
                                            <span>Single-Use Merchant Tokens</span>
                                            <span className="font-bold text-emerald-600">Enabled</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => playSound('click')}
                                        className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold py-2 rounded-xl"
                                    >
                                        Manage Limits
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────────────────────────────────────────────────────────────
                        VIEW 7: EXTENSION COMPANION STATUS
                        ───────────────────────────────────────────────────────────── */}
                    {activeTab === 'extension' && (
                        <div className="space-y-6 max-w-5xl">
                            <div className="pb-4 border-b border-[#E2E1DA]">
                                <h1 className="text-2xl font-extrabold text-neutral-900 font-display">
                                    Browser Companion Extension
                                </h1>
                                <p className="text-xs text-neutral-500">
                                    Real-time checkout interception telemetry across Amazon, Shopify, Uber, and food delivery
                                </p>
                            </div>

                            <div className="bg-white border border-[#E2E1DA] rounded-3xl p-6 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-base text-neutral-900">Extension Status: Active (v2.4.1)</h3>
                                            <p className="text-xs text-neutral-500">Private memory interception active on current browser</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsExtensionModalOpen(true);
                                            playSound('click');
                                        }}
                                        className="bg-[#EE5024] hover:bg-[#D64218] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                                    >
                                        <ShoppingBag size={13} />
                                        <span>Launch Live Test</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                                    {['Amazon.com', 'Shopify Stores', 'Uber Transit', 'Foodpanda.pk'].map((store) => (
                                        <div key={store} className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                                            <div className="text-xs font-bold text-neutral-800">{store}</div>
                                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1 mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Intercept Ready
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                INTERACTIVE BROWSER EXTENSION CHECKOUT SIMULATOR MODAL
                ═══════════════════════════════════════════════════════════ */}
            {isExtensionModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1C1A17] text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-700 overflow-hidden flex flex-col">
                        
                        {/* Simulated Browser Chrome Top Bar */}
                        <div className="bg-[#111111] px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                            </div>

                            {/* Simulated Address Bar */}
                            <div className="flex-1 max-w-md bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-xs font-mono text-neutral-400 flex items-center gap-2 mx-auto">
                                <Lock size={11} className="text-emerald-400" />
                                <span className="text-white">checkout.{STORES[selectedStoreIndex].name}</span>
                                <span className="text-neutral-500">/pay/confirm</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsExtensionModalOpen(false)}
                                className="text-neutral-400 hover:text-white p-1 rounded-md"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Store Switcher Tabs */}
                        <div className="bg-neutral-900/60 px-4 py-2 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto">
                            <span className="text-[11px] text-neutral-500 font-mono font-bold mr-1">Store:</span>
                            {STORES.map((s, idx) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedStoreIndex(idx);
                                        setExtensionApproved(false);
                                        playSound('click');
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                        selectedStoreIndex === idx
                                            ? 'bg-white text-neutral-900 shadow-xs'
                                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>

                        {/* Browser Body & Overlay HUD */}
                        <div className="p-6 relative">
                            {/* Merchant Product Preview Underneath */}
                            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                                        Checkout Item
                                    </span>
                                    <h4 className="font-extrabold text-base text-white mt-0.5">
                                        {STORES[selectedStoreIndex].item}
                                    </h4>
                                    <span className="text-xs text-neutral-400">
                                        Category: {STORES[selectedStoreIndex].cat} · Free Express Delivery
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-extrabold text-white font-display">
                                        {formatAmount(STORES[selectedStoreIndex].price)}
                                    </div>
                                    <span className="text-[10px] text-neutral-500 font-mono">Pre-Tax Subtotal</span>
                                </div>
                            </div>

                            {/* Floating Companion Extension HUD Frame */}
                            <div className="bg-[#EE5024] text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase">
                                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <span>CASHLY COMPANION HUD</span>
                                    </div>
                                    <span className="bg-black/25 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                                        PRE-SWIPE INTERCEPT
                                    </span>
                                </div>

                                <div className="text-sm font-semibold mb-3">
                                    &ldquo;Capturing checkout before card is charged. Assessing forward runway impact.&rdquo;
                                </div>

                                {/* Impact Telemetry Grid */}
                                <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-xl mb-4 text-xs">
                                    <div>
                                        <span className="text-white/70">Safe to Spend After Purchase:</span>
                                        <div className="font-bold text-sm font-display mt-0.5">
                                            {formatAmount(Math.max(0, safeToSpend - STORES[selectedStoreIndex].price))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-white/70">Runway Impact:</span>
                                        <div className="font-bold text-sm text-yellow-300 font-mono mt-0.5">
                                            −{Math.round(STORES[selectedStoreIndex].price / 4000)} Days
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {!extensionApproved ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleApproveFromExtensionModal}
                                            className="flex-1 bg-white hover:bg-neutral-100 text-[#111111] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                                        >
                                            <Check size={14} />
                                            <span>Approve & Post to Cashly Ledger</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsExtensionModalOpen(false)}
                                            className="bg-black/30 hover:bg-black/40 text-white py-2.5 px-4 rounded-xl font-semibold text-xs"
                                        >
                                            Hold in Queue
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-black/30 p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                                            <CheckCircle2 size={16} />
                                            <span>Reconciled to Canonical Double-Entry Ledger</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsExtensionModalOpen(false)}
                                            className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold"
                                        >
                                            Return to OS
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-neutral-900 px-6 py-3 border-t border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Lock size={12} className="text-emerald-400" />
                                <span>Zero Banking Passwords Shared</span>
                            </span>
                            <span className="font-mono text-[11px]">Real-Time Sync Activated</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
