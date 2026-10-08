import { useState } from 'react';
import { Chrome, Inbox, Check, TrendingUp, Sliders, Sparkles, ArrowRight } from 'lucide-react';

interface StageData {
    id: string;
    num: string;
    tag: string;
    title: string;
    headline: string;
    description: string;
    accentColor: string;
    visualComponent: 'capture' | 'review' | 'understand' | 'plan' | 'predict' | 'act';
}

const stages: StageData[] = [
    {
        id: 'capture',
        num: '01',
        tag: 'SILENT INGESTION',
        title: 'CAPTURE',
        headline: 'Shop naturally. Checkouts stage themselves.',
        description: 'The lightweight browser companion captures purchase totals, merchants, and line items silently from Amazon, Shopify, Foodpanda, and any online store. Zero bank passwords needed.',
        accentColor: '#EE5024',
        visualComponent: 'capture'
    },
    {
        id: 'review',
        num: '02',
        tag: 'SOVEREIGN CONSENT',
        title: 'REVIEW',
        headline: 'Nothing posts until you approve it.',
        description: 'Captured checkouts wait in your private transaction inbox. Split dining expenses, change categories, or dismiss accidental checkouts before anything hits your ledger.',
        accentColor: '#F0A1CB',
        visualComponent: 'review'
    },
    {
        id: 'understand',
        num: '03',
        tag: 'CANONICAL LEDGER',
        title: 'UNDERSTAND',
        headline: 'A pristine financial record with zero guesswork.',
        description: 'Once approved, purchases enter a clean double-entry ledger. View unified totals, historical velocity, and category allocations without waiting for delayed bank feeds.',
        accentColor: '#111111',
        visualComponent: 'understand'
    },
    {
        id: 'plan',
        num: '04',
        tag: 'DYNAMIC VELOCITY',
        title: 'PLAN',
        headline: 'Budgets that breathe with your spending.',
        description: 'Budgets update instantly from approved transactions. See Safe to Spend metrics that automatically subtract upcoming recurring commitments before you make discretionary purchases.',
        accentColor: '#BBC7B1',
        visualComponent: 'plan'
    },
    {
        id: 'predict',
        num: '05',
        tag: 'MONEY TWIN ENGINE',
        title: 'PREDICT',
        headline: 'Know where your month ends before it does.',
        description: 'Money Twin models forward cashflow by analyzing burn rate, recurring bills, and historical variance. Adjust savings targets to see how trajectory changes in real time.',
        accentColor: '#80383D',
        visualComponent: 'predict'
    },
    {
        id: 'act',
        num: '06',
        tag: 'CONTEXTUAL INTELLIGENCE',
        title: 'ACT',
        headline: 'Intelligence grounded in your real numbers.',
        description: 'Not a chatbot reciting generic advice. A co-pilot that surfaces actionable decisions directly linked to your approved ledger data—ready to inspect, adjust, or execute.',
        accentColor: '#EE5024',
        visualComponent: 'act'
    },
];

