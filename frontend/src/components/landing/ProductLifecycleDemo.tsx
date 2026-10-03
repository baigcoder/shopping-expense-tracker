import { useState, useEffect } from 'react';
import { 
    Check, 
    Chrome, 
    Inbox, 
    Sparkles, 
    TrendingUp, 
    ArrowRight, 
    Calendar, 
    CreditCard,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DemoStep = 'capture' | 'review' | 'ledger' | 'twin';

const STEPS: { id: DemoStep; label: string; number: string }[] = [
    { id: 'capture', label: '1. Capture', number: '01' },
    { id: 'review', label: '2. Review', number: '02' },
    { id: 'ledger', label: '3. Ledger & Plan', number: '03' },
    { id: 'twin', label: '4. Forecast & AI', number: '04' },
];

export default function ProductLifecycleDemo() {
    const [currentStep, setCurrentStep] = useState<DemoStep>('review');
    const [isApproved, setIsApproved] = useState(false);

    // Reset approval state if switching back to capture or review
    const handleStepChange = (step: DemoStep) => {
        setCurrentStep(step);
        if (step === 'capture' || step === 'review') {
            setIsApproved(false);
        } else {
            setIsApproved(true);
        }
    };

    const handleApprove = () => {
        setIsApproved(true);
        setTimeout(() => {
            setCurrentStep('ledger');
        }, 300);
    };

    const handleReset = () => {
        setIsApproved(false);
        setCurrentStep('capture');
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-lg)] sm:p-7">
            {/* Step Navigation Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E5E4] pb-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {STEPS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleStepChange(s.id)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                currentStep === s.id
                                    ? 'bg-[#1C1917] text-white shadow-sm'
                                    : 'bg-[#FAF8F5] text-[#78716C] hover:bg-[#F5F2EB] hover:text-[#1C1917]'
                            }`}
                        >
                            <span className={currentStep === s.id ? 'text-[var(--color-brand-soft)]' : 'text-[#8C9B9E]'}>
                                {s.number}
                            </span>
                            <span>{s.label.split('. ')[1]}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-xs text-[#56656A] transition-colors hover:text-[var(--color-brand)]"
                    title="Reset Interactive Demonstration"
                >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Reset</span>
                </button>
            </div>

            {/* Interactive Stage Canvas */}
            <div className="min-h-[290px]">
                {/* STEP 1: CAPTURE */}
                {currentStep === 'capture' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] px-3.5 py-2">
                            <div className="flex items-center gap-2">
                                <Chrome className="h-4 w-4 text-[#3677E8]" />
                                <span className="text-xs font-mono text-[#56656A]">checkout.foodpanda.pk</span>
                            </div>
                            <span className="rounded-full bg-[#E3F4EA] px-2 py-0.5 text-[10px] font-semibold text-[#17824F]">
                                Order Placed
                            </span>
                        </div>

                        <div className="rounded-xl border border-dashed border-[var(--color-border,#E2E8F0)] p-4 text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                                <Chrome className="h-5 w-5" />
                            </div>
                            <h4 className="mt-2.5 font-display text-sm font-semibold text-[#142127]">
                                Browser Companion Captured Checkout
                            </h4>
                            <p className="mt-1 text-xs text-[#56656A]">
                                Intercepted purchase for <strong className="text-[#142127]">Foodpanda (Rs 1,240)</strong>. Staged in your private inbox. Zero bank passwords shared.
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button 
                                size="sm" 
                                onClick={() => setCurrentStep('review')}
                                className="bg-[#142127] text-xs text-white hover:bg-[#20323B]"
                            >
                                Inspect in Review Inbox
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: REVIEW INBOX */}
                {currentStep === 'review' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">Unposted Queue</p>
                                <h4 className="font-display text-base font-bold text-[#142127]">Waiting for your decision</h4>
                            </div>
                            <Badge variant="outline" className="border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] text-xs font-semibold text-[var(--color-brand)]">
                                1 Pending
                            </Badge>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-4 transition-all">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand)]">
                                        FP
                                    </div>
                                    <div>
                                        <p className="font-display text-sm font-semibold text-[#142127]">Foodpanda Delivery</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#56656A]">
                                            <span className="rounded bg-white px-1.5 py-0.5 font-medium border border-[var(--color-border,#E2E8F0)]">
                                                Dining & Food
                                            </span>
                                            <span>•</span>
                                            <span>Today, 2:14 PM</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="font-mono text-base font-bold text-[#142127] tabular-nums">
                                    Rs 1,240
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border,#E2E8F0)] pt-3.5">
                                <p className="text-xs text-[#56656A]">Nothing posts until you approve.</p>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 text-xs text-[#56656A] hover:bg-white"
                                        onClick={() => setCurrentStep('capture')}
                                    >
                                        Edit / Dismiss
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={handleApprove}
                                        className="h-8 bg-[var(--color-brand)] text-xs font-semibold text-white hover:bg-[var(--color-brand-hover)] shadow-sm"
                                    >
                                        <Check className="mr-1 h-3.5 w-3.5" />
                                        Approve ✓
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[11px] text-[#8C9B9E]">
                            Click <strong className="text-[#142127]">Approve ✓</strong> to see how Cashly immediately updates your budget and analytics.
                        </p>
                    </div>
                )}

                {/* STEP 3: LEDGER & PLAN */}
                {currentStep === 'ledger' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#17824F]">Approved to Canonical Ledger</p>
                                <h4 className="font-display text-base font-bold text-[#142127]">Budgets updated in real-time</h4>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#17824F]">
                                <Check className="h-4 w-4" /> Posted
                            </span>
                        </div>

                        {/* Posted Ledger Row */}
                        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border,#E2E8F0)] bg-white p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E3F4EA] text-xs font-bold text-[#17824F]">
                                    ✓
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#142127]">Foodpanda Delivery</p>
                                    <p className="text-[11px] text-[#56656A]">Posted to Debit Card • Oct 3</p>
                                </div>
                            </div>
                            <span className="font-mono text-sm font-bold text-[#142127] tabular-nums">
                                -Rs 1,240
                            </span>
                        </div>

                        {/* Dynamic Budget Pace Card */}
                        <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#142127]">Dining & Takeout Budget</span>
                                <span className="font-mono font-medium text-[#B8680B] tabular-nums">Rs 7,800 / Rs 10,000 (78%)</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2,#E9ECE8)]">
                                <div 
                                    className="h-full rounded-full bg-[#B8680B] transition-all duration-700 ease-out"
                                    style={{ width: '78%' }}
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-[#B8680B]">
                                ⚠️ Pace Warning: You are spending 14% faster than the calendar day pace.
                            </p>
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button 
                                size="sm" 
                                onClick={() => setCurrentStep('twin')}
                                className="bg-[#142127] text-xs text-white hover:bg-[#20323B]"
                            >
                                See Money Twin & AI Impact
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: MONEY TWIN & AI */}
                {currentStep === 'twin' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ai,#7753C7)]">Predictive Intelligence</p>
                                <h4 className="font-display text-base font-bold text-[#142127]">Money Twin Forecast & Contextual AI</h4>
                            </div>
                            <Sparkles className="h-5 w-5 text-[var(--color-ai,#7753C7)]" />
                        </div>

                        {/* Forecast Metrics */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3">
                                <p className="text-[11px] font-medium text-[#56656A]">Daily Burn Velocity</p>
                                <p className="mt-1 font-mono text-base font-bold text-[#142127] tabular-nums">Rs 1,840/day</p>
                                <p className="text-[10px] text-[#B8680B]">+12% vs last month</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-bg,#F4F3EE)] p-3">
                                <p className="text-[11px] font-medium text-[#56656A]">Projected Month-End</p>
                                <p className="mt-1 font-mono text-base font-bold text-[#17824F] tabular-nums">Rs 24,150</p>
                                <p className="text-[10px] text-[#56656A]">Runway: 42 days</p>
                            </div>
                        </div>

                        {/* Grounded AI Action Card */}
                        <div className="rounded-xl border border-[#7753C7]/30 bg-[#F1ECFF]/50 p-3.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#7753C7]">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Contextual AI Pattern Detected</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#142127]">
                                "Dining velocity spiked by Rs 1,240 today. You have 2 committed utility bills due this Friday (Rs 4,600)."
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-[#142127] border border-[var(--color-border,#E2E8F0)] shadow-xs">
                                    [Inspect Dining Ledger]
                                </span>
                                <span className="rounded-md bg-[#F1ECFF] px-2 py-1 text-[11px] font-semibold text-[#7753C7] border border-[#7753C7]/30 shadow-xs">
                                    [Protect Bill Headroom]
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-xs text-[#56656A]">
                            <span>This is how Cashly connects the entire loop.</span>
                            <button 
                                onClick={() => handleStepChange('capture')} 
                                className="font-semibold text-[var(--color-brand)] hover:underline"
                            >
                                Play again ↺
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
