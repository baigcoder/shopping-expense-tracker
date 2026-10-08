import { useState } from 'react';
import { Home, ListOrdered, Calendar, BarChart3, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

type PillarKey = 'home' | 'activity' | 'plan' | 'analyze' | 'assist';

interface PillarConfig {
    key: PillarKey;
    num: string;
    name: string;
    tagline: string;
    headline: string;
    description: string;
    accentColor: string;
}

const pillars: PillarConfig[] = [
    {
        key: 'home',
        num: '01',
        name: 'HOME',
        tagline: 'COMMAND CENTER & RUNWAY',
        headline: 'Every account, commitment, and runway metric at a glance.',
        description: 'See exactly how much you can safely spend today after subtracting upcoming locked commitments like rent, utilities, and scheduled transfers.',
        accentColor: '#EE5024'
    },
    {
        key: 'activity',
        num: '02',
        name: 'ACTIVITY',
        tagline: 'TRANSACTION LEDGER & REVIEW INBOX',
        headline: 'Sovereign review queue meeting canonical double-entry ledger.',
        description: 'Review staged checkouts captured silently by your browser companion. Recategorize, split, or dismiss before transactions are permanently posted.',
        accentColor: '#F0A1CB'
    },
    {
        key: 'plan',
        num: '03',
        name: 'PLAN',
        tagline: 'DYNAMIC BUDGETS & COMMITMENTS',
        headline: 'Forward-looking envelopes that breathe with your velocity.',
        description: 'Budgets recalculate automatically as purchases post. Warning thresholds trigger before you overspend, protecting your cashflow cushion.',
        accentColor: '#80383D'
    },
    {
        key: 'analyze',
        num: '04',
        name: 'ANALYZE',
        tagline: 'VELOCITY TRENDS & BURNDOWN',
        headline: 'Understand historical burn variance and category skew.',
        description: 'Compare actual spending trajectories against 30-day and 90-day moving baselines. Identify lifestyle creep before it impacts your net worth.',
        accentColor: '#BBC7B1'
    },
    {
        key: 'assist',
        num: '05',
        name: 'ASSIST',
        tagline: 'CONTEXTUAL FINANCIAL CO-PILOT',
        headline: 'Actionable financial decisions generated from real ledger numbers.',
        description: 'Not a conversational chatbot repeating generic tips. An autonomous co-pilot that spots anomalies and prepares executable action chips.',
        accentColor: '#EE5024'
    }
];

export default function PillarSystem() {
    const [activePillar, setActivePillar] = useState<PillarKey>('home');
    const [activityApproved, setActivityApproved] = useState(false);
    const [assistExecuted, setAssistExecuted] = useState(false);
    const current = pillars.find(p => p.key === activePillar) || pillars[0];

    return (
        <section id="pillars" className="landing-pillars scroll-mt-20">
            <div className="landing-pillars__header">
                <div className="landing-pillars__tag">THE FIVE-PILLAR SYSTEM</div>
                <h2 className="landing-pillars__title">
                    ONE FINANCIAL SYSTEM.<br />
                    FIVE SYNCHRONIZED PILLARS.
                </h2>
                <p className="landing-pillars__sub">
                    No siloed spreadsheets or disconnected tools. Every surface feeds into the canonical record.
                </p>
            </div>

            {/* Interconnected Pillar Tabs */}
            <div className="landing-pillars__tabs-bar">
                {pillars.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => setActivePillar(p.key)}
                        className={`pillar-tab-btn ${activePillar === p.key ? 'pillar-tab-btn--active' : ''}`}
                    >
                        <span className="pillar-tab-num">{p.num}</span>
                        <span className="pillar-tab-name">{p.name}</span>
                        <span className="pillar-tab-indicator" style={{ background: p.accentColor }} />
                    </button>
                ))}
            </div>

            {/* Dominant Pillar System Canvas */}
            <div className="landing-pillars__display-canvas">
                {/* Left: Deep Editorial Context */}
                <div className="landing-pillars__narrative">
                    <div className="pillar-narrative-tag" style={{ color: current.accentColor }}>
                        ● {current.tagline}
                    </div>

                    <h3 className="pillar-narrative-headline">
                        {current.headline}
                    </h3>

                    <p className="pillar-narrative-desc">
                        {current.description}
                    </p>

                    <div className="pillar-narrative-features">
                        <div className="p-feature-row">
                            <CheckCircle2 size={16} color={current.accentColor} />
                            <span>Real-time bidirectional synchronization</span>
                        </div>
                        <div className="p-feature-row">
                            <CheckCircle2 size={16} color={current.accentColor} />
                            <span>Zero-password capture architecture</span>
                        </div>
                        <div className="p-feature-row">
                            <CheckCircle2 size={16} color={current.accentColor} />
                            <span>Deterministic Money Twin runway calculation</span>
                        </div>
                    </div>
                </div>

                {/* Right: Dynamic High-Fidelity Product Surface */}
                <div className="landing-pillars__surface">

                    {/* Surface: Home */}
                    {activePillar === 'home' && (
                        <div className="p-surface-card landing-animate-in">
                            <div className="p-surface-bar">
                                <span>HOME CONSOLE / RUNWAY</span>
                                <span className="p-surface-status">LIVE SYNC</span>
                            </div>
                            <div className="p-home-metric-box">
                                <span className="p-metric-label">SAFE TO SPEND TODAY</span>
                                <div className="p-metric-large">Rs 42,870</div>
                                <div className="p-metric-footer">
                                    <span>Target Burn: Rs 1,420/day</span>
                                    <span>· Next Bill: Rs 3,400 in 4d</span>
                                </div>
                            </div>
                            <div className="p-runway-status-bar">
                                <div className="p-runway-track">
                                    <div className="p-runway-fill" style={{ width: '68%' }} />
                                </div>
                                <div className="p-runway-text">
                                    <span>Month Progress: 60%</span>
                                    <strong>42 Days Total Projected Runway</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Surface: Activity */}
                    {activePillar === 'activity' && (
                        <div className="p-surface-card landing-animate-in">
                            <div className="p-surface-bar">
                                <span>CANONICAL INBOX & LEDGER</span>
                                <span className="p-surface-status p-surface-status--orange">
                                    {!activityApproved ? '1 NEW TO REVIEW' : '0 PENDING · RECONCILED'}
                                </span>
                            </div>
                            <div className="p-activity-inbox-item">
                                <div>
                                    <div className="p-act-title">Amazon Electronics (Captured at Checkout)</div>
                                    <div className="p-act-sub">Logitech MX Master 3S Wireless Mouse</div>
                                </div>
                                <div className="p-act-amount">Rs 4,250</div>
                            </div>
                            <div className="p-inbox-cta-bar">
                                {!activityApproved ? (
                                    <>
                                        <button onClick={() => setActivityApproved(true)} className="p-btn-approve" type="button">
                                            Approve to Canonical Ledger
                                        </button>
                                        <button className="p-btn-secondary" type="button">Split</button>
                                        <button className="p-btn-secondary" type="button">Dismiss</button>
                                    </>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#059669',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        padding: '6px 12px',
                                        background: '#ECFDF5',
                                        borderRadius: '8px'
                                    }}>
                                        <CheckCircle2 size={15} />
                                        <span>Posted to Ledger • Safe to Spend Updated: Rs 42,870</span>
                                        <button
                                            onClick={() => setActivityApproved(false)}
                                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#666' }}
                                            type="button"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Surface: Plan */}
                    {activePillar === 'plan' && (
                        <div className="p-surface-card landing-animate-in">
                            <div className="p-surface-bar">
                                <span>BUDGET ALLOCATION (SEPTEMBER)</span>
                                <span className="p-surface-status">ACTIVE</span>
                            </div>
                            <div className="p-budget-bars">
                                <div className="p-b-row">
                                    <div className="p-b-info">
                                        <span>Housing Lease</span>
                                        <strong>Rs 65,000 / Rs 65,000 (100%)</strong>
                                    </div>
                                    <div className="p-b-track"><div style={{ width: '100%', background: '#80383D' }} /></div>
                                </div>
                                <div className="p-b-row">
                                    <div className="p-b-info">
                                        <span>Groceries & Food</span>
                                        <strong>Rs 24,500 / Rs 35,000 (70%)</strong>
                                    </div>
                                    <div className="p-b-track"><div style={{ width: '70%', background: '#EE5024' }} /></div>
                                </div>
                                <div className="p-b-row">
                                    <div className="p-b-info">
                                        <span>Cloud Subscriptions</span>
                                        <strong>Rs 7,650 / Rs 15,000 (51%)</strong>
                                    </div>
                                    <div className="p-b-track"><div style={{ width: '51%', background: '#F0A1CB' }} /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Surface: Analyze */}
                    {activePillar === 'analyze' && (
                        <div className="p-surface-card landing-animate-in">
                            <div className="p-surface-bar">
                                <span>DISCRETIONARY VELOCITY ANALYSIS</span>
                                <span className="p-surface-status">HISTORICAL 90D</span>
                            </div>
                            <div className="p-analyze-metric">
                                <span>Rs 78,200</span>
                                <small>-14% vs 30-day baseline</small>
                            </div>
                            <div className="p-dual-bars-visual">
                                <svg viewBox="0 0 320 80" style={{ width: '100%', height: '70px' }}>
                                    <rect x="20" y="30" width="10" height="50" rx="2" fill="#111111" />
                                    <rect x="35" y="45" width="10" height="35" rx="2" fill="rgba(0,0,0,0.15)" />
                                    <rect x="80" y="20" width="10" height="60" rx="2" fill="#111111" />
                                    <rect x="95" y="40" width="10" height="40" rx="2" fill="rgba(0,0,0,0.15)" />
                                    <rect x="140" y="10" width="10" height="70" rx="2" fill="#111111" />
                                    <rect x="155" y="25" width="10" height="55" rx="2" fill="var(--landing-orange)" />
                                    <rect x="200" y="35" width="10" height="45" rx="2" fill="#111111" />
                                    <rect x="215" y="50" width="10" height="30" rx="2" fill="rgba(0,0,0,0.15)" />
                                    <rect x="260" y="25" width="10" height="55" rx="2" fill="#111111" />
                                    <rect x="275" y="45" width="10" height="35" rx="2" fill="rgba(0,0,0,0.15)" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Surface: Assist */}
                    {activePillar === 'assist' && (
                        <div className="p-surface-card landing-animate-in">
                            <div className="p-surface-bar">
                                <span>CONTEXTUAL CO-PILOT CHIPS</span>
                                <span className="p-surface-status p-surface-status--purple">ACTIONABLE</span>
                            </div>
                            <div className="p-assist-moment">
                                <div className="p-assist-badge-pill">
                                    <Sparkles size={14} />
                                    <span>LIFESTYLE CREEP ALERT</span>
                                </div>
                                <div className="p-assist-headline">
                                    Dining Out pace will exhaust your monthly allocation <strong>6 days early</strong>.
                                </div>
                                {!assistExecuted ? (
                                    <div className="p-assist-chips">
                                        <button onClick={() => setAssistExecuted(true)} className="p-chip-primary" type="button">
                                            Cap Daily Dining to Rs 800
                                        </button>
                                        <button onClick={() => setAssistExecuted(true)} className="p-chip-secondary" type="button">
                                            Shift Rs 5,000 from Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#059669',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        marginTop: '14px',
                                        padding: '8px 12px',
                                        background: '#ECFDF5',
                                        borderRadius: '8px'
                                    }}>
                                        <CheckCircle2 size={15} />
                                        <span>Decision chip executed: Dining budget capped at Rs 800/day</span>
                                        <button
                                            onClick={() => setAssistExecuted(false)}
                                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#666' }}
                                            type="button"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}
