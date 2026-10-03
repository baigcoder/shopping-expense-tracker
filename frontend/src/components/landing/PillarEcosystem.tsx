import { useState } from 'react';
import { Check, CreditCard, ShieldCheck, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Product Showcase — Cinematic Split with Live Demo
 * Reference: asymmetric text + product layout, bold text on dark background
 */
export default function PillarEcosystem() {
    const [posted, setPosted] = useState(false);

    return (
        <section id="pillars" className="landing-showcase scroll-mt-20">
            <div className="landing-showcase__grid">
                {/* Left: Text Block */}
                <div className="landing-showcase__text">
                    <div className="landing-showcase__tag">LIVE PRODUCT DEMO</div>
                    <h2 className="landing-showcase__title">
                        THE REVIEW-FIRST<br/>
                        ARCHITECTURE.
                    </h2>
                    <p className="landing-showcase__desc">
                        Every purchase captured by the browser companion sits in your quiet inbox.
                        Nothing touches your canonical ledger until you decide.
                        Split, recategorize, or dismiss with one tap.
                    </p>

                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            'Capture happens silently in the browser',
                            'Transactions stage in a private review queue',
                            'You approve before it hits the ledger',
                            'Budgets & forecasts update instantly'
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--landing-orange)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Check size={12} color="white" />
                                </div>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Interactive Product Card */}
                <div className="landing-showcase__product">
                    <div className="landing-showcase__device" style={{ transform: 'none', maxWidth: '100%' }}>
                        {/* Window chrome */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#FAFAFA',
                            borderBottom: '1px solid #E5E5E0'
                        }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F57' }} />
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28CA41' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#999' }}>
                                cashly.app / inbox
                            </span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#059669',
                                background: '#ECFDF5',
                                padding: '2px 8px',
                                borderRadius: '100px'
                            }}>
                                ● Live
                            </span>
                        </div>

                        {/* Transaction Card */}
                        <div style={{ padding: '20px' }}>
                            {!posted ? (
                                <div>
                                    {/* Pending Transaction */}
                                    <div style={{
                                        background: '#FFF7ED',
                                        border: '1px solid #FED7AA',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '12px',
                                                    background: 'var(--landing-orange)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '14px'
                                                }}>FP</div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '15px' }}>Foodpanda Delivery</span>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            color: '#D97706',
                                                            background: '#FEF3C7',
                                                            padding: '2px 8px',
                                                            borderRadius: '100px'
                                                        }}>Unposted</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#78716C', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ background: '#F5F5F0', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>Dining</span>
                                                        <span>•</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <CreditCard size={10} /> ••4821
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 700, fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}>Rs 1,240</span>
                                                <p style={{ fontSize: '10px', color: '#A8A29E' }}>Pending</p>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: '16px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid #FED7AA',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontSize: '11px', color: '#78716C' }}>Nothing alters your ledger until you confirm.</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button style={{
                                                    padding: '6px 14px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    border: '1px solid #E5E5E0',
                                                    borderRadius: '8px',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    color: '#4A4A4A'
                                                }}>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setPosted(true)}
                                                    style={{
                                                        padding: '6px 18px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        background: 'var(--landing-orange)',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Check size={13} /> Approve
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trust line */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        color: '#78716C',
                                        padding: '8px 12px',
                                        background: '#F5F5F0',
                                        borderRadius: '10px'
                                    }}>
                                        <ShieldCheck size={14} color="#059669" />
                                        <span>Staged without bank logins</span>
                                        <span style={{ marginLeft: 'auto', color: 'var(--landing-orange)', fontWeight: 600 }}>Tap Approve →</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* Posted state */}
                                    <div style={{
                                        background: '#ECFDF5',
                                        border: '1px solid #A7F3D0',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: '#059669',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Check size={16} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Foodpanda Delivery</span>
                                                    <span style={{
                                                        fontSize: '9px',
                                                        fontWeight: 700,
                                                        color: '#059669',
                                                        background: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #A7F3D0',
                                                        fontFamily: 'monospace'
                                                    }}>POSTED</span>
                                                </div>
                                                <p style={{ fontSize: '11px', color: '#57534E' }}>Record #8429</p>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '16px', fontVariantNumeric: 'tabular-nums' }}>-Rs 1,240</span>
                                        </div>
                                    </div>

                                    {/* Impact grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{ padding: '14px', border: '1px solid #E5E5E0', borderRadius: '12px', background: 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                <span style={{ fontWeight: 600 }}>Dining Budget</span>
                                                <span style={{ fontWeight: 700, color: '#D97706', fontVariantNumeric: 'tabular-nums' }}>78%</span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '3px', background: '#F5F5F0', marginTop: '8px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: '78%', borderRadius: '3px', background: '#D97706', transition: 'width 0.7s ease' }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', color: '#D97706', fontWeight: 500 }}>
                                                <AlertCircle size={10} />
                                                <span>14% faster than target</span>
                                            </div>
                                        </div>
                                        <div style={{ padding: '14px', border: '1px solid #E5E5E0', borderRadius: '12px', background: 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                <span style={{ fontWeight: 600 }}>Money Twin</span>
                                                <span style={{ fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>Rs 24,150</span>
                                            </div>
                                            <div style={{ marginTop: '8px', fontSize: '11px', color: '#78716C' }}>
                                                <div>Burn: <strong style={{ color: '#1A1A1A' }}>Rs 1,840/day</strong></div>
                                                <div>Runway: <strong style={{ color: '#059669' }}>42 days</strong></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Alert */}
                                    <div style={{
                                        background: '#F5F0FF',
                                        border: '1px solid #DDD6FE',
                                        borderRadius: '12px',
                                        padding: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>
                                            <Sparkles size={14} />
                                            AI Observation
                                        </div>
                                        <p style={{ fontSize: '12px', marginTop: '6px', lineHeight: 1.5, color: '#1A1A1A' }}>
                                            "Dining spiked. You have 2 utility bills (Rs 4,600) due Friday."
                                        </p>
                                        <button
                                            onClick={() => setPosted(false)}
                                            style={{
                                                marginTop: '10px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--landing-orange)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            ← Replay demo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
