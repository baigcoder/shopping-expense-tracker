import { useState } from 'react';
import { Sliders, TrendingUp } from 'lucide-react';

/**
 * Money Twin Section — Cinematic Forecasting Visual
 * Reference: large typography, color-blocked panels, editorial layout
 */
export default function MoneyTwinSection() {
    const [savings, setSavings] = useState(100);
    const monthEnd = 24150 + savings * 15;
    const runway = 42 + Math.round(savings / 14);

    return (
        <section id="money-twin" className="scroll-mt-20" style={{
            padding: 'clamp(60px, 8vw, 120px) clamp(20px, 4vw, 64px)',
            maxWidth: '1440px',
            margin: '0 auto'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                minHeight: '560px'
            }}>
                {/* Left: Interactive Forecast Card */}
                <div style={{
                    background: 'var(--landing-burgundy)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(40px, 5vw, 64px)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            padding: '6px 16px',
                            background: 'var(--landing-orange)',
                            color: 'white',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase' as const
                        }}>
                            MONEY TWIN
                        </div>

                        <h2 style={{
                            fontFamily: 'var(--landing-font-display)',
                            fontSize: 'clamp(32px, 4vw, 52px)',
                            fontWeight: 800,
                            lineHeight: 0.95,
                            letterSpacing: '-0.03em',
                            marginTop: '24px',
                            textTransform: 'uppercase' as const
                        }}>
                            WHERE YOUR<br/>
                            MONTH ENDS<br/>
                            BEFORE IT<br/>
                            DOES.
                        </h2>

                        <p style={{
                            fontSize: '15px',
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.7)',
                            marginTop: '20px',
                            maxWidth: '400px'
                        }}>
                            Predictive modeling using burn velocity, recurring commitments, and historical variance. Adjust the slider to see how saving more changes your trajectory.
                        </p>
                    </div>

                    {/* Forecast Readout */}
                    <div style={{ marginTop: '32px' }}>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <div>
                                <span style={{
                                    fontFamily: 'var(--landing-font-sans)',
                                    fontSize: 'clamp(32px, 4vw, 48px)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    display: 'block',
                                    lineHeight: 1
                                }}>
                                    Rs {monthEnd.toLocaleString()}
                                </span>
                                <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px', display: 'block' }}>projected month-end</span>
                            </div>
                            <div>
                                <span style={{
                                    fontFamily: 'var(--landing-font-sans)',
                                    fontSize: 'clamp(32px, 4vw, 48px)',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    display: 'block',
                                    lineHeight: 1
                                }}>
                                    {runway}
                                </span>
                                <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px', display: 'block' }}>day runway</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Interactive Slider + Chart */}
                <div style={{
                    background: 'var(--landing-pink)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(40px, 5vw, 64px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <Sliders size={18} color="var(--landing-ink)" />
                            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--landing-ink-secondary)' }}>
                                WHAT-IF SIMULATOR
                            </span>
                        </div>

                        <h3 style={{
                            fontFamily: 'var(--landing-font-serif)',
                            fontSize: '28px',
                            color: 'var(--landing-ink)',
                            marginBottom: '24px'
                        }}>
                            Save more, shift the curve
                        </h3>

                        {/* Slider */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                                <span style={{ color: 'var(--landing-ink-secondary)' }}>Daily savings adjustment</span>
                                <span style={{ color: 'var(--landing-ink)', fontVariantNumeric: 'tabular-nums' }}>Rs {savings}/day</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={300}
                                value={savings}
                                onChange={(e) => setSavings(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '4px',
                                    appearance: 'none',
                                    background: 'var(--landing-ink)',
                                    borderRadius: '2px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--landing-ink-secondary)', marginTop: '4px' }}>
                                <span>Rs 0</span>
                                <span>Rs 300</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Chart */}
                    <svg viewBox="0 0 400 200" style={{ width: '100%' }}>
                        {/* Grid */}
                        <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(0,0,0,0.06)" />
                        <line x1="40" y1="60" x2="380" y2="60" stroke="rgba(0,0,0,0.06)" />
                        <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(0,0,0,0.06)" />
                        <line x1="40" y1="140" x2="380" y2="140" stroke="rgba(0,0,0,0.06)" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="rgba(0,0,0,0.06)" />

                        {/* Baseline path */}
                        <path
                            d="M 40 40 C 120 45, 180 80, 210 100 C 240 120, 300 150, 380 170"
                            stroke="rgba(0,0,0,0.15)"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="4 4"
                        />

                        {/* Adjusted path */}
                        <path
                            d={`M 40 40 C 120 42, 180 ${70 - savings * 0.1}, 210 ${85 - savings * 0.15} C 240 ${100 - savings * 0.2}, 300 ${120 - savings * 0.25}, 380 ${140 - savings * 0.3}`}
                            stroke="var(--landing-ink)"
                            strokeWidth="2.5"
                            fill="none"
                        />

                        {/* Today marker */}
                        <line x1="210" y1="15" x2="210" y2="185" stroke="var(--landing-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="210" y="196" fontSize="10" fill="var(--landing-orange)" textAnchor="middle" fontWeight="600">today</text>

                        {/* Labels */}
                        <text x="40" y="196" fontSize="10" fill="rgba(0,0,0,0.4)" fontFamily="Inter">Day 1</text>
                        <text x="380" y="196" fontSize="10" fill="rgba(0,0,0,0.4)" fontFamily="Inter" textAnchor="end">Day 30</text>

                        {/* Endpoint dot */}
                        <circle cx="380" cy={140 - savings * 0.3} r="5" fill="var(--landing-ink)" />
                    </svg>

                    <div style={{
                        marginTop: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--landing-ink-secondary)'
                    }}>
                        <TrendingUp size={14} />
                        <span>Compound 3yr effect: <strong style={{ color: 'var(--landing-ink)' }}>Rs {(savings * 36 * 1.12).toLocaleString()}</strong></span>
                    </div>
                </div>
            </div>
        </section>
    );
}