export default function LifecycleStory() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [reviewApproved, setReviewApproved] = useState(false);
    const [capActivated, setCapActivated] = useState(false);
    const active = stages[activeIdx];

    return (
        <section id="lifecycle" className="landing-lifecycle scroll-mt-20">
            <div className="landing-lifecycle__intro">
                <div className="landing-lifecycle__badge">THE 6-STAGE ENGINE</div>
                <h2 className="landing-lifecycle__main-title">
                    HOW YOUR MONEY<br />
                    MOVES THROUGH CASHLY.
                </h2>
                <p className="landing-lifecycle__main-sub">
                    From checkout detection in your browser to predictive month-end forecasting.
                </p>
            </div>

            {/* Stage Selector Pills */}
            <div className="landing-lifecycle__pill-nav">
                {stages.map((stage, idx) => (
                    <button
                        key={stage.id}
                        onClick={() => setActiveIdx(idx)}
                        className={`landing-lifecycle__nav-btn ${activeIdx === idx ? 'landing-lifecycle__nav-btn--active' : ''}`}
                    >
                        <span className="landing-lifecycle__nav-num">{stage.num}</span>
                        <span className="landing-lifecycle__nav-label">{stage.title}</span>
                    </button>
                ))}
            </div>

            {/* Split Editorial Interactive Canvas */}
            <div className="landing-lifecycle__canvas">
                {/* Left: Monumental Stage Typography */}
                <div className="landing-lifecycle__text-pane">
                    <div className="landing-lifecycle__ghost-num">{active.num}</div>

                    <div className="landing-lifecycle__text-content">
                        <div
                            className="landing-lifecycle__stage-tag"
                            style={{ color: active.accentColor }}
                        >
                            ● {active.tag}
                        </div>

                        <h3 className="landing-lifecycle__stage-headline">
                            {active.headline}
                        </h3>

                        <p className="landing-lifecycle__stage-desc">
                            {active.description}
                        </p>

                        <div className="landing-lifecycle__stepper">
                            <span className="landing-lifecycle__stepper-status">
                                Stage {activeIdx + 1} of 6: <strong>{active.title}</strong>
                            </span>
                            <div className="landing-lifecycle__stepper-controls">
                                <button
                                    onClick={() => setActiveIdx(prev => (prev === 0 ? stages.length - 1 : prev - 1))}
                                    className="landing-lifecycle__step-btn"
                                    aria-label="Previous stage"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => setActiveIdx(prev => (prev === stages.length - 1 ? 0 : prev + 1))}
                                    className="landing-lifecycle__step-btn"
                                    aria-label="Next stage"
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Oversized Interactive Product Visual */}
                <div className="landing-lifecycle__visual-pane">
                    {/* Visual 01: Capture */}
                    {active.visualComponent === 'capture' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--capture">
                            <div className="landing-lifecycle__window-bar">
                                <div className="landing-lifecycle__window-dots">
                                    <span /><span /><span />
                                </div>
                                <span className="landing-lifecycle__window-url">amazon.com/gp/buy/spc/handlers/display.html</span>
                                <span className="landing-lifecycle__window-badge">BROWSER COMPANION ACTIVE</span>
                            </div>
                            <div className="landing-lifecycle__scene-body">
                                <div className="landing-lifecycle__amazon-preview">
                                    <div className="landing-lifecycle__amz-header">Amazon Order Total: Rs 4,250</div>
                                    <div className="landing-lifecycle__amz-meta">Item: Logitech MX Master 3S Wireless Mouse</div>
                                    <div className="landing-lifecycle__amz-status">Order Placed Successfully</div>
                                </div>
                                <div className="landing-lifecycle__capture-card">
                                    <div className="landing-lifecycle__cap-head">
                                        <Chrome size={18} color="#EE5024" />
                                        <span>Cashly Extension Detected Checkout</span>
                                    </div>
                                    <div className="landing-lifecycle__cap-amount">Rs 4,250</div>
                                    <div className="landing-lifecycle__cap-pill">
                                        <span>✓ Staged to Review Queue</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual 02: Review */}
                    {active.visualComponent === 'review' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--review">
                            {!reviewApproved ? (
                                <div className="landing-lifecycle__inbox-card">
                                    <div className="landing-lifecycle__inbox-head">
                                        <Inbox size={18} />
                                        <span>Quiet Transaction Inbox (1 Item Awaiting Approval)</span>
                                    </div>
                                    <div className="landing-lifecycle__tx-item">
                                        <div>
                                            <div className="landing-lifecycle__tx-merchant">Amazon Electronics</div>
                                            <div className="landing-lifecycle__tx-time">Captured 2 minutes ago · Office Tech</div>
                                        </div>
                                        <div className="landing-lifecycle__tx-price">Rs 4,250</div>
                                    </div>
                                    <div className="landing-lifecycle__inbox-actions">
                                        <button onClick={() => setReviewApproved(true)} className="landing-lifecycle__btn-approve">
                                            <Check size={14} /> Approve to Ledger
                                        </button>
                                        <button className="landing-lifecycle__btn-split">Split</button>
                                        <button className="landing-lifecycle__btn-dismiss">Dismiss</button>
                                    </div>
                                    <div className="landing-lifecycle__inbox-note">
                                        Notice: Ledger remains untouched until you click Approve.
                                    </div>
                                </div>
                            ) : (
                                <div className="landing-lifecycle__inbox-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: '#131A16' }}>
                                    <div className="landing-lifecycle__inbox-head">
                                        <Check size={18} color="#10B981" />
                                        <span style={{ color: '#10B981' }}>Inbox Cleared · Sovereign Consent Granted</span>
                                    </div>
                                    <div className="landing-lifecycle__tx-item" style={{ borderBottomColor: 'rgba(16, 185, 129, 0.2)' }}>
                                        <div>
                                            <div className="landing-lifecycle__tx-merchant">Amazon Electronics · Logitech Mouse</div>
                                            <div className="landing-lifecycle__tx-time" style={{ color: '#10B981' }}>✓ Posted to Canonical Ledger</div>
                                        </div>
                                        <div className="landing-lifecycle__tx-price">Rs 4,250</div>
                                    </div>
                                    <div className="landing-lifecycle__inbox-actions" style={{ justifyContent: 'space-between' }}>
                                        <button onClick={() => setActiveIdx(2)} className="landing-lifecycle__btn-approve" style={{ background: '#10B981', color: '#000', fontWeight: 600 }}>
                                            Inspect in Stage 03 (Understand) →
                                        </button>
                                        <button onClick={() => setReviewApproved(false)} className="landing-lifecycle__btn-dismiss">Reset</button>
                                    </div>
                                    <div className="landing-lifecycle__inbox-note" style={{ color: '#A3A3A3' }}>
                                        Ledger balances updated immediately. Budgets & Money Twin recalculated.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Visual 03: Understand */}
                    {active.visualComponent === 'understand' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--understand">
                            <div className="landing-lifecycle__ledger-card">
                                <div className="landing-lifecycle__ledger-header">
                                    <span>CANONICAL LEDGER (SEPTEMBER)</span>
                                    <span className="landing-lifecycle__ledger-verified">● VERIFIED BALANCES</span>
                                </div>
                                <div className="landing-lifecycle__ledger-metric">
                                    <span className="landing-lifecycle__ledger-big">Rs 78,200</span>
                                    <span className="landing-lifecycle__ledger-sub">Total Discretionary Outflow</span>
                                </div>
                                <div className="landing-lifecycle__ledger-rows">
                                    <div className="landing-lifecycle__l-row" style={reviewApproved ? { borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' } : {}}>
                                        <span>Amazon Electronics (Mouse) {reviewApproved && <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 700 }}>● JUST POSTED</span>}</span>
                                        <span className="landing-lifecycle__l-approved">Approved · Rs 4,250</span>
                                    </div>
                                    <div className="landing-lifecycle__l-row">
                                        <span>Whole Foods Market</span>
                                        <span className="landing-lifecycle__l-approved">Approved · Rs 14,800</span>
                                    </div>
                                    <div className="landing-lifecycle__l-row">
                                        <span>Cloud Infrastructure</span>
                                        <span className="landing-lifecycle__l-approved">Approved · Rs 3,400</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual 04: Plan */}
                    {active.visualComponent === 'plan' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--plan">
                            <div className="landing-lifecycle__plan-card">
                                <div className="landing-lifecycle__plan-top">
                                    <div>
                                        <div className="landing-lifecycle__plan-label">SAFE TO SPEND TODAY</div>
                                        <div className="landing-lifecycle__plan-val">Rs 42,870</div>
                                    </div>
                                    <div className="landing-lifecycle__plan-status">HEALTHY VELOCITY</div>
                                </div>
                                <div className="landing-lifecycle__budget-bar-track">
                                    <div className="landing-lifecycle__budget-bar-fill" style={{ width: '48%' }} />
                                </div>
                                <div className="landing-lifecycle__commitments-box">
                                    <div className="landing-lifecycle__commit-title">Locked Commitments Ahead (Next 14 Days):</div>
                                    <div className="landing-lifecycle__commit-item">
                                        <span>Apartment Lease Payment</span>
                                        <span>Rs 65,000</span>
                                    </div>
                                    <div className="landing-lifecycle__commit-item">
                                        <span>High-Speed Internet</span>
                                        <span>Rs 3,200</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual 05: Predict */}
                    {active.visualComponent === 'predict' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--predict">
                            <div className="landing-lifecycle__predict-card">
                                <div className="landing-lifecycle__predict-tag">MONEY TWIN TRAJECTORY</div>
                                <div className="landing-lifecycle__predict-head">If nothing changes, month ends with:</div>
                                <div className="landing-lifecycle__predict-metric">
                                    <span>Rs 24,150</span>
                                    <span className="landing-lifecycle__predict-runway">42 Days Runway</span>
                                </div>
                                <div className="landing-lifecycle__predict-chart">
                                    <svg viewBox="0 0 340 90" style={{ width: '100%', height: '80px' }}>
                                        <path d="M0 60 Q 90 40, 180 30 T 340 15" stroke="var(--landing-orange)" strokeWidth="3" fill="none" />
                                        <path d="M0 60 Q 90 55, 180 50 T 340 45" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                                        <circle cx="180" cy="30" r="5" fill="var(--landing-orange)" />
                                    </svg>
                                </div>
                                <div className="landing-lifecycle__predict-caption">
                                    Continuous burn-rate modeling prevents month-end deficit shocks.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual 06: Act */}
                    {active.visualComponent === 'act' && (
                        <div className="landing-lifecycle__scene landing-lifecycle__scene--act">
                            <div className="landing-lifecycle__act-card">
                                <div className="landing-lifecycle__act-badge">
                                    <Sparkles size={16} />
                                    <span>CONTEXTUAL AI ACTION CHIP</span>
                                </div>
                                <div className="landing-lifecycle__act-statement">
                                    Dining Out is <strong>+34% above</strong> normal 30-day velocity.
                                </div>
                                <div className="landing-lifecycle__act-impact">
                                    Projected Month-End Impact: <strong>-Rs 6,300</strong> to cash runway.
                                </div>
                                <div className="landing-lifecycle__act-buttons">
                                    {!capActivated ? (
                                        <>
                                            <button onClick={() => setCapActivated(true)} className="landing-lifecycle__act-btn landing-lifecycle__act-btn--primary">
                                                Cap Dining Budget at Rs 20,000
                                            </button>
                                            <button className="landing-lifecycle__act-btn">
                                                Inspect Dining Transactions
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#10B981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <span>✓ Cap Active: Rs 20,000 (+4 days runway restored)</span>
                                            <button onClick={() => setCapActivated(false)} style={{ background: 'none', border: 'none', color: '#10B981', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>Reset</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
