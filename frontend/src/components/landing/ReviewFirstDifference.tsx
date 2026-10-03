import { useState } from 'react';
import { ArrowRight, Check, X, AlertTriangle, Clock } from 'lucide-react';

const pipelineSteps = [
    { id: 1, title: 'Purchase Captured', desc: 'Captured silently in browser at checkout. Zero passwords.', tag: 'CAPTURE' },
    { id: 2, title: 'Needs Review', desc: 'Held in private inbox. Nothing posts to ledger yet.', tag: 'QUEUE' },
    { id: 3, title: 'User Approves', desc: 'Explicit consent given with single click or shortcut.', tag: 'CONSENT' },
    { id: 4, title: 'Ledger Updated', desc: 'Canonical double-entry accounting ledger verified.', tag: 'LEDGER' },
    { id: 5, title: 'Budget Recalculates', desc: 'Discretionary category capacity adjusted in real time.', tag: 'BUDGET' },
    { id: 6, title: 'Forecast Recalculated', desc: 'Money Twin runway model updates with variance.', tag: 'FORECAST' },
];

export default function ReviewFirstDifference() {
    const [currentStep, setCurrentStep] = useState(2); // Step 3 active (index 2)

    return (
        <section id="review-first" className="landing-review-diff scroll-mt-20">
            <div className="landing-review-diff__header">
                <div className="landing-review-diff__tag">THE REVIEW-FIRST PHILOSOPHY</div>
                <h2 className="landing-review-diff__title">
                    WHY SOVEREIGN REVIEW<br />
                    BEATS AUTOMATIC CHAOS.
                </h2>
                <p className="landing-review-diff__sub">
                    Most finance apps connect to your bank, pull stale data 3 days late, and guess categories.
                    Cashly captures checkouts at source and waits for your approval.
                </p>
            </div>

            {/* Asymmetric Editorial Split: Old vs Cashly Pipeline */}
            <div className="landing-review-diff__grid">

                {/* Left: The Old Way (Monochrome / Faded Charcoal) */}
                <div className="landing-review-diff__old-pane">
                    <div>
                        <div className="landing-review-diff__old-tag">
                            <X size={14} color="#EF4444" />
                            <span>THE CONVENTIONAL WAY</span>
                        </div>

                        <h3 className="landing-review-diff__old-headline">
                            DELAYED.<br />
                            MANUAL.<br />
                            REACTIVE.
                        </h3>

                        <div className="landing-review-diff__old-points">
                            <div className="landing-review-diff__old-point">
                                <span className="landing-review-diff__old-bullet">✕</span>
                                <div>
                                    <strong>3-Day Delayed Bank Scrapers:</strong>
                                    <p>You buy groceries on Monday, but the transaction doesn't appear until Thursday. Your budget is always lying to you.</p>
                                </div>
                            </div>

                            <div className="landing-review-diff__old-point">
                                <span className="landing-review-diff__old-bullet">✕</span>
                                <div>
                                    <strong>Cryptic Statement Names:</strong>
                                    <p>Transactions read like &ldquo;AMZN*MKT-8349281-WA&rdquo;. You spend Sunday afternoons remembering what you actually purchased.</p>
                                </div>
                            </div>

                            <div className="landing-review-diff__old-point">
                                <span className="landing-review-diff__old-bullet">✕</span>
                                <div>
                                    <strong>Month-End Shock:</strong>
                                    <p>By the time you open your banking app on the 28th, you are already over budget with zero time to correct trajectory.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Realistic Legacy Bank Feed Failure Simulation Card (Fills Dead Whitespace) */}
                    <div className="landing-review-diff__stale-card">
                        <div className="landing-review-diff__stale-header">
                            <div className="landing-review-diff__stale-badge">
                                <span className="landing-review-diff__stale-dot" />
                                <span>BANK FEED SYNC LATENCY: 72H</span>
                            </div>
                            <span className="landing-review-diff__stale-tag">
                                <Clock size={10} />
                                DELAYED FEED
                            </span>
                        </div>

                        <div className="landing-review-diff__stale-item">
                            <div className="landing-review-diff__stale-item-main">
                                <span className="landing-review-diff__stale-desc">AMZN*MKT-8349281-WA</span>
                                <span className="landing-review-diff__stale-val">Rs 34,990</span>
                            </div>
                            <div className="landing-review-diff__stale-item-sub">
                                <span className="landing-review-diff__stale-warn">
                                    <AlertTriangle size={11} className="inline mr-1 text-amber-600" />
                                    Uncategorized • 3 Days Behind
                                </span>
                                <span className="landing-review-diff__stale-date">Unposted to runway</span>
                            </div>
                        </div>

                        <div className="landing-review-diff__contrast-row">
                            <div className="landing-review-diff__contrast-col">
                                <span className="landing-review-diff__contrast-lbl">Bank Scrapers</span>
                                <span className="landing-review-diff__contrast-val text-red-600">3–5 Days Delay</span>
                            </div>
                            <div className="landing-review-diff__contrast-divider" />
                            <div className="landing-review-diff__contrast-col">
                                <span className="landing-review-diff__contrast-lbl">Cashly Companion</span>
                                <span className="landing-review-diff__contrast-val text-emerald-700">0.2s Immediate</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: The Cashly Pipeline (Cadmium Orange + Interactive Process) */}
                <div className="landing-review-diff__cashly-pane">
                    <div className="landing-review-diff__cashly-tag">
                        <Check size={14} />
                        <span>THE CASHLY ARCHITECTURE</span>
                    </div>

                    <h3 className="landing-review-diff__cashly-headline">
                        CAPTURED.<br />
                        REVIEWED.<br />
                        CONNECTED.
                    </h3>

                    <p className="landing-review-diff__cashly-sub">
                        Step through the sovereign consent pipeline to see how raw checkouts become verified financial intelligence:
                    </p>

                    {/* Step Pipeline List */}
                    <div className="landing-review-diff__pipeline">
                        {pipelineSteps.map((step, idx) => {
                            const isPassed = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                                <div
                                    key={step.id}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`landing-pipeline-step ${isPassed ? 'landing-pipeline-step--active' : ''} ${isCurrent ? 'landing-pipeline-step--current' : ''}`}
                                >
                                    <div className="landing-pipeline-step__indicator">
                                        {isPassed ? '✓' : step.id}
                                    </div>
                                    <div className="landing-pipeline-step__info">
                                        <div className="landing-pipeline-step__head">
                                            <span className="landing-pipeline-step__name">{step.title}</span>
                                            <span className="landing-pipeline-step__badge">{step.tag}</span>
                                        </div>
                                        <p className="landing-pipeline-step__desc">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="landing-review-diff__pipeline-control">
                        <span>Click any step to inspect the state transition</span>
                        <button
                            onClick={() => setCurrentStep(prev => (prev === pipelineSteps.length - 1 ? 0 : prev + 1))}
                            className="landing-review-diff__next-btn"
                            type="button"
                        >
                            <span>Next Pipeline Stage</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}
