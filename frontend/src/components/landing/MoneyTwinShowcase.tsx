import { useState } from 'react';
import { Sliders, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function MoneyTwinShowcase() {
    const [savingsOffset, setSavingsOffset] = useState(120);

    // Dynamic calculations
    const baseMonthEnd = 24150;
    const projectedBalance = baseMonthEnd + savingsOffset * 25;
    const baseRunway = 42;
    const projectedRunway = Math.round(baseRunway + savingsOffset / 10);

    // SVG trajectory curve coordinates depending on slider
    const endY = Math.max(20, Math.min(80, 55 - (savingsOffset / 300) * 35));

    return (
        <section id="money-twin" className="landing-money-twin scroll-mt-20">
            <div className="landing-money-twin__container">
                <div className="landing-money-twin__header">
                    <div className="landing-money-twin__tag">
                        <span>●</span>
                        <span>MONEY TWIN™ FORECAST ENGINE</span>
                    </div>

                    <h2 className="landing-money-twin__title">
                        IF NOTHING CHANGES,<br />
                        THIS IS WHERE YOUR<br />
                        MONTH ENDS.
                    </h2>

                    <p className="landing-money-twin__sub">
                        Deterministic cashflow forecasting grounded in your real transaction velocity,
                        fixed upcoming commitments, and historical variance. No guessing.
                    </p>
                </div>

                {/* Dark Ink Interactive Data Field */}
                <div className="landing-money-twin__field">
                    {/* Live Metric Readout Bar */}
                    <div className="mt-readout-grid">
                        <div className="mt-readout-card">
                            <span className="mt-readout-label">PROJECTED MONTH-END CASH</span>
                            <div className="mt-readout-val">
                                Rs {projectedBalance.toLocaleString()}
                            </div>
                            <span className="mt-readout-status" style={{ color: '#10B981' }}>
                                +Rs {(savingsOffset * 25).toLocaleString()} buffer
                            </span>
                        </div>

                        <div className="mt-readout-card">
                            <span className="mt-readout-label">ESTIMATED CASH RUNWAY</span>
                            <div className="mt-readout-val">
                                {projectedRunway} Days
                            </div>
                            <span className="mt-readout-status">
                                +{projectedRunway - baseRunway} days gained
                            </span>
                        </div>

                        <div className="mt-readout-card">
                            <span className="mt-readout-label">DEFICIT RISK LEVEL</span>
                            <div className="mt-readout-val" style={{ color: projectedRunway > 45 ? '#10B981' : '#F59E0B' }}>
                                {projectedRunway > 45 ? 'ZERO RISK' : 'MODERATE BUFFER'}
                            </div>
                            <span className="mt-readout-status">All commitments covered</span>
                        </div>
                    </div>

                    {/* Artwork-Grade Trajectory Visualization */}
                    <div className="mt-chart-artwork">
                        <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="mt-chart-svg">
                            <defs>
                                <linearGradient id="safeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="riskAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.0" />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.12" />
                                </linearGradient>
                            </defs>

                            {/* Safe Corridor Area */}
                            <path d="M 0 100 Q 300 80, 800 50 L 800 0 L 0 0 Z" fill="url(#safeAreaGrad)" />

                            {/* Risk Corridor Area */}
                            <path d="M 0 160 Q 400 170, 800 180 L 800 240 L 0 240 Z" fill="url(#riskAreaGrad)" />

                            {/* Grid Guide Lines */}
                            <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(255,255,255,0.06)" />
                            <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.06)" />
                            <line x1="0" y1="180" x2="800" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                            {/* Historic Actual Path (Solid White) */}
                            <path
                                d="M 0 120 Q 150 115, 300 105"
                                stroke="#FFFFFF"
                                strokeWidth="3"
                                fill="none"
                            />

                            {/* Day 18 Marker (Today) */}
                            <line x1="300" y1="20" x2="300" y2="220" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
                            <text x="305" y="35" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="Inter">Today (Day 18)</text>

                            {/* Projected Trajectory Line (Cadmium Orange - Dynamic based on slider) */}
                            <path
                                d={`M 300 105 Q 550 85, 800 ${endY}`}
                                stroke="#EE5024"
                                strokeWidth="3.5"
                                fill="none"
                            />

                            {/* Month End Marker */}
                            <circle cx="800" cy={endY} r="6" fill="#EE5024" />
                            <text x="730" y={endY - 14} fill="#EE5024" fontSize="12" fontWeight="700" fontFamily="Inter">
                                Day 30: Rs {projectedBalance.toLocaleString()}
                            </text>
                        </svg>

                        <div className="mt-chart-labels">
                            <span className="mt-badge-actual">● Actual Historic (Day 1–18)</span>
                            <span className="mt-badge-projected">● Projected Trajectory (Day 18–30)</span>
                            <span className="mt-badge-commitments">● Safe Runway Threshold</span>
                        </div>
                    </div>

                    {/* Interactive What-If Slider Controller */}
                    <div className="mt-slider-box">
                        <div className="mt-slider-header">
                            <div>
                                <span className="mt-slider-title">Simulate Discretionary Restraint</span>
                                <p className="mt-slider-sub">Drag slider to test how cutting discretionary dining/shopping impacts month-end runway</p>
                            </div>
                            <div className="mt-slider-readout">
                                <span>Adjusted: </span>
                                <strong>+Rs {(savingsOffset * 25).toLocaleString()} preserved</strong>
                            </div>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="300"
                            step="10"
                            value={savingsOffset}
                            onChange={(e) => setSavingsOffset(Number(e.target.value))}
                            className="mt-range-input"
                            aria-label="Simulate discretionary savings slider"
                        />

                        <div className="mt-slider-scale">
                            <span>$0 baseline (as-is velocity)</span>
                            <span>$150/mo restraint (+25 days)</span>
                            <span>$300/mo high restraint (+58 days)</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
