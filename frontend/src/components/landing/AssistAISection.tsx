import { Chrome, ShieldCheck, Lock, Database, Eye } from 'lucide-react';

/**
 * Extension + AI Combined Section
 * Reference: sage/olive color blocking with editorial text
 */
export default function AssistAISection() {
    return (
        <section id="assist" className="scroll-mt-20" style={{
            padding: 'clamp(60px, 8vw, 120px) clamp(20px, 4vw, 64px)',
            maxWidth: '1440px',
            margin: '0 auto'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '20px',
                minHeight: '500px'
            }}>
                {/* Left: Extension Showcase */}
                <div style={{
                    background: 'var(--landing-sage)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(40px, 5vw, 64px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{
                            display: 'inline-flex',
                            padding: '6px 16px',
                            background: 'white',
                            color: 'var(--landing-ink)',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase' as const
                        }}>
                            BROWSER COMPANION
                        </div>

                        <h2 style={{
                            fontFamily: 'var(--landing-font-display)',
                            fontSize: 'clamp(32px, 4vw, 52px)',
                            fontWeight: 800,
                            lineHeight: 0.95,
                            letterSpacing: '-0.03em',
                            marginTop: '24px',
                            color: 'var(--landing-ink)',
                            textTransform: 'uppercase' as const
                        }}>
                            CAPTURES<br/>
                            CHECKOUTS<br/>
                            SILENTLY.
                        </h2>

                        <p style={{
                            fontSize: '15px',
                            lineHeight: 1.7,
                            color: 'var(--landing-ink-secondary)',
                            marginTop: '20px',
                            maxWidth: '440px'
                        }}>
                            A lightweight Chrome extension that watches for order confirmations across every e-commerce site. No bank credentials. No manual entry. Just shop and Cashly stages it.
                        </p>
                    </div>

                    {/* Mini browser chrome demo */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginTop: '32px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: '#FAFAFA',
                            borderBottom: '1px solid #E5E5E0'
                        }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5F57' }} />
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBD2E' }} />
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28CA41' }} />
                            </div>
                            <div style={{
                                flex: 1,
                                background: '#F0F0EA',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: '#999'
                            }}>
                                checkout.amazon.com/order-confirmation
                            </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Chrome size={20} color="#2563EB" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--landing-ink)' }}>Cashly Companion</span>
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#059669',
                                background: '#ECFDF5',
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontFamily: 'monospace'
                            }}>
                                CAPTURED
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: AI Co-Pilot */}
                <div style={{
                    background: 'var(--landing-ink)',
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
                            AI CO-PILOT
                        </div>

                        <h2 style={{
                            fontFamily: 'var(--landing-font-display)',
                            fontSize: 'clamp(28px, 3.5vw, 44px)',
                            fontWeight: 800,
                            lineHeight: 0.95,
                            letterSpacing: '-0.03em',
                            marginTop: '24px',
                            textTransform: 'uppercase' as const
                        }}>
                            INTELLIGENCE<br/>
                            GROUNDED<br/>
                            IN REALITY.
                        </h2>

                        <p style={{
                            fontSize: '14px',
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.65)',
                            marginTop: '20px',
                            maxWidth: '340px'
                        }}>
                            Not a generic chatbot. A financial co-pilot that generates executable action chips from your real, approved ledger data.
                        </p>
                    </div>

                    {/* AI action chips */}
                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { text: 'Protect Friday headroom', color: 'var(--landing-orange)' },
                            { text: 'View dining trajectory', color: 'var(--landing-pink)' },
                            { text: 'Set budget velocity alert', color: 'var(--landing-sage)' }
                        ].map((chip, i) => (
                            <div key={i} style={{
                                padding: '12px 18px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                fontSize: '13px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: chip.color
                                }} />
                                {chip.text}
                                <span style={{ marginLeft: 'auto', opacity: 0.4 }}>→</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
