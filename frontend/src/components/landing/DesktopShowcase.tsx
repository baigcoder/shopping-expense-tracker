import { useState } from 'react';
import { Home, ListOrdered, Calendar, BarChart3, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DesktopShowcase() {
    const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'plan' | 'analyze'>('home');

    return (
        <section id="desktop-showcase" className="landing-desktop-showcase scroll-mt-20">
            <div className="landing-desktop-showcase__header">
                <div className="landing-desktop-showcase__tag">DESKTOP WORKSTATION</div>
                <h2 className="landing-desktop-showcase__title">
                    BUILT FOR DEEP<br />
                    FINANCIAL CONTROL.
                </h2>
                <p className="landing-desktop-showcase__sub">
                    A responsive, desktop-class finance environment built for power users.
                    Inspect transaction line items, manage committed bills, and simulate trajectory changes without navigating away.
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
                        <span>cashly.app / console / dashboard</span>
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
                        <div className="landing-desktop-showcase__brand">
                            <span className="brand-logo-small">C</span>
                            <span className="brand-text-small">Cashly</span>
                        </div>

                        <nav className="landing-desktop-showcase__nav">
                            <button
                                onClick={() => setActiveTab('home')}
                                className={`d-nav-item ${activeTab === 'home' ? 'd-nav-item--active' : ''}`}
                            >
                                <Home size={15} />
                                <span>Home</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`d-nav-item ${activeTab === 'activity' ? 'd-nav-item--active' : ''}`}
                            >
                                <ListOrdered size={15} />
                                <span>Activity</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('plan')}
                                className={`d-nav-item ${activeTab === 'plan' ? 'd-nav-item--active' : ''}`}
                            >
                                <Calendar size={15} />
                                <span>Plan</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('analyze')}
                                className={`d-nav-item ${activeTab === 'analyze' ? 'd-nav-item--active' : ''}`}
                            >
                                <BarChart3 size={15} />
                                <span>Analyze</span>
                            </button>
                        </nav>

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
                        {/* Top KPI Metric Cards */}
                        <div className="landing-desktop-showcase__kpi-grid">
                            {/* Card 1: Safe to Spend */}
                            <div className="d-kpi-card d-kpi-card--primary">
                                <span className="d-kpi-label">SAFE TO SPEND THIS MONTH</span>
                                <div className="d-kpi-val">Rs 42,870</div>
                                <div className="d-kpi-foot">
                                    <span className="d-kpi-trend">Velocity: Steady</span>
                                    <span>· Next bill in 4 days</span>
                                </div>
                            </div>

                            {/* Card 2: Cash Runway */}
                            <div className="d-kpi-card">
                                <span className="d-kpi-label">FORWARD RUNWAY</span>
                                <div className="d-kpi-val">42 Days</div>
                                <div className="d-kpi-foot">
                                    <span>Based on 30-day moving average</span>
                                </div>
                            </div>

                            {/* Card 3: Upcoming Commitments */}
                            <div className="d-kpi-card">
                                <span className="d-kpi-label">LOCKED COMMITMENTS</span>
                                <div className="d-kpi-val">Rs 68,200</div>
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
                                <span className="ledger-pill">1 Item in Review Queue</span>
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
                                    <span className="amount-num">Rs 4,250</span>
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
                                    <span className="amount-num">Rs 14,800</span>
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
                                    <span className="amount-num">Rs 3,400</span>
                                    <span className="status-approved">
                                        <CheckCircle2 size={13} /> Approved
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
