import { Link } from 'react-router-dom';
import ArchitecturalBlocksScene from '@/components/landing/ArchitecturalBlocksScene';

/**
 * Editorial Three-Panel Hero
 * Precision reproduction of the primary visual art-direction reference:
 * - Three mobile device frames with 44px corner geometry & soft drop shadows
 * - Left Panel: 3D isometric white architectural blocks + bold Cadmium Orange statement
 * - Center Panel: Soft Candy Pink statistics screen with dual-bar chart & white category ledger
 * - Right Panel: Editorial balance screen with 3-part color-blocked allocation & Sage Activity card
 * - Wide modern geometric sans typography (Syne display)
 */
export default function Hero() {
    return (
        <section className="landing-hero">
            <div className="landing-hero__grid">

                {/* ══════════════════════════════════════════════════
                    PANEL 1 (LEFT): EDITORIAL ORANGE STATEMENT
                ══════════════════════════════════════════════════ */}
                <div className="landing-hero__phone-card landing-hero__phone-card--statement landing-animate-in">
                    {/* Top: 3D Architectural Isometric White Cubes */}
                    <ArchitecturalBlocksScene />

                    {/* Bottom: Bold Cadmium Orange Statement */}
                    <div className="landing-hero__statement-panel">
                        <div>
                            <h1 className="landing-hero__headline">
                                FINANCE<br />
                                IS OUR<br />
                                EXPERTISE.
                            </h1>

                            {/* Thin horizontal divider line from reference */}
                            <div className="landing-hero__statement-divider" />

                            <p className="landing-hero__statement-desc">
                                This is an online finance solution that helps to keep track of all of financial activity.
                            </p>
                        </div>

                        <div className="landing-hero__statement-footer">
                            <Link to="/signup" className="landing-hero__start-btn">
                                <span>Get started</span>
                                <span className="landing-hero__start-arrow">→</span>
                            </Link>

                            {/* iPhone Home Indicator */}
                            <div className="landing-hero__home-indicator landing-hero__home-indicator--dark" />
                        </div>
                    </div>
                </div>


                {/* ══════════════════════════════════════════════════
                    PANEL 2 (CENTER): STATISTICS & SPENDING ANALYSIS
                ══════════════════════════════════════════════════ */}
                <div className="landing-hero__phone-card landing-hero__phone-card--stats landing-animate-in landing-animate-in-delay-1">
                    {/* Top Pink Section */}
                    <div className="landing-hero__stats-top">
                        {/* Status Bar */}
                        <div className="landing-hero__status-bar">
                            <span className="landing-hero__status-time">9:41</span>
                            <div className="landing-hero__status-icons">
                                {/* Cellular bars */}
                                <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
                                    <rect x="0" y="8" width="3" height="4" rx="0.5" />
                                    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
                                    <rect x="9" y="3" width="3" height="9" rx="0.5" />
                                    <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                                </svg>
                                {/* Wifi icon */}
                                <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                                    <path d="M8 2.5C10.5 2.5 12.8 3.5 14.5 5.2L16 3.7C13.9 1.5 11.1 0.2 8 0.2C4.9 0.2 2.1 1.5 0 3.7L1.5 5.2C3.2 3.5 5.5 2.5 8 2.5ZM8 6.5C9.5 6.5 10.9 7.1 11.9 8.1L13.4 6.6C12 5.2 10.1 4.3 8 4.3C5.9 4.3 4 5.2 2.6 6.6L4.1 8.1C5.1 7.1 6.5 6.5 8 6.5ZM8 10C8.8 10 9.5 10.7 9.5 11.5C9.5 12.3 8.8 13 8 13C7.2 13 6.5 12.3 6.5 11.5C6.5 10.7 7.2 10 8 10Z" />
                                </svg>
                                {/* Battery icon */}
                                <div className="landing-hero__battery-icon">
                                    <div className="landing-hero__battery-fill" style={{ width: '80%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Title Header with Time Switch */}
                        <div className="landing-hero__stats-title-row">
                            <h2 className="landing-hero__stats-title">Statistic</h2>
                            <div className="landing-hero__time-toggle">
                                <span className="landing-hero__toggle-label">y</span>
                                <span className="landing-hero__toggle-pill">m</span>
                                <span className="landing-hero__toggle-label">w</span>
                            </div>
                        </div>

                        <p className="landing-hero__stats-subtitle">spending analysis</p>

                        {/* Large Amount */}
                        <div className="landing-hero__stats-amount">
                            2768,71
                            <span className="landing-hero__stats-currency">USD</span>
                        </div>

                        {/* Spending Dual-Bar Chart Card */}
                        <div className="landing-hero__chart-card">
                            <svg viewBox="0 0 320 120" preserveAspectRatio="none" className="landing-hero__chart-svg">
                                {/* Y-axis values */}
                                <text x="0" y="14" fontSize="9" fill="rgba(0,0,0,0.4)" fontFamily="Inter">140</text>
                                <text x="0" y="44" fontSize="9" fill="rgba(0,0,0,0.4)" fontFamily="Inter">100</text>
                                <text x="0" y="74" fontSize="9" fill="rgba(0,0,0,0.4)" fontFamily="Inter">60</text>
                                <text x="0" y="104" fontSize="9" fill="rgba(0,0,0,0.4)" fontFamily="Inter">20</text>

                                {/* September Featured Highlight Column */}
                                <rect x="180" y="4" width="34" height="96" rx="8" fill="rgba(255,255,255,0.45)" />

                                {/* Jun */}
                                <rect x="36" y="52" width="7" height="48" rx="2" fill="#111111" />
                                <rect x="46" y="66" width="7" height="34" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* Jul */}
                                <rect x="86" y="40" width="7" height="60" rx="2" fill="#111111" />
                                <rect x="96" y="72" width="7" height="28" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* Aug */}
                                <rect x="136" y="48" width="7" height="52" rx="2" fill="#111111" />
                                <rect x="146" y="70" width="7" height="30" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* Sep (Highlighted) */}
                                <rect x="186" y="14" width="7" height="86" rx="2" fill="#111111" />
                                <rect x="196" y="32" width="7" height="68" rx="2" fill="rgba(0,0,0,0.25)" />

                                {/* Oct */}
                                <rect x="236" y="36" width="7" height="64" rx="2" fill="#111111" />
                                <rect x="246" y="58" width="7" height="42" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* Nov */}
                                <rect x="286" y="24" width="7" height="76" rx="2" fill="#111111" />
                                <rect x="296" y="62" width="7" height="38" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* X-axis Month Labels */}
                                <text x="44" y="116" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">jun</text>
                                <text x="94" y="116" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">jul</text>
                                <text x="144" y="116" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">aug</text>
                                <text x="197" y="116" fontSize="10" fill="#111111" textAnchor="middle" fontFamily="Inter" fontWeight="700">sep</text>
                                <text x="244" y="116" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">oct</text>
                                <text x="294" y="116" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">nov</text>
                            </svg>
                        </div>
                    </div>

                    {/* Bottom White Container: Categories */}
                    <div className="landing-hero__stats-bottom">
                        {/* Food Callout */}
                        <div className="landing-hero__food-callout">
                            <p className="landing-hero__food-headline">
                                You spent <strong>550USD</strong> on food in <u>September</u>
                            </p>
                            <p className="landing-hero__food-sub">
                                Once up your next meal with up to 3% cashback
                            </p>
                        </div>

                        {/* Category List */}
                        <div className="landing-hero__category-list">
                            {/* Food */}
                            <div className="landing-hero__category-row">
                                <div className="landing-hero__category-meta">
                                    <div className="landing-hero__cat-badge landing-hero__cat-badge--food">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                                            <rect x="1" y="1" width="4" height="4" rx="1" />
                                            <rect x="7" y="1" width="4" height="4" rx="1" />
                                            <rect x="1" y="7" width="4" height="4" rx="1" />
                                            <rect x="7" y="7" width="4" height="4" rx="1" />
                                        </svg>
                                    </div>
                                    <span className="landing-hero__cat-name">Food</span>
                                </div>
                                <div className="landing-hero__cat-value">
                                    <span>525,23</span>
                                    <span className="landing-hero__cat-trend landing-hero__cat-trend--up">↗</span>
                                </div>
                            </div>

                            {/* Healthcare */}
                            <div className="landing-hero__category-row">
                                <div className="landing-hero__category-meta">
                                    <div className="landing-hero__cat-badge landing-hero__cat-badge--health">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                                            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <span className="landing-hero__cat-name">Healthcare</span>
                                </div>
                                <div className="landing-hero__cat-value">
                                    <span>120,50</span>
                                    <span className="landing-hero__cat-trend landing-hero__cat-trend--down">↘</span>
                                </div>
                            </div>

                            {/* Supplies */}
                            <div className="landing-hero__category-row">
                                <div className="landing-hero__category-meta">
                                    <div className="landing-hero__cat-badge landing-hero__cat-badge--supplies">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                                            <circle cx="6" cy="6" r="4" stroke="white" strokeWidth="1.5" fill="none" />
                                            <circle cx="6" cy="6" r="1.5" fill="white" />
                                        </svg>
                                    </div>
                                    <span className="landing-hero__cat-name">Supplies</span>
                                </div>
                                <div className="landing-hero__cat-value">
                                    <span>622,20</span>
                                    <span className="landing-hero__cat-trend landing-hero__cat-trend--down">↘</span>
                                </div>
                            </div>

                            {/* Other */}
                            <div className="landing-hero__category-row">
                                <div className="landing-hero__category-meta">
                                    <div className="landing-hero__cat-badge landing-hero__cat-badge--other">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                                            <rect x="2" y="2" width="8" height="8" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
                                        </svg>
                                    </div>
                                    <span className="landing-hero__cat-name">Other</span>
                                </div>
                                <div className="landing-hero__cat-value">
                                    <span>1500,78</span>
                                    <span className="landing-hero__cat-trend landing-hero__cat-trend--up">↗</span>
                                </div>
                            </div>
                        </div>

                        {/* iPhone Home Indicator */}
                        <div className="landing-hero__home-indicator landing-hero__home-indicator--dark" />
                    </div>
                </div>


                {/* ══════════════════════════════════════════════════
                    PANEL 3 (RIGHT): DASHBOARD, ALLOCATION & ACTIVITY
                ══════════════════════════════════════════════════ */}
                <div className="landing-hero__phone-card landing-hero__phone-card--dashboard landing-animate-in landing-animate-in-delay-2">
                    {/* Status Bar */}
                    <div className="landing-hero__status-bar landing-hero__status-bar--light">
                        <span className="landing-hero__status-time">9:41</span>
                        <div className="landing-hero__status-icons">
                            <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
                                <rect x="0" y="8" width="3" height="4" rx="0.5" />
                                <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
                                <rect x="9" y="3" width="3" height="9" rx="0.5" />
                                <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                            </svg>
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                                <path d="M8 2.5C10.5 2.5 12.8 3.5 14.5 5.2L16 3.7C13.9 1.5 11.1 0.2 8 0.2C4.9 0.2 2.1 1.5 0 3.7L1.5 5.2C3.2 3.5 5.5 2.5 8 2.5ZM8 6.5C9.5 6.5 10.9 7.1 11.9 8.1L13.4 6.6C12 5.2 10.1 4.3 8 4.3C5.9 4.3 4 5.2 2.6 6.6L4.1 8.1C5.1 7.1 6.5 6.5 8 6.5ZM8 10C8.8 10 9.5 10.7 9.5 11.5C9.5 12.3 8.8 13 8 13C7.2 13 6.5 12.3 6.5 11.5C6.5 10.7 7.2 10 8 10Z" />
                            </svg>
                            <div className="landing-hero__battery-icon">
                                <div className="landing-hero__battery-fill" style={{ width: '80%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Top White Section */}
                    <div className="landing-hero__dash-top">
                        {/* User Pill & Notification */}
                        <div className="landing-hero__user-header">
                            <span className="landing-hero__user-pill">David Daniels</span>
                            <div className="landing-hero__bell-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="landing-hero__dash-balance">
                            <div className="landing-hero__balance-row">
                                <span className="landing-hero__balance-number">3500</span>
                                <span className="landing-hero__balance-curr">USD</span>
                            </div>

                            {/* Hairline Divider Rule */}
                            <div className="landing-hero__balance-line" />

                            <p className="landing-hero__balance-caption">left in september</p>
                        </div>

                        {/* 3-Part Color-Blocked Budget Allocation Bar */}
                        <div className="landing-hero__allocation-bar">
                            {/* Pink Segment: Spent */}
                            <div className="landing-hero__alloc-segment landing-hero__alloc-segment--pink">
                                <span className="landing-hero__alloc-num">2.768,71</span>
                                <span className="landing-hero__alloc-lbl">spent</span>
                            </div>

                            {/* Burgundy Segment: Bills */}
                            <div className="landing-hero__alloc-segment landing-hero__alloc-segment--wine">
                                <span className="landing-hero__alloc-num">1.250</span>
                                <span className="landing-hero__alloc-lbl">bills</span>
                            </div>

                            {/* Orange Segment: Left */}
                            <div className="landing-hero__alloc-segment landing-hero__alloc-segment--orange">
                                <span className="landing-hero__alloc-num">4.500</span>
                                <span className="landing-hero__alloc-lbl">left</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Sage Green Card: Activity */}
                    <div className="landing-hero__sage-card">
                        <div className="landing-hero__activity-head">
                            <h3 className="landing-hero__activity-title">Activity</h3>
                            {/* Filter Icon (≡ descending lines) */}
                            <div className="landing-hero__filter-icon">
                                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="0" y1="2" x2="18" y2="2" />
                                    <line x1="3" y1="7" x2="15" y2="7" />
                                    <line x1="6" y1="12" x2="12" y2="12" />
                                </svg>
                            </div>
                        </div>

                        <p className="landing-hero__activity-sub">budget allocation</p>

                        {/* Activity Items */}
                        <div className="landing-hero__activity-rows">
                            <div className="landing-hero__activity-card">
                                <div>
                                    <span className="landing-hero__act-step">01 - Deposit made</span>
                                    <div className="landing-hero__act-val">$300</div>
                                </div>
                                <span className="landing-hero__act-arrow">→</span>
                            </div>

                            <div className="landing-hero__activity-card">
                                <div>
                                    <span className="landing-hero__act-step">02 - Withdrawal made</span>
                                    <div className="landing-hero__act-val">$250</div>
                                </div>
                                <span className="landing-hero__act-arrow">→</span>
                            </div>

                            <div className="landing-hero__activity-card landing-hero__activity-card--subtle">
                                <div>
                                    <span className="landing-hero__act-step">03 - Investment</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Bottom Nav Dock */}
                    <div className="landing-hero__dock-wrapper">
                        <div className="landing-hero__nav-dock">
                            {/* Home (Active orange squiggle) */}
                            <div className="landing-hero__dock-item landing-hero__dock-item--active">
                                <div className="landing-hero__dock-icon-circle">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--landing-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <span>Home</span>
                            </div>

                            {/* Statistic */}
                            <div className="landing-hero__dock-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <span>Statistic</span>
                            </div>

                            {/* Savings */}
                            <div className="landing-hero__dock-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="4" />
                                    <line x1="12" y1="2" x2="12" y2="6" />
                                    <line x1="12" y1="18" x2="12" y2="22" />
                                    <line x1="2" y1="12" x2="6" y2="12" />
                                    <line x1="18" y1="12" x2="22" y2="12" />
                                </svg>
                                <span>Savings</span>
                            </div>

                            {/* Profile */}
                            <div className="landing-hero__dock-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span>Profile</span>
                            </div>
                        </div>

                        {/* iPhone Home Indicator */}
                        <div className="landing-hero__home-indicator landing-hero__home-indicator--dark" style={{ marginTop: '10px' }} />
                    </div>
                </div>

            </div>
        </section>
    );
}
