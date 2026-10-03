import { useState } from 'react';
import { Sparkles, AlertCircle, ArrowRight, Check, CheckCircle2 } from 'lucide-react';

interface Anomaly {
    id: string;
    category: string;
    metric: string;
    impact: string;
    impactType: 'warning' | 'opportunity' | 'alert';
    headline: string;
    explanation: string;
    actions: { label: string; primary?: boolean }[];
}

const anomalies: Anomaly[] = [
    {
        id: 'dining',
        category: 'DINING OUT',
        metric: '+34% ABOVE BASELINE',
        impact: '-Rs 6,300 Runway Impact',
        impactType: 'warning',
        headline: 'Discretionary Dining Velocity Alert',
        explanation: 'At your current 7-day pace, dining expenses will exceed monthly category allocation by the 24th, reducing projected cash runway by 4.2 days.',
        actions: [
            { label: 'Cap Dining Category to Rs 20,000', primary: true },
            { label: 'Inspect 6 Recent Dining Charges' },
            { label: 'Simulate Offset from Shopping' }
        ]
    },
    {
        id: 'sub',
        category: 'CLOUD SUBSCRIPTION',
        metric: '+Rs 1,400 TIER SHIFT',
        impact: 'Recurring Cost Increase',
        impactType: 'alert',
        headline: 'Automated Tier Escalation Detected',
        explanation: 'DigitalOcean billed Rs 4,800 instead of normal Rs 3,400. Companion flagged a cluster tier change during yesterday’s deployment.',
        actions: [
            { label: 'Acknowledge Recurring Change', primary: true },
            { label: 'Inspect Compute Invoices' }
        ]
    },
    {
        id: 'buffer',
        category: 'UTILITY SURPLUS',
        metric: 'Rs 3,200 UNDER BUDGET',
        impact: '+2.8 Days Runway Gained',
        impactType: 'opportunity',
        headline: 'Unallocated Cashflow Surplus',
        explanation: 'Electricity utility was lower than anticipated. Money Twin recommends routing this surplus to your emergency runway goal.',
        actions: [
            { label: 'Transfer Rs 3,200 to Emergency Fund', primary: true },
            { label: 'Absorb into General Buffer' }
        ]
    }
];

export default function AIShowcase() {
    const [selectedAnomaly, setSelectedAnomaly] = useState<string>('dining');
    const [actionApplied, setActionApplied] = useState(false);

    const active = anomalies.find(a => a.id === selectedAnomaly) || anomalies[0];

    const handleApply = () => {
        setActionApplied(true);
        setTimeout(() => setActionApplied(false), 2400);
    };

    return (
        <section id="assist" className="landing-ai-showcase scroll-mt-20">
            <div className="landing-ai-showcase__header">
                <div className="landing-ai-showcase__tag">
                    <Sparkles size={14} />
                    <span>CONTEXTUAL FINANCIAL INTELLIGENCE</span>
                </div>

                <h2 className="landing-ai-showcase__title">
                    INTELLIGENCE GROUNDED<br />
                    IN REAL NUMBERS.
                </h2>

                <p className="landing-ai-showcase__sub">
                    No conversational chatbots repeating internet trivia. Cashly Assist operates as an autonomous
                    financial co-pilot that surfaces concrete decision surfaces and executable action chips.
                </p>
            </div>

            {/* Split Financial Decision Surface */}
            <div className="landing-ai-showcase__grid">

                {/* Left: Live Anomaly Selector List */}
                <div className="landing-ai-showcase__list">
                    <span className="ai-list-head">ACTIVE ANOMALY FEEDS (3 DETECTED)</span>

                    {anomalies.map((a) => {
                        const isSelected = a.id === selectedAnomaly;
                        return (
                            <div
                                key={a.id}
                                onClick={() => setSelectedAnomaly(a.id)}
                                className={`ai-anomaly-item ${isSelected ? 'ai-anomaly-item--active' : ''}`}
                            >
                                <div className="ai-anomaly-item__top">
                                    <span className="ai-anomaly-cat">{a.category}</span>
                                    <span className={`ai-anomaly-badge ai-anomaly-badge--${a.impactType}`}>
                                        {a.metric}
                                    </span>
                                </div>
                                <div className="ai-anomaly-headline">{a.headline}</div>
                                <div className="ai-anomaly-impact">{a.impact}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Technical Decision Surface Card */}
                <div className="landing-ai-showcase__surface">
                    <div className="ai-surface-top">
                        <div className="ai-surface-badge">
                            <span className="ai-pulse-dot" />
                            <span>CO-PILOT EXECUTION READY</span>
                        </div>
                        <span className="ai-surface-category">{active.category}</span>
                    </div>

                    <h3 className="ai-surface-title">{active.headline}</h3>
                    <p className="ai-surface-explanation">{active.explanation}</p>

                    <div className="ai-surface-decision-box">
                        <div className="ai-decision-head">
                            <span>RECOMMENDED ACTION CHIPS:</span>
                            <span className="ai-verified-tag">Zero-Hallucination Guardrail</span>
                        </div>

                        <div className="ai-action-chips">
                            {active.actions.map((act, i) => (
                                <button
                                    key={i}
                                    onClick={handleApply}
                                    className={`ai-chip-btn ${act.primary ? 'ai-chip-btn--primary' : ''}`}
                                >
                                    <span>{act.label}</span>
                                    {act.primary && <ArrowRight size={14} />}
                                </button>
                            ))}
                        </div>

                        {actionApplied && (
                            <div className="ai-action-feedback landing-animate-in">
                                <CheckCircle2 size={16} color="#10B981" />
                                <span>Action executed successfully. Canonical ledger and runway updated.</span>
                            </div>
                        )}
                    </div>

                    <div className="ai-surface-footnote">
                        All Cashly insights are computed deterministically from verified ledger transactions.
                    </div>
                </div>

            </div>
        </section>
    );
}
