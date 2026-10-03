import { useState } from 'react';
import { 
    Check, 
    Chrome, 
    RotateCcw,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroProductScene() {
    const [status, setStatus] = useState<'pending' | 'approving' | 'posted'>('pending');

    const handleApprove = () => {
        setStatus('approving');
        setTimeout(() => {
            setStatus('posted');
        }, 320);
    };

    const handleReset = () => {
        setStatus('pending');
    };

    return (
        <div className="relative mx-auto w-full max-w-2xl select-none">
            {/* Ambient subtle back glow */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[var(--color-brand)]/15 via-teal-500/10 to-transparent blur-xl opacity-75 pointer-events-none" />

            {/* Main Application Container */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(11,22,32,0.06),0_20px_48px_-8px_rgba(11,22,32,0.08)] transition-all duration-300">
                {/* Application Window Titlebar */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                        </div>
                        <span className="ml-2 hidden font-mono text-[11px] font-semibold text-[var(--color-muted)] sm:inline">
                            cashly.app / workspace
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live Sync Active
                        </span>

                        {status === 'posted' && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-brand)] transition-colors"
                                title="Replay lifecycle interaction"
                            >
                                <RotateCcw className="h-3 w-3" />
                                <span>Replay</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Micro Header with Stage Flow Tabs */}
                <div className="border-b border-[#E7E5E4] bg-white px-4 py-2 sm:px-5">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1C1917]">Interactive Live Engine</span>
                            <span className="text-[#A8A29E]">•</span>
                            <span className="text-[11px] text-[#78716C]">Try approving this capture</span>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#A8A29E]">
                            {status === 'posted' ? 'Step 2 of 2: Posted' : 'Step 1 of 2: Staged'}
                        </span>
                    </div>
                </div>

                {/* Dynamic Content Viewport */}
                <div className="p-4 sm:p-6 space-y-4">
                    {/* Browser Interception Chip */}
                    <div className="flex items-center justify-between rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-3.5 py-2">
                        <div className="flex items-center gap-2">
                            <Chrome className="h-4 w-4 text-[#2563EB]" />
                            <span className="font-mono text-[11px] text-[#57534E]">checkout.foodpanda.pk</span>
                        </div>
                        <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#059669]">
                            COMPANION INTERCEPTED
                        </span>
                    </div>

                    {status !== 'posted' ? (
                        /* STATE A: PENDING INBOX DECISION */
                        <div className="space-y-4 transition-all duration-300">
                            {/* Staged Transaction Card */}
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all shadow-xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] font-display text-sm font-bold text-[var(--color-brand)] shadow-xs">
                                            FP
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-display text-base font-bold text-[var(--color-ink)]">Foodpanda Delivery</h3>
                                                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                    Unposted
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                                                <span className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-medium border border-[var(--color-border)]">
                                                    Dining & Takeout
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    Debit Card (••4821)
                                                </span>
                                                <span>•</span>
                                                <span>Just now</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-mono text-lg font-bold text-[var(--color-ink)] tabular-nums">
                                            Rs 1,240
                                        </span>
                                        <p className="text-[10px] text-[var(--color-muted)]">Pending Decision</p>
                                    </div>
                                </div>

                                {/* Decision Action Bar */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                                    <p className="text-[11px] text-[var(--color-muted)]">
                                        Nothing alters your ledger or budget until you confirm.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-secondary-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                                            onClick={() => alert("In the full app, you can split, recategorize, or reject transactions.")}
                                        >
                                            Edit / Split
                                        </button>
                                        <Button
                                            size="sm"
                                            onClick={handleApprove}
                                            disabled={status === 'approving'}
                                            className="h-8 bg-[var(--color-brand)] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-hover)] transition-all"
                                        >
                                            <Check className="mr-1 h-3.5 w-3.5" />
                                            {status === 'approving' ? 'Posting...' : 'Approve ✓'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Trust micro-banner */}
                            <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-3.5 py-2 text-[11px] text-[var(--color-muted)]">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Staged in your private inbox without bank logins
                                </span>
                                <span className="font-semibold text-[var(--color-brand)]">Tap Approve to see live impact →</span>
                            </div>
                        </div>
                    ) : (
                        /* STATE B: APPROVED TO CANONICAL LEDGER + DYNAMIC REAL-TIME IMPACT */
                        <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                            {/* Canonical Ledger Posted Row */}
                            <div className="flex items-center justify-between rounded-xl border border-[#A7F3D0] bg-[#ECFDF5]/60 p-3.5 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#059669] text-white shadow-xs">
                                        <Check className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-display text-sm font-bold text-[#1C1917]">Foodpanda Delivery</p>
                                            <span className="rounded bg-white px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#059669] border border-[#A7F3D0]">
                                                POSTED TO LEDGER
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#57534E]">Posted to Debit Card • Canonical Record #8429</p>
                                    </div>
                                </div>
                                <span className="font-mono text-base font-bold text-[#1C1917] tabular-nums">
                                    -Rs 1,240
                                </span>
                            </div>

                            {/* Dynamic Real-time Impact Grid */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {/* Budget Velocity Update */}
                                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[var(--color-ink)]">Dining & Takeout</span>
                                        <span className="font-mono font-bold text-[var(--color-warning)] tabular-nums">
                                            Rs 7,800 / Rs 10,000
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                                        <div 
                                            className="h-full rounded-full bg-[var(--color-warning)] transition-all duration-700 ease-out" 
                                            style={{ width: '78%' }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--color-warning)] font-medium font-mono">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>Velocity: 14% faster than calendar target</span>
                                    </div>
                                </div>

                                {/* Money Twin Forecast Recalculation */}
                                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[var(--color-ink)]">Money Twin Forecast</span>
                                        <span className="font-mono font-bold text-[var(--color-success)] tabular-nums">
                                            Rs 24,150 projected
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-baseline justify-between">
                                        <span className="text-[11px] text-[var(--color-muted)]">Daily burn velocity:</span>
                                        <span className="font-mono text-xs font-bold text-[var(--color-ink)]">Rs 1,840/day</span>
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between text-[10px] text-[var(--color-muted)]">
                                        <span>Cash runway:</span>
                                        <span className="font-semibold text-[var(--color-success)]">42 days remaining</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contextual AI Alert Action */}
                            <div className="rounded-xl border border-[var(--color-ai)]/30 bg-[var(--color-ai-soft)]/60 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ai)]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Cashly Contextual Observation</span>
                                </div>
                                <p className="mt-1 text-xs text-[var(--color-ink)] leading-relaxed">
                                    "Dining burn spiked with this Rs 1,240 post. You have 2 committed utility bills (Rs 4,600) due this Friday."
                                </p>
                                <div className="mt-2.5 flex flex-wrap gap-2">
                                    <span className="cursor-pointer rounded-md border border-[var(--color-ai)]/30 bg-white px-2 py-1 text-[10px] font-semibold text-[var(--color-ai)] shadow-2xs hover:bg-[var(--color-ai-soft)] transition-colors">
                                        [Protect Friday Headroom]
                                    </span>
                                    <span className="cursor-pointer rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-surface-2)] transition-colors">
                                        [View Dining Trajectory]
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subtle Footer Bar */}
                <div className="flex items-center justify-between border-t border-[#E7E5E4] bg-[#FAF8F5] px-4 py-2.5 text-[11px] text-[#78716C] sm:px-5">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-[#059669]" />
                        Canonical Postgres Ledger with Row-Level Security
                    </span>
                    <span className="font-mono text-[10px] text-[#A8A29E]">v3.0.4</span>
                </div>
            </div>
        </div>
    );
}
