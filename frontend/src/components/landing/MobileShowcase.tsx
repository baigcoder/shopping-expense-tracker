import { useState } from 'react';
import { Home, ListOrdered, Calendar, BarChart3, Sparkles, Plus, Check, ArrowRight } from 'lucide-react';
import { useLandingSettings } from './useLandingSettings';

type MobileScreen = 'home' | 'activity' | 'plan' | 'analyze' | 'assist';

export default function MobileShowcase() {
    const { formatAmount } = useLandingSettings();
    const [activeScreen, setActiveScreen] = useState<MobileScreen>('home');
    const [isApproved, setIsApproved] = useState(false);
    const [diningCapped, setDiningCapped] = useState(false);

    return (
        <section id="mobile-showcase" className="landing-mobile-showcase scroll-mt-20">
            <div className="landing-mobile-showcase__header">
                <div className="landing-mobile-showcase__tag">MOBILE OPERATING SYSTEM</div>
                <h2 className="landing-mobile-showcase__title">
                    FINANCIAL CLARITY<br />
                    IN YOUR HAND.
                </h2>
                <p className="landing-mobile-showcase__sub">
                    Not a scaled-down desktop dashboard. A touch-native mobile application designed for quick review decisions,
                    on-the-go budget lookups, and instant velocity checks.
                </p>
            </div>

            {/* Asymmetric Showcase: Interactive Screen Tabs (Left) + Monumental Phone Frame (Right) */}
            <div className="landing-mobile-showcase__grid">

                {/* Left Controls & Screen Explanations */}
                <div className="landing-mobile-showcase__controls">
                    <div className="m-screen-tabs">
                        <button
                            onClick={() => setActiveScreen('home')}
                            className={`m-screen-tab ${activeScreen === 'home' ? 'm-screen-tab--active' : ''}`}
                        >
                            <Home size={18} />
                            <div>
                                <div className="m-tab-title">Mobile Home</div>
                                <div className="m-tab-desc">Safe to spend, balance runway, quick capture</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveScreen('activity')}
                            className={`m-screen-tab ${activeScreen === 'activity' ? 'm-screen-tab--active' : ''}`}
                        >
                            <ListOrdered size={18} />
                            <div>
                                <div className="m-tab-title">Mobile Activity</div>
                                <div className="m-tab-desc">Real-time ledger feed & review inbox queue</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveScreen('plan')}
                            className={`m-screen-tab ${activeScreen === 'plan' ? 'm-screen-tab--active' : ''}`}
                        >
                            <Calendar size={18} />
                            <div>
                                <div className="m-tab-title">Mobile Plan</div>
                                <div className="m-tab-desc">Dynamic category budgets & commitment timeline</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveScreen('analyze')}
                            className={`m-screen-tab ${activeScreen === 'analyze' ? 'm-screen-tab--active' : ''}`}
                        >
                            <BarChart3 size={18} />
                            <div>
                                <div className="m-tab-title">Mobile Analyze</div>
                                <div className="m-tab-desc">Dual-bar monthly trends & category allocations</div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveScreen('assist')}
                            className={`m-screen-tab ${activeScreen === 'assist' ? 'm-screen-tab--active' : ''}`}
                        >
                            <Sparkles size={18} />
                            <div>
                                <div className="m-tab-title">Mobile Assist AI</div>
                                <div className="m-tab-desc">Contextual action chips & anomaly warnings</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right: Monumental Cinematic Phone Frame */}
                <div className="landing-mobile-showcase__display">
                    <div className="m-phone-frame">
                        {/* Dynamic Island / Notch */}
                        <div className="m-phone-island">
                            <span className="m-island-camera" />
                            <span className="m-island-sensor" />
                        </div>

                        {/* Status Bar */}
                        <div className="m-phone-status">
                            <span className="m-phone-time">9:41</span>
                            <div className="m-phone-icons">
                                <span className="m-cellular">●●●●</span>
                                <span className="m-battery"><span className="m-battery-fill" /></span>
                            </div>
                        </div>

                        {/* Interactive Screen Container */}
                        <div className="m-phone-screen">

                            {/* ── Screen: Home ── */}
                            {activeScreen === 'home' && (
                                <div className="m-screen-content landing-animate-in">
                                    <div className="m-user-row">
                                        <div>
                                            <span className="m-greeting">Good evening,</span>
                                            <div className="m-user-name">David Daniels</div>
                                        </div>
                                        <div className="m-notif-badge">🔔 {isApproved ? '0' : '1'}</div>
                                    </div>

                                    {/* Safe to Spend Card */}
                                    <div className="m-hero-card m-hero-card--orange">
                                        <span className="m-hero-tag">SAFE TO SPEND</span>
                                        <div className="m-hero-val">{formatAmount(42870)}</div>
                                        <div className="m-hero-row">
                                            <span>Velocity: Healthy</span>
                                            <span>42d runway</span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="m-quick-actions">
                                        <div className="m-action-item">
                                            <div className="m-action-circle m-action-circle--orange">
                                                <Plus size={16} />
                                            </div>
                                            <span>Add Expense</span>
                                        </div>
                                        <div className="m-action-item">
                                            <div className="m-action-circle m-action-circle--ink">
                                                <ListOrdered size={16} />
                                            </div>
                                            <span>Review ({isApproved ? '0' : '1'})</span>
                                        </div>
                                        <div className="m-action-item">
                                            <div className="m-action-circle m-action-circle--pink">
                                                <Calendar size={16} />
                                            </div>
                                            <span>Bills</span>
                                        </div>
                                    </div>

                                    {/* Pending Review Queue Banner */}
                                    {!isApproved ? (
                                        <div className="m-inbox-banner">
                                            <div className="m-inbox-banner-head">
                                                <span>1 Captured Checkout Needs Review</span>
                                                <span className="m-inbox-badge">NEW</span>
                                            </div>
                                            <div className="m-inbox-preview">
                                                <div>
                                                    <strong>Amazon Electronics</strong>
                                                    <p>Logitech Mouse · {formatAmount(4250)}</p>
                                                </div>
                                                <button onClick={() => setIsApproved(true)} className="m-inbox-approve-btn">Approve</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="m-inbox-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                                            <div className="m-inbox-banner-head">
                                                <span style={{ color: '#10B981', fontWeight: 600 }}>Inbox Zero · Verified</span>
                                                <span className="m-inbox-badge" style={{ background: '#10B981' }}>POSTED</span>
                                            </div>
                                            <div className="m-inbox-preview">
                                                <div>
                                                    <strong>Amazon Electronics · {formatAmount(4250)}</strong>
                                                    <p style={{ color: '#10B981', fontSize: '11px' }}>Approved to canonical ledger</p>
                                                </div>
                                                <button onClick={() => setIsApproved(false)} className="m-inbox-approve-btn" style={{ background: 'transparent', border: '1px solid #10B981', color: '#10B981' }}>Undo</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Screen: Activity ── */}
                            {activeScreen === 'activity' && (
                                <div className="m-screen-content landing-animate-in">
                                    <div className="m-screen-title-row">
                                        <h3 className="m-screen-title">Activity</h3>
                                        <span className="m-filter-btn">Filter ≡</span>
                                    </div>

                                    <div className="m-activity-feed">
                                        <div className="m-feed-item">
                                            <div className="m-feed-icon m-feed-icon--tech">💻</div>
                                            <div className="m-feed-info">
                                                <div className="m-feed-name">Amazon Electronics</div>
                                                <div className="m-feed-sub">Office Equipment · 2m ago</div>
                                            </div>
                                            <div className="m-feed-amount">
                                                <span>-{formatAmount(4250)}</span>
                                                <span className={`m-feed-status ${isApproved ? 'm-feed-status--approved' : 'm-feed-status--pending'}`}>
                                                    {isApproved ? 'Approved' : 'Review'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="m-feed-item">
                                            <div className="m-feed-icon m-feed-icon--food">🍔</div>
                                            <div className="m-feed-info">
                                                <div className="m-feed-name">Whole Foods Market</div>
                                                <div className="m-feed-sub">Groceries · Yesterday</div>
                                            </div>
                                            <div className="m-feed-amount">
                                                <span>-{formatAmount(14800)}</span>
                                                <span className="m-feed-status m-feed-status--approved">Approved</span>
                                            </div>
                                        </div>

                                        <div className="m-feed-item">
                                            <div className="m-feed-icon m-feed-icon--bill">⚡</div>
                                            <div className="m-feed-info">
                                                <div className="m-feed-name">K-Electric Utility</div>
                                                <div className="m-feed-sub">Utilities · 2 days ago</div>
                                            </div>
                                            <div className="m-feed-amount">
                                                <span>-{formatAmount(18200)}</span>
                                                <span className="m-feed-status m-feed-status--approved">Approved</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Screen: Plan ── */}
                            {activeScreen === 'plan' && (
                                <div className="m-screen-content landing-animate-in">
                                    <div className="m-screen-title-row">
                                        <h3 className="m-screen-title">Budget Plan</h3>
                                        <span className="m-period-pill">September</span>
                                    </div>

                                    <div className="m-budget-overview">
                                        <span className="m-budget-lbl">Total Capacity</span>
                                        <div className="m-budget-num">{formatAmount(78200)} / {formatAmount(120000)}</div>
                                        <div className="m-budget-bar">
                                            <div className="m-budget-bar-fill" style={{ width: '65%' }} />
                                        </div>
                                    </div>

                                    <div className="m-budget-categories">
                                        <div className="m-b-cat">
                                            <div className="m-b-cat-head">
                                                <span>Housing & Rent</span>
                                                <span>{formatAmount(65000)} / {formatAmount(65000)}</span>
                                            </div>
                                            <div className="m-b-cat-bar"><div style={{ width: '100%', background: '#80383D' }} /></div>
                                        </div>

                                        <div className="m-b-cat">
                                            <div className="m-b-cat-head">
                                                <span>Groceries & Food</span>
                                                <span>{formatAmount(24500)} / {formatAmount(35000)}</span>
                                            </div>
                                            <div className="m-b-cat-bar"><div style={{ width: '70%', background: '#EE5024' }} /></div>
                                        </div>

                                        <div className="m-b-cat">
                                            <div className="m-b-cat-head">
                                                <span>Tech & Subscriptions</span>
                                                <span>{formatAmount(7650)} / {formatAmount(15000)}</span>
                                            </div>
                                            <div className="m-b-cat-bar"><div style={{ width: '51%', background: '#F0A1CB' }} /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Screen: Analyze ── */}
                            {activeScreen === 'analyze' && (
                                <div className="m-screen-content landing-animate-in">
                                    <div className="m-screen-title-row">
                                        <h3 className="m-screen-title">Analysis</h3>
                                        <span className="m-period-pill">Monthly Trend</span>
                                    </div>

                                    <div className="m-analyze-box m-analyze-box--pink">
                                        <div className="m-analyze-head">
                                            <span>Discretionary Burn</span>
                                            <strong>{formatAmount(78200)}</strong>
                                        </div>
                                        <div className="m-chart-bars">
                                            <div className="m-bar-col"><div className="m-bar" style={{ height: '40px' }} /><span>Jun</span></div>
                                            <div className="m-bar-col"><div className="m-bar" style={{ height: '65px' }} /><span>Jul</span></div>
                                            <div className="m-bar-col"><div className="m-bar" style={{ height: '50px' }} /><span>Aug</span></div>
                                            <div className="m-bar-col m-bar-col--active"><div className="m-bar" style={{ height: '90px' }} /><span>Sep</span></div>
                                            <div className="m-bar-col"><div className="m-bar" style={{ height: '55px' }} /><span>Oct</span></div>
                                        </div>
                                    </div>

                                    <div className="m-analyze-insight">
                                        <span>September Velocity Variance</span>
                                        <strong>-14% spending vs previous month</strong>
                                    </div>
                                </div>
                            )}

                            {/* ── Screen: Assist ── */}
                            {activeScreen === 'assist' && (
                                <div className="m-screen-content landing-animate-in">
                                    <div className="m-screen-title-row">
                                        <h3 className="m-screen-title">Assist Co-Pilot</h3>
                                        <span className="m-status-pill">Active</span>
                                    </div>

                                    <div className="m-assist-card">
                                        <div className="m-assist-badge">
                                            <Sparkles size={14} />
                                            <span>VELOCITY ANOMALY DETECTED</span>
                                        </div>
                                        <div className="m-assist-query">
                                            Dining Out reached <strong>+34% above</strong> normal 30-day baseline.
                                        </div>
                                        <div className="m-assist-impact">
                                            Projected runway loss: <strong>-4 days</strong>
                                        </div>
                                        <div className="m-assist-actions">
                                            {!diningCapped ? (
                                                <>
                                                    <button onClick={() => setDiningCapped(true)} className="m-assist-btn m-assist-btn--primary">
                                                        Cap Dining Budget at Rs 20,000
                                                    </button>
                                                    <button className="m-assist-btn">
                                                        Inspect 6 Dining Line Items
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#10B981', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                    <span>✓ Dining Cap Active (Rs 20,000)</span>
                                                    <button onClick={() => setDiningCapped(false)} style={{ background: 'none', border: 'none', color: '#10B981', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>Reset</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Bottom Phone Dock */}
                        <div className="m-phone-dock">
                            <button onClick={() => setActiveScreen('home')} className={`m-dock-btn ${activeScreen === 'home' ? 'm-dock-btn--active' : ''}`}>
                                <Home size={18} />
                                <span>Home</span>
                            </button>
                            <button onClick={() => setActiveScreen('activity')} className={`m-dock-btn ${activeScreen === 'activity' ? 'm-dock-btn--active' : ''}`}>
                                <ListOrdered size={18} />
                                <span>Activity</span>
                            </button>
                            <button onClick={() => setActiveScreen('plan')} className={`m-dock-btn ${activeScreen === 'plan' ? 'm-dock-btn--active' : ''}`}>
                                <Calendar size={18} />
                                <span>Plan</span>
                            </button>
                            <button onClick={() => setActiveScreen('analyze')} className={`m-dock-btn ${activeScreen === 'analyze' ? 'm-dock-btn--active' : ''}`}>
                                <BarChart3 size={18} />
                                <span>Analyze</span>
                            </button>
                            <button onClick={() => setActiveScreen('assist')} className={`m-dock-btn ${activeScreen === 'assist' ? 'm-dock-btn--active' : ''}`}>
                                <Sparkles size={18} />
                                <span>Assist</span>
                            </button>
                        </div>

                        {/* iPhone Home Indicator */}
                        <div className="m-phone-home-bar" />
                    </div>
                </div>

            </div>
        </section>
    );
}
