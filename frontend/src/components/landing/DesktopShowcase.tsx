import { useState } from 'react';
import { Home, ListOrdered, Calendar, BarChart3, Sparkles, CheckCircle2, Clock, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { CashlyMark } from '@/components/brand/CashlyLogo';
import { useLandingSettings } from './useLandingSettings';

export default function DesktopShowcase() {
    const { formatAmount } = useLandingSettings();
    const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'plan' | 'analyze'>('home');
    const [approvedItems, setApprovedItems] = useState<{ [key: string]: boolean }>({});

    const handleApprove = (id: string) => {
        setApprovedItems(prev => ({ ...prev, [id]: true }));
    };

    const pendingCount = 2 - Object.keys(approvedItems).filter(k => approvedItems[k]).length;

    return (
        <section id="desktop-showcase" className="landing-desktop-showcase scroll-mt-20">
            <div className="landing-desktop-showcase__header">
                <div className="landing-desktop-showcase__tag">DESKTOP WORKSTATION</div>
                <h2 className="landing-desktop-showcase__title">
                    BUILT FOR DEEP<br />
                    FINANCIAL CONTROL.
                </h2>
                <p className="landing-desktop-showcase__sub">
                    A responsive, desktop-class finance workstation built for clarity.
                    Switch between operating surfaces below to experience the interconnected console:
                </p>
            </div>

            {/* Oversized Cinematic Desktop Window Frame */}
            <div className="landing-desktop-showcase__frame">
                {/* Desktop Window Title Bar */}
                <div className="landing-desktop-showcase__window-bar">
                    <div className="landing-desktop-showcase__dots">
                        <span className="dot dot--red" />
                        <span className="dot dot--yellow" />
                        <span className="dot dot--green" />
                    </div>
                    <div className="landing-desktop-showcase__address">
                        <span>cashly.app / console / {activeTab}</span>
                    </div>
                    <div className="landing-desktop-showcase__status-badge">
                        <span className="pulse-indicator" />
                        <span>SYNCHRONIZED WITH BROWSER COMPANION</span>
                    </div>
                </div>

                {/* Inner Desktop Console Layout */}
                <div className="landing-desktop-showcase__body">
                    {/* Mini Sidebar */}
                    <div className="landing-desktop-showcase__sidebar">
                        <div>
                            <div className="landing-desktop-showcase__brand">
                                <CashlyMark size={24} variant="orange" />
                                <span className="brand-text-small">Cashly</span>
                            </div>

                            <nav className="landing-desktop-showcase__nav">
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className={`d-nav-item ${activeTab === 'home' ? 'd-nav-item--active' : ''}`}
                                    type="button"
                                >
                                    <Home size={15} />
                                    <span>Home</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`d-nav-item ${activeTab === 'activity' ? 'd-nav-item--active' : ''}`}
                                    type="button"
                                >
                                    <ListOrdered size={15} />
                                    <span>Activity</span>
                                    {pendingCount > 0 && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '10px',
                                            padding: '1px 6px',
                                            borderRadius: '100px',
                                            background: activeTab === 'activity' ? 'var(--landing-orange)' : '#FDEEE9',
                                            color: activeTab === 'activity' ? 'white' : 'var(--landing-orange)',
                                            fontWeight: 700
                                        }}>
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('plan')}
                                    className={`d-nav-item ${activeTab === 'plan' ? 'd-nav-item--active' : ''}`}
                                    type="button"
                                >
                                    <Calendar size={15} />
                                    <span>Plan</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('analyze')}
                                    className={`d-nav-item ${activeTab === 'analyze' ? 'd-nav-item--active' : ''}`}
                                    type="button"
                                >
                                    <BarChart3 size={15} />
                                    <span>Analyze</span>
                                </button>
                            </nav>
                        </div>

                        <div className="landing-desktop-showcase__sidebar-user">
                            <div className="user-avatar">DD</div>
                            <div className="user-info">
                                <span className="user-name">David Daniels</span>
                                <span className="user-tier">Pro Account</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Workstation Canvas */}
                    <div className="landing-desktop-showcase__main">

                        {/* ──────────────── TAB 1: HOME ──────────────── */}
                        {activeTab === 'home' && (
                            <div className="d-view-container">
                                {/* Top KPI Metric Cards */}
                                <div className="landing-desktop-showcase__kpi-grid">
                                    <div className="d-kpi-card d-kpi-card--primary">
                                        <span className="d-kpi-label">SAFE TO SPEND THIS MONTH</span>
                                        <div className="d-kpi-val">{formatAmount(42870)}</div>
                                        <div className="d-kpi-foot">
                                            <span className="d-kpi-trend">Velocity: Steady</span>
                                            <span>· Next bill in 4 days</span>
                                        </div>
                                    </div>

                                    <div className="d-kpi-card">
                                        <span className="d-kpi-label">FORWARD RUNWAY</span>
                                        <div className="d-kpi-val">42 Days</div>
                                        <div className="d-kpi-foot">
                                            <span>Based on 30-day moving burn</span>
                                        </div>
                                    </div>

                                    <div className="d-kpi-card">
                                        <span className="d-kpi-label">LOCKED COMMITMENTS</span>
                                        <div className="d-kpi-val">{formatAmount(68200)}</div>
                                        <div className="d-kpi-foot">
                                            <span>4 active recurring commitments</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Canonical Ledger Feed */}
                                <div className="landing-desktop-showcase__ledger-panel">
                                    <div className="ledger-panel-head">
                                        <div>
                                            <h4 className="ledger-title">Canonical Ledger Activity</h4>
                                            <p className="ledger-sub">Approved, verified transactions feeding your Money Twin model</p>
                                        </div>
                                        <span className="ledger-pill">{pendingCount} Items in Review Queue</span>
                                    </div>

                                    <div className="ledger-table">
                                        <div className="ledger-row ledger-row--head">
                                            <span>MERCHANT & DETAILS</span>
                                            <span>CATEGORY</span>
                                            <span>SOURCE</span>
                                            <span>AMOUNT</span>
                                            <span>STATUS</span>
                                        </div>

                                        <div className="ledger-row">
                                            <div>
                                                <div className="merchant-name">Amazon Electronics</div>
                                                <div className="merchant-sub">Logitech MX Master 3S Wireless Mouse</div>
                                            </div>
                                            <span className="cat-badge">Office Tech</span>
                                            <span className="source-badge">Browser Companion</span>
                                            <span className="amount-num">{formatAmount(4250)}</span>
                                            <span className="status-approved">
                                                <CheckCircle2 size={13} /> Approved
                                            </span>
                                        </div>

                                        <div className="ledger-row">
                                            <div>
                                                <div className="merchant-name">Whole Foods Market</div>
                                                <div className="merchant-sub">Weekly Groceries & Organic Produce</div>
                                            </div>
                                            <span className="cat-badge">Groceries</span>
                                            <span className="source-badge">Manual Card</span>
                                            <span className="amount-num">{formatAmount(14800)}</span>
                                            <span className="status-approved">
                                                <CheckCircle2 size={13} /> Approved
                                            </span>
                                        </div>

                                        <div className="ledger-row">
                                            <div>
                                                <div className="merchant-name">DigitalOcean Cloud</div>
                                                <div className="merchant-sub">Monthly App Cluster Server Infrastructure</div>
                                            </div>
                                            <span className="cat-badge">Subscriptions</span>
                                            <span className="source-badge">Recurring Auto</span>
                                            <span className="amount-num">{formatAmount(3400)}</span>
                                            <span className="status-approved">
                                                <CheckCircle2 size={13} /> Approved
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── TAB 2: ACTIVITY ──────────────── */}
                        {activeTab === 'activity' && (
                            <div className="d-view-container">
                                {/* Pending Review Queue Banner */}
                                <div className="d-inbox-section">
                                    <div className="d-inbox-header">
                                        <div className="d-inbox-title">
                                            <span>Sovereign Review Queue</span>
                                            <span className="d-inbox-count">{pendingCount} Awaiting Approval</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#777' }}>Ledger is immutable until approved</span>
                                    </div>

                                    <div className="d-inbox-items">
                                        {/* Card 1: Amazon Checkout */}
                                        <div className="d-inbox-card">
                                            <div className="d-inbox-card-meta">
                                                <div className="d-inbox-icon">📦</div>
                                                <div className="d-inbox-card-details">
                                                    <strong>Sony WH-1000XM5 Noise Canceling Headphones</strong>
                                                    <span>amazon.com · Detected via Extension · Discretionary</span>
                                                </div>
                                            </div>
                                            <div className="d-inbox-card-actions">
                                                <span className="d-inbox-price">{formatAmount(34990)}</span>
                                                {!approvedItems['item-1'] ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove('item-1')}
                                                            className="d-btn-approve"
                                                            type="button"
                                                        >
                                                            <Check size={13} />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button className="d-btn-dismiss" type="button">Dismiss</button>
                                                    </>
                                                ) : (
                                                    <span className="d-approved-state">
                                                        <CheckCircle2 size={14} /> Reconciled to Ledger
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card 2: Foodpanda */}
                                        <div className="d-inbox-card">
                                            <div className="d-inbox-card-meta">
                                                <div className="d-inbox-icon">🍱</div>
                                                <div className="d-inbox-card-details">
                                                    <strong>Office Team Lunch & Beverages</strong>
                                                    <span>foodpanda.pk · Detected via Extension · Dining</span>
                                                </div>
                                            </div>
                                            <div className="d-inbox-card-actions">
                                                <span className="d-inbox-price">{formatAmount(1240)}</span>
                                                {!approvedItems['item-2'] ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove('item-2')}
                                                            className="d-btn-approve"
                                                            type="button"
                                                        >
                                                            <Check size={13} />
                                                            <span>Approve</span>
                                                        </button>
                                                        <button className="d-btn-dismiss" type="button">Dismiss</button>
                                                    </>
                                                ) : (
                                                    <span className="d-approved-state">
                                                        <CheckCircle2 size={14} /> Reconciled to Ledger
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reconciled Canonical Ledger Feed */}
                                <div className="landing-desktop-showcase__ledger-panel" style={{ marginTop: 0 }}>
                                    <div className="ledger-panel-head">
                                        <h4 className="ledger-title">Canonical Double-Entry Ledger (45 Verified)</h4>
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>● SHA-256 Checksums Valid</span>
                                    </div>

                                    <div className="ledger-table">
                                        <div className="ledger-row ledger-row--head">
                                            <span>MERCHANT & DETAILS</span>
                                            <span>CATEGORY</span>
                                            <span>SOURCE</span>
                                            <span>AMOUNT</span>
                                            <span>STATUS</span>
                                        </div>
                                        <div className="ledger-row">
                                            <div>
                                                <div className="merchant-name">Whole Foods Market</div>
                                                <div className="merchant-sub">Organic Groceries & Provisions</div>
                                            </div>
                                            <span className="cat-badge">Groceries</span>
                                            <span className="source-badge">Manual Card</span>
                                            <span className="amount-num">Rs 14,800</span>
                                            <span className="status-approved"><CheckCircle2 size={13} /> Approved</span>
                                        </div>
                                        <div className="ledger-row">
                                            <div>
                                                <div className="merchant-name">K-Electric Utility</div>
                                                <div className="merchant-sub">Monthly Commercial Power Bill</div>
                                            </div>
                                            <span className="cat-badge">Utilities</span>
                                            <span className="source-badge">Bank Direct</span>
                                            <span className="amount-num">{formatAmount(18200)}</span>
                                            <span className="status-approved"><CheckCircle2 size={13} /> Approved</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── TAB 3: PLAN ──────────────── */}
                        {activeTab === 'plan' && (
                            <div className="d-view-container">
                                <div className="d-plan-grid">
                                    {/* Category Envelopes */}
                                    <div className="d-envelopes-box">
                                        <div className="d-box-title">
                                            <span>Category Budget Envelopes</span>
                                            <span style={{ fontSize: '11px', color: '#059669' }}>72% Total Capacity</span>
                                        </div>

                                        <div className="d-envelope-item">
                                            <div className="d-envelope-header">
                                                <strong>Apartment Lease & Housing</strong>
                                                <span>{formatAmount(65000)} / {formatAmount(65000)} (100%)</span>
                                            </div>
                                            <div className="d-envelope-track">
                                                <div className="d-envelope-fill" style={{ width: '100%', background: '#80383D' }} />
                                            </div>
                                        </div>

                                        <div className="d-envelope-item">
                                            <div className="d-envelope-header">
                                                <strong>Groceries & Food Supplies</strong>
                                                <span>Rs 24,500 / Rs 35,000 (70%)</span>
                                            </div>
                                            <div className="d-envelope-track">
                                                <div className="d-envelope-fill" style={{ width: '70%', background: 'var(--landing-orange)' }} />
                                            </div>
                                        </div>

                                        <div className="d-envelope-item">
                                            <div className="d-envelope-header">
                                                <strong>Tech Subscriptions & SaaS</strong>
                                                <span>Rs 7,650 / Rs 15,000 (51%)</span>
                                            </div>
                                            <div className="d-envelope-track">
                                                <div className="d-envelope-fill" style={{ width: '51%', background: 'var(--landing-pink)' }} />
                                            </div>
                                        </div>

                                        <div className="d-envelope-item">
                                            <div className="d-envelope-header">
                                                <strong>Wellness & Healthcare</strong>
                                                <span>Rs 4,200 / Rs 10,000 (42%)</span>
                                            </div>
                                            <div className="d-envelope-track">
                                                <div className="d-envelope-fill" style={{ width: '42%', background: 'var(--landing-sage)' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming Locked Commitments */}
                                    <div className="d-commitments-box">
                                        <div className="d-box-title">
                                            <span>Locked Ahead (Next 14d)</span>
                                            <span style={{ fontSize: '11px', color: '#777' }}>Rs 71,600 Due</span>
                                        </div>

                                        <div className="d-commit-list">
                                            <div className="d-commit-row">
                                                <div className="d-commit-info">
                                                    <strong>Apartment Rent</strong>
                                                    <span>Oct 12 · Bank Wire</span>
                                                </div>
                                                <span className="d-commit-val">Rs 65,000</span>
                                            </div>
                                            <div className="d-commit-row">
                                                <div className="d-commit-info">
                                                    <strong>High-Speed Fiber</strong>
                                                    <span>Oct 15 · Auto Debit</span>
                                                </div>
                                                <span className="d-commit-val">Rs 3,200</span>
                                            </div>
                                            <div className="d-commit-row">
                                                <div className="d-commit-info">
                                                    <strong>DigitalOcean Cloud</strong>
                                                    <span>Oct 18 · Corporate Card</span>
                                                </div>
                                                <span className="d-commit-val">Rs 3,400</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────────────── TAB 4: ANALYZE ──────────────── */}
                        {activeTab === 'analyze' && (
                            <div className="d-view-container">
                                <div className="d-analyze-grid">
                                    {/* Burndown Comparison Chart */}
                                    <div className="d-burn-card">
                                        <div className="d-box-title">
                                            <span>Discretionary Burn Velocity</span>
                                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>-14% vs Aug Baseline</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>
                                            Comparison of 4-week weekly discretionary outflow vs moving baseline:
                                        </p>

                                        <div className="d-chart-container">
                                            <svg viewBox="0 0 360 90" style={{ width: '100%', height: '80px' }}>
                                                {/* Grid lines */}
                                                <line x1="0" y1="20" x2="360" y2="20" stroke="rgba(0,0,0,0.05)" />
                                                <line x1="0" y1="50" x2="360" y2="50" stroke="rgba(0,0,0,0.05)" />
                                                <line x1="0" y1="80" x2="360" y2="80" stroke="rgba(0,0,0,0.08)" />

                                                {/* Week 1 */}
                                                <rect x="30" y="32" width="16" height="48" rx="3" fill="#111111" />
                                                <rect x="50" y="44" width="16" height="36" rx="3" fill="rgba(0,0,0,0.15)" />

                                                {/* Week 2 */}
                                                <rect x="115" y="24" width="16" height="56" rx="3" fill="#111111" />
                                                <rect x="135" y="38" width="16" height="42" rx="3" fill="rgba(0,0,0,0.15)" />

                                                {/* Week 3 (Current) */}
                                                <rect x="200" y="14" width="16" height="66" rx="3" fill="var(--landing-orange)" />
                                                <rect x="220" y="30" width="16" height="50" rx="3" fill="rgba(0,0,0,0.15)" />

                                                {/* Week 4 (Projected) */}
                                                <rect x="285" y="28" width="16" height="52" rx="3" fill="#111111" opacity="0.6" strokeDasharray="3 3" />
                                                <rect x="305" y="40" width="16" height="40" rx="3" fill="rgba(0,0,0,0.15)" />

                                                <text x="48" y="88" fontSize="8" fill="#888" textAnchor="middle">W1</text>
                                                <text x="133" y="88" fontSize="8" fill="#888" textAnchor="middle">W2</text>
                                                <text x="218" y="88" fontSize="8" fill="var(--landing-orange)" fontWeight="700" textAnchor="middle">W3</text>
                                                <text x="303" y="88" fontSize="8" fill="#888" textAnchor="middle">W4 (proj)</text>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Top Merchant Leaderboard */}
                                    <div className="d-merchants-card">
                                        <div className="d-box-title">
                                            <span>Top Discretionary Merchants</span>
                                            <span style={{ fontSize: '11px', color: '#777' }}>September Outflow</span>
                                        </div>

                                        <div className="d-merchant-table">
                                            <div className="d-merchant-row">
                                                <div className="d-merchant-name">
                                                    <span className="d-merchant-rank">01</span>
                                                    <span>Amazon Official Store</span>
                                                </div>
                                                <span className="d-merchant-spend">Rs 39,240</span>
                                            </div>
                                            <div className="d-merchant-row">
                                                <div className="d-merchant-name">
                                                    <span className="d-merchant-rank">02</span>
                                                    <span>Whole Foods Market</span>
                                                </div>
                                                <span className="d-merchant-spend">Rs 29,600</span>
                                            </div>
                                            <div className="d-merchant-row">
                                                <div className="d-merchant-name">
                                                    <span className="d-merchant-rank">03</span>
                                                    <span>K-Electric Power</span>
                                                </div>
                                                <span className="d-merchant-spend">Rs 18,200</span>
                                            </div>
                                            <div className="d-merchant-row">
                                                <div className="d-merchant-name">
                                                    <span className="d-merchant-rank">04</span>
                                                    <span>DigitalOcean Infrastructure</span>
                                                </div>
                                                <span className="d-merchant-spend">Rs 6,800</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </section>
    );
}
