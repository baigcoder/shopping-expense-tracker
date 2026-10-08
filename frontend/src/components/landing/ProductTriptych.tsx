import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, RotateCcw, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import ArchitecturalBlocksScene from '@/components/landing/ArchitecturalBlocksScene';
import { useLandingSettings } from './useLandingSettings';

/**
 * Section 02: Product Triptych
 * Three monumental product experiences matching the reference art direction:
 * Panel 1: Desktop Web App (Architectural cubes + Cadmium Orange statement)
 * Panel 2: Mobile Cashly App (Candy Pink statistics screen + category ledger)
 * Panel 3: Extension Shopping Companion (Sage & Ink checkout detection frame)
 * 
 * ENHANCED: Cross-surface interactive telemetry synchronization!
 */
export default function ProductTriptych() {
    const { formatAmount, playSound } = useLandingSettings();
    const [isStagedApproved, setIsStagedApproved] = useState(false);

    // Staged item details (Base INR)
    const stagedPrice = 34990;

    // Synchronized metrics
    const desktopSafeToSpend = isStagedApproved ? 42870 - stagedPrice : 42870;
    const desktopRunway = isStagedApproved ? 32 : 42;
    const mobileTotalSpent = isStagedApproved ? 78200 + stagedPrice : 78200;

    const handleApprove = () => {
        setIsStagedApproved(true);
        playSound('success');
    };

    const handleReset = () => {
        setIsStagedApproved(false);
        playSound('click');
    };

    return (
        <section id="triptych" className="landing-triptych scroll-mt-20">
            <div className="landing-triptych__header">
                <div className="landing-triptych__tag">THE THREE FORMS OF CASHLY</div>
                <h2 className="landing-triptych__title">
                    DESKTOP.<br />
                    MOBILE.<br />
                    EXTENSION.
                </h2>
                <p className="landing-triptych__sub">
                    Three specialized surfaces working as one synchronized financial nervous system.
                    Approve a purchase in the browser extension and watch Desktop Safe-to-Spend and Mobile Ledgers update simultaneously.
                </p>
            </div>

            <div className="landing-triptych__grid">

                {/* ────────────────────────────────────────────────
                    PANEL 1: DESKTOP WEB APPLICATION
                ──────────────────────────────────────────────── */}
                <div className="landing-triptych__card landing-triptych__card--desktop landing-animate-in">
                    {/* Top: 3D Architectural Cubes */}
                    <ArchitecturalBlocksScene />

                    {/* Bottom: Cadmium Orange Console Block */}
                    <div className="landing-triptych__panel-content landing-triptych__panel-content--orange">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="landing-triptych__chip">DESKTOP CONSOLE</div>
                                {isStagedApproved && (
                                    <span style={{
                                        fontSize: '10px',
                                        background: 'rgba(0, 0, 0, 0.25)',
                                        color: '#FFFFFF',
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        <Zap size={10} className="text-yellow-300" /> Synced from Extension
                                    </span>
                                )}
                            </div>

                            <h3 className="landing-triptych__headline">
                                FINANCE<br />
                                IS OUR<br />
                                EXPERTISE.
                            </h3>

                            <div className="landing-triptych__divider" />

                            <div className="landing-triptych__metric-row">
                                <div>
                                    <span className="landing-triptych__metric-label">Safe to Spend</span>
                                    <div className="landing-triptych__metric-value">{formatAmount(desktopSafeToSpend)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="landing-triptych__metric-label">Runway</span>
                                    <div className="landing-triptych__metric-value">{desktopRunway} Days</div>
                                </div>
                            </div>

                            <p className="landing-triptych__desc">
                                A comprehensive financial workstation with double-entry ledgers, dynamic budgets, and cash runway projections.
                            </p>
                        </div>

                        <div className="landing-triptych__footer">
                            <Link to="/signup" className="landing-triptych__link">
                                <span>Explore Desktop Console</span>
                                <span>→</span>
                            </Link>
                            <div style={{
                                marginTop: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                opacity: 0.85,
                                fontWeight: 600
                            }}>
                                <span style={{ color: '#22C55E' }}>●</span> Double-Entry Verified Engine
                            </div>
                        </div>
                    </div>
                </div>

                {/* ────────────────────────────────────────────────
                    PANEL 2: MOBILE CASHLY EXPERIENCE
                ──────────────────────────────────────────────── */}
                <div className="landing-triptych__card landing-triptych__card--mobile landing-animate-in landing-animate-in-delay-1">
                    {/* Top: Pink Statistics Screen */}
                    <div className="landing-triptych__stats-screen">
                        {/* Status Bar */}
                        <div className="landing-triptych__status-bar">
                            <span className="landing-triptych__status-time">9:41</span>
                            <div className="landing-triptych__status-icons">
                                <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
                                    <rect x="0" y="8" width="3" height="4" rx="0.5" />
                                    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
                                    <rect x="9" y="3" width="3" height="9" rx="0.5" />
                                    <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
                                </svg>
                                <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                                    <path d="M8 2.5C10.5 2.5 12.8 3.5 14.5 5.2L16 3.7C13.9 1.5 11.1 0.2 8 0.2C4.9 0.2 2.1 1.5 0 3.7L1.5 5.2C3.2 3.5 5.5 2.5 8 2.5ZM8 6.5C9.5 6.5 10.9 7.1 11.9 8.1L13.4 6.6C12 5.2 10.1 4.3 8 4.3C5.9 4.3 4 5.2 2.6 6.6L4.1 8.1C5.1 7.1 6.5 6.5 8 6.5ZM8 10C8.8 10 9.5 10.7 9.5 11.5C9.5 12.3 8.8 13 8 13C7.2 13 6.5 12.3 6.5 11.5C6.5 10.7 7.2 10 8 10Z" />
                                </svg>
                                <div className="landing-triptych__battery">
                                    <div className="landing-triptych__battery-level" />
                                </div>
                            </div>
                        </div>

                        {/* Title & Toggle */}
                        <div className="landing-triptych__title-row">
                            <h3 className="landing-triptych__mobile-title">Statistic</h3>
                            <div className="landing-triptych__toggle-pill">
                                <span>y</span>
                                <span className="landing-triptych__toggle-active">m</span>
                                <span>w</span>
                            </div>
                        </div>
                        <span className="landing-triptych__sub-label">spending analysis</span>

                        {/* Big Balance */}
                        <div className="landing-triptych__big-amount">
                            {formatAmount(mobileTotalSpent)}
                        </div>

                        {/* Dual-bar Chart */}
                        <div className="landing-triptych__chart-box">
                            <svg viewBox="0 0 320 115" preserveAspectRatio="none" style={{ width: '100%', height: '100px' }}>
                                <text x="0" y="14" fontSize="9" fill="rgba(0,0,0,0.35)" fontFamily="Inter">140</text>
                                <text x="0" y="44" fontSize="9" fill="rgba(0,0,0,0.35)" fontFamily="Inter">100</text>
                                <text x="0" y="74" fontSize="9" fill="rgba(0,0,0,0.35)" fontFamily="Inter">60</text>
                                <text x="0" y="104" fontSize="9" fill="rgba(0,0,0,0.35)" fontFamily="Inter">20</text>

                                {/* September Highlight Column */}
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

                                {/* Sep */}
                                <rect x="186" y={isStagedApproved ? 6 : 14} width="7" height={isStagedApproved ? 94 : 86} rx="2" fill="#111111" />
                                <rect x="196" y="32" width="7" height="68" rx="2" fill="rgba(0,0,0,0.25)" />

                                {/* Oct */}
                                <rect x="236" y="36" width="7" height="64" rx="2" fill="#111111" />
                                <rect x="246" y="58" width="7" height="42" rx="2" fill="rgba(0,0,0,0.15)" />

                                {/* Nov */}
                                <rect x="286" y="24" width="7" height="76" rx="2" fill="#111111" />
                                <rect x="296" y="62" width="7" height="38" rx="2" fill="rgba(0,0,0,0.15)" />

                                <text x="44" y="115" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">jun</text>
                                <text x="94" y="115" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">jul</text>
                                <text x="144" y="115" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">aug</text>
                                <text x="197" y="115" fontSize="10" fill="#111111" textAnchor="middle" fontFamily="Inter" fontWeight="700">sep</text>
                                <text x="244" y="115" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">oct</text>
                                <text x="294" y="115" fontSize="9" fill="rgba(0,0,0,0.5)" textAnchor="middle" fontFamily="Inter">nov</text>
                            </svg>
                        </div>
                    </div>

                    {/* Bottom White Ledger Card */}
                    <div className="landing-triptych__ledger-bottom">
                        <div className="landing-triptych__callout">
                            <p>You spent <strong>{formatAmount(24500)}</strong> on Food in <u>September</u></p>
                            <span>Healthy burn rate • Under monthly threshold</span>
                        </div>

                        <div className="landing-triptych__category-rows">
                            {isStagedApproved && (
                                <div className="landing-triptych__cat-row" style={{ background: '#FEF3C7', margin: '-4px -6px 8px -6px', padding: '6px 8px', borderRadius: '6px' }}>
                                    <div className="landing-triptych__cat-meta">
                                        <div className="landing-triptych__cat-icon landing-triptych__cat-icon--orange">🎧</div>
                                        <span className="landing-triptych__cat-title" style={{ fontWeight: 700 }}>Amazon Staged (Reconciled)</span>
                                    </div>
                                    <div className="landing-triptych__cat-value">
                                        <span style={{ fontWeight: 700 }}>{formatAmount(stagedPrice)}</span>
                                        <span style={{ color: '#F59E0B' }}>●</span>
                                    </div>
                                </div>
                            )}

                            <div className="landing-triptych__cat-row">
                                <div className="landing-triptych__cat-meta">
                                    <div className="landing-triptych__cat-icon landing-triptych__cat-icon--orange">🍔</div>
                                    <span className="landing-triptych__cat-title">Food & Dining</span>
                                </div>
                                <div className="landing-triptych__cat-value">
                                    <span>{formatAmount(24500)}</span>
                                    <span style={{ color: '#10B981' }}>↗</span>
                                </div>
                            </div>

                            <div className="landing-triptych__cat-row">
                                <div className="landing-triptych__cat-meta">
                                    <div className="landing-triptych__cat-icon landing-triptych__cat-icon--wine">💊</div>
                                    <span className="landing-triptych__cat-title">Healthcare</span>
                                </div>
                                <div className="landing-triptych__cat-value">
                                    <span>{formatAmount(4200)}</span>
                                    <span style={{ color: '#10B981' }}>↘</span>
                                </div>
                            </div>

                            <div className="landing-triptych__cat-row">
                                <div className="landing-triptych__cat-meta">
                                    <div className="landing-triptych__cat-icon landing-triptych__cat-icon--sage">🛒</div>
                                    <span className="landing-triptych__cat-title">Supplies & Utility</span>
                                </div>
                                <div className="landing-triptych__cat-value">
                                    <span>{formatAmount(18200)}</span>
                                    <span style={{ color: '#EF4444' }}>↘</span>
                                </div>
                            </div>
                        </div>

                        <div className="landing-triptych__home-bar" />
                    </div>
                </div>

                {/* ────────────────────────────────────────────────
                    PANEL 3: EXTENSION / SHOPPING COMPANION
                ──────────────────────────────────────────────── */}
                <div className="landing-triptych__card landing-triptych__card--extension landing-animate-in landing-animate-in-delay-2">
                    {/* Top White Frame: Checkout Interception Scene */}
                    <div className="landing-triptych__extension-top">
                        <div className="landing-triptych__status-bar">
                            <span className="landing-triptych__status-time">9:41</span>
                            <span className="landing-triptych__user-pill">David Daniels</span>
                        </div>

                        <div className="landing-triptych__browser-url-bar">
                            <span className="landing-triptych__dot landing-triptych__dot--red" />
                            <span className="landing-triptych__dot landing-triptych__dot--yellow" />
                            <span className="landing-triptych__dot landing-triptych__dot--green" />
                            <span className="landing-triptych__url">checkout.amazon.com/confirm</span>
                        </div>

                        {/* Staged Purchase Alert Overlay with Interactive Approval */}
                        <div className="landing-triptych__staged-alert" style={{
                            borderColor: isStagedApproved ? '#10B981' : undefined,
                            background: isStagedApproved ? '#F0FDF4' : undefined,
                        }}>
                            <div className="landing-triptych__staged-badge" style={{ color: isStagedApproved ? '#059669' : undefined }}>
                                <span>●</span>
                                <span>{isStagedApproved ? 'CHECKOUT RECONCILED TO LEDGER' : 'CHECKOUT STAGED FOR REVIEW'}</span>
                            </div>
                            <div className="landing-triptych__staged-details">
                                <div>
                                    <div className="landing-triptych__staged-merchant">Amazon Electronics</div>
                                    <div className="landing-triptych__staged-item">Noise-Canceling Headphones</div>
                                </div>
                                <div className="landing-triptych__staged-amount">{formatAmount(stagedPrice)}</div>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                {!isStagedApproved ? (
                                    <button
                                        type="button"
                                        onClick={handleApprove}
                                        style={{
                                            width: '100%',
                                            background: 'var(--landing-ink)',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <span>Authorize & Sync to All Devices</span>
                                        <ArrowRight size={12} />
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={13} /> Posted across Desktop & Mobile
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#4B5563',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                            title="Reset Sync Demo"
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="landing-triptych__staged-footer" style={{ marginTop: '8px' }}>
                                <span className="landing-triptych__staged-tag">
                                    {isStagedApproved ? 'Sovereign Double-Entry Cleared' : 'Awaiting Approval in Inbox'}
                                </span>
                                <span className="landing-triptych__staged-chip">Stage Clean</span>
                            </div>
                        </div>

                        {/* 3-Part Color-Blocked Allocation Bar */}
                        <div className="landing-triptych__allocation-bar">
                            <div className="landing-triptych__alloc-block landing-triptych__alloc-block--pink">
                                <span className="landing-triptych__alloc-val">{formatAmount(mobileTotalSpent)}</span>
                                <span className="landing-triptych__alloc-lbl">spent</span>
                            </div>
                            <div className="landing-triptych__alloc-block landing-triptych__alloc-block--wine">
                                <span className="landing-triptych__alloc-val">{formatAmount(68200)}</span>
                                <span className="landing-triptych__alloc-lbl">bills</span>
                            </div>
                            <div className="landing-triptych__alloc-block landing-triptych__alloc-block--orange">
                                <span className="landing-triptych__alloc-val">{formatAmount(desktopSafeToSpend)}</span>
                                <span className="landing-triptych__alloc-lbl">left</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Sage Green Activity Panel */}
                    <div className="landing-triptych__sage-panel">
                        <div className="landing-triptych__sage-head">
                            <h4 className="landing-triptych__sage-title">Activity</h4>
                            <span className="landing-triptych__sage-filter">≡</span>
                        </div>
                        <p className="landing-triptych__sage-sub">budget allocation</p>

                        <div className="landing-triptych__sage-list">
                            <div className="landing-triptych__sage-item">
                                <div>
                                    <span className="landing-triptych__item-sub">01 - Payroll Deposit</span>
                                    <div className="landing-triptych__item-val">{formatAmount(125000)}</div>
                                </div>
                                <span className="landing-triptych__item-arrow">→</span>
                            </div>

                            <div className="landing-triptych__sage-item">
                                <div>
                                    <span className="landing-triptych__item-sub">
                                        {isStagedApproved ? '02 - Amazon (Reconciled)' : '02 - Amazon Staged'}
                                    </span>
                                    <div className="landing-triptych__item-val">{formatAmount(stagedPrice)}</div>
                                </div>
                                <span className="landing-triptych__item-arrow">→</span>
                            </div>
                        </div>

                        {/* Floating Nav Dock */}
                        <div className="landing-triptych__nav-dock">
                            <span className="landing-triptych__dock-active">Home</span>
                            <span>Statistic</span>
                            <span>Savings</span>
                            <span>Profile</span>
                        </div>

                        <div className="landing-triptych__home-bar" />
                    </div>
                </div>

            </div>
        </section>
    );
}
