import { useState } from 'react';
import { Sliders, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useLandingSettings } from './useLandingSettings';

const RESTRAINT_PRESETS = [
    { label: 'Baseline (0)', value: 0 },
    { label: '−Rs 2,500', value: 100 },
    { label: '−Rs 5,000', value: 200 },
    { label: '−Rs 8,000', value: 320 },
    { label: '−Rs 12,000', value: 480 },
];

export default function MoneyTwinShowcase() {
    const { formatAmount, playSound } = useLandingSettings();
    const [savingsOffset, setSavingsOffset] = useState(200);

    // Baseline financials in base INR
    const baseMonthEnd = 24150;
    const preservedAmount = savingsOffset * 25; // 0 to 12500
    const projectedBalance = baseMonthEnd + preservedAmount;
    const baseRunway = 42;
    const runwayGain = Math.round(savingsOffset / 8);
    const projectedRunway = baseRunway + runwayGain;

    // SVG trajectory curve coordinates depending on slider (0 to 500)
    // 0 -> endY is 120 (drops lower), 500 -> endY is 30 (climbs higher)
    const endY = Math.max(25, Math.min(130, 95 - (savingsOffset / 500) * 70));
    const baselineEndY = 95;

    // Deficit Collision Radar logic
    const hasDeficitAlert = savingsOffset === 0;
    const deficitCollisionDay = 24;

    const handleSliderChange = (newVal: number) => {
        setSavingsOffset(newVal);
    };

    const handleSelectPreset = (val: number) => {
        setSavingsOffset(val);
        playSound('click');
    };

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
                                {formatAmount(projectedBalance)}
                            </div>
                            <span className="mt-readout-status" style={{ color: preservedAmount > 0 ? '#10B981' : '#9CA3AF' }}>
                                {preservedAmount > 0 ? `+${formatAmount(preservedAmount)} buffer` : 'Unrestrained velocity'}
                            </span>
                        </div>

                        <div className="mt-readout-card">
                            <span className="mt-readout-label">ESTIMATED CASH RUNWAY</span>
                            <div className="mt-readout-val">
                                {projectedRunway} Days
                            </div>
                            <span className="mt-readout-status">
                                +{runwayGain} days gained
                            </span>
                        </div>

                        <div className="mt-readout-card">
                            <span className="mt-readout-label">DEFICIT COLLISION RADAR</span>
                            <div className="mt-readout-val" style={{ color: hasDeficitAlert ? '#F59E0B' : '#10B981' }}>
                                {hasDeficitAlert ? 'DEFICIT RISK' : 'COLLISION AVERTED'}
                            </div>
                            <span className="mt-readout-status">
                                {hasDeficitAlert ? `Collides Day ${deficitCollisionDay} without restraint` : 'All fixed commitments protected'}
                            </span>
                        </div>
                    </div>

                    {/* Deficit Collision Banner Alert */}
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        background: hasDeficitAlert ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${hasDeficitAlert ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {hasDeficitAlert ? (
                                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                            ) : (
                                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                            )}
                            <div style={{ fontSize: '13px', color: '#F3F4F6' }}>
                                {hasDeficitAlert ? (
                                    <>
                                        <strong>Radar Warning:</strong> At current 7-day velocity, liquid reserves risk dipping near the {formatAmount(18000)} rent threshold around <strong>Day 24</strong>.
                                    </>
                                ) : (
                                    <>
                                        <strong>Runway Buffer Secured:</strong> Preserving <strong>{formatAmount(preservedAmount)}</strong> delays or completely eliminates fixed-expense collision risk.
                                    </>
                                )}
                            </div>
                        </div>

                        {hasDeficitAlert && (
                            <button
                                type="button"
                                onClick={() => handleSelectPreset(200)}
                                style={{
                                    background: 'var(--landing-orange)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Simulate Safe Restraint
                            </button>
                        )}
                    </div>

                    {/* Artwork-Grade Trajectory Visualization */}
                    <div className="mt-chart-artwork">
                        <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="mt-chart-svg">
                            <defs>
                                <linearGradient id="safeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="riskAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.0" />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.15" />
                                </linearGradient>
                            </defs>

                            {/* Safe Corridor Area */}
                            <path d="M 0 100 Q 300 80, 800 40 L 800 0 L 0 0 Z" fill="url(#safeAreaGrad)" />

                            {/* Risk Corridor Area */}
                            <path d="M 0 160 Q 400 170, 800 180 L 800 240 L 0 240 Z" fill="url(#riskAreaGrad)" />

                            {/* Grid Guide Lines */}
                            <line x1="0" y1="60" x2="800" y2="60" stroke="rgba(255,255,255,0.06)" />
                            <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.06)" />
                            <line x1="0" y1="180" x2="800" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                            {/* Fixed Commitment / Rent Barrier Line */}
                            <line x1="0" y1="140" x2="800" y2="140" stroke="rgba(239, 68, 68, 0.45)" strokeDasharray="4 4" strokeWidth="1.5" />
                            <text x="12" y="135" fill="rgba(239, 68, 68, 0.8)" fontSize="10" fontFamily="Inter" fontWeight="600">
                                Fixed Rent/Commitment Barrier ({formatAmount(18000)})
                            </text>

                            {/* Historic Actual Path (Solid White) */}
                            <path
                                d="M 0 120 Q 150 115, 300 105"
                                stroke="#FFFFFF"
                                strokeWidth="3"
                                fill="none"
                            />

                            {/* Baseline Path (Without Restraint - Dashed) */}
                            <path
                                d={`M 300 105 Q 550 100, 800 ${baselineEndY}`}
                                stroke="rgba(255, 255, 255, 0.25)"
                                strokeWidth="2"
                                strokeDasharray="5 5"
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
                            <text x="640" y={endY - 14} fill="#EE5024" fontSize="12" fontWeight="700" fontFamily="Inter">
                                Day 30: {formatAmount(projectedBalance)}
                            </text>
                        </svg>

                        <div className="mt-chart-labels">
                            <span className="mt-badge-actual">● Actual Historic (Day 1–18)</span>
                            <span className="mt-badge-projected">● Simulated Trajectory (Day 18–30)</span>
                            <span style={{ color: 'rgba(239,68,68,0.85)' }}>● Rent Barrier Threshold</span>
                            <span className="mt-badge-commitments">● Safe Runway Corridor</span>
                        </div>
                    </div>

                    {/* Interactive What-If Slider Controller & Tactile Presets */}
                    <div className="mt-slider-box">
                        <div className="mt-slider-header">
                            <div>
                                <span className="mt-slider-title">Simulate Velocity Restraint</span>
                                <p className="mt-slider-sub">
                                    Dial in monthly discretionary restraint to immediately compute runway expansion and avoid deficit collision
                                </p>
                            </div>
                            <div className="mt-slider-readout">
                                <span>Preserved Discretionary: </span>
                                <strong>+{formatAmount(preservedAmount)} / month</strong>
                            </div>
                        </div>

                        {/* Presets Chips */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            {RESTRAINT_PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => handleSelectPreset(p.value)}
                                    style={{
                                        background: savingsOffset === p.value ? 'var(--landing-orange)' : 'rgba(255, 255, 255, 0.08)',
                                        color: savingsOffset === p.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                                        border: savingsOffset === p.value ? '1px solid var(--landing-orange)' : '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '100px',
                                        padding: '4px 12px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {p.value === 0 ? p.label : `−${formatAmount(p.value * 25)}`}
                                </button>
                            ))}
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="20"
                            value={savingsOffset}
                            onChange={(e) => handleSliderChange(Number(e.target.value))}
                            className="mt-range-input"
                            aria-label="Simulate discretionary savings slider"
                        />

                        <div className="mt-slider-scale">
                            <span>{formatAmount(0)} baseline (as-is velocity)</span>
                            <span>{formatAmount(5000)}/mo restraint (+25 days)</span>
                            <span>{formatAmount(12500)}/mo high restraint (+62 days)</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
