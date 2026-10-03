import { ShieldCheck, Lock, Database, Eye } from 'lucide-react';

/**
 * Trust Section — Sage color-blocked security panel
 * Reference: editorial block with feature list, matching the sage/olive palette
 */
export default function TrustSection() {
    return (
        <section id="trust" className="landing-trust scroll-mt-20">
            <div className="landing-trust__block">
                <div className="landing-trust__content">
                    <div className="landing-trust__tag">SECURITY ARCHITECTURE</div>
                    <h2 className="landing-trust__title">
                        SECURE BY<br/>
                        DESIGN, NOT<br/>
                        BY PROMISE.
                    </h2>
                    <p className="landing-trust__desc">
                        Financial software demands uncompromising technical rigor.
                        Cashly replaces fragile bank password scraping with strict cryptographic boundaries.
                    </p>

                    <div className="landing-trust__features">
                        <div className="landing-trust__feature">
                            <div className="landing-trust__feature-icon">
                                <Lock size={16} />
                            </div>
                            <span className="landing-trust__feature-text">
                                Zero bank passwords stored or transmitted. Browser-side capture only.
                            </span>
                        </div>
                        <div className="landing-trust__feature">
                            <div className="landing-trust__feature-icon">
                                <Database size={16} />
                            </div>
                            <span className="landing-trust__feature-text">
                                Postgres Row-Level Security isolates every tenant at the database layer.
                            </span>
                        </div>
                        <div className="landing-trust__feature">
                            <div className="landing-trust__feature-icon">
                                <ShieldCheck size={16} />
                            </div>
                            <span className="landing-trust__feature-text">
                                End-to-end encryption between browser extension and your private workspace.
                            </span>
                        </div>
                        <div className="landing-trust__feature">
                            <div className="landing-trust__feature-icon">
                                <Eye size={16} />
                            </div>
                            <span className="landing-trust__feature-text">
                                Nothing posts to your ledger without explicit human approval.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Visual: Architecture Diagram */}
                <div className="landing-trust__visual">
                    <div style={{
                        width: '100%',
                        maxWidth: '360px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {/* Architecture layers */}
                        {[
                            { label: 'Browser Layer', desc: 'Chrome Companion Extension', bg: 'white', accent: '#2563EB' },
                            { label: 'Transport Layer', desc: 'Encrypted WebSocket / REST', bg: 'white', accent: 'var(--landing-orange)' },
                            { label: 'Staging Layer', desc: 'Private Review Inbox', bg: 'white', accent: '#D97706' },
                            { label: 'Canonical Layer', desc: 'Postgres RLS Ledger', bg: 'var(--landing-ink)', accent: '#059669', textColor: 'white' },
                        ].map((layer, i) => (
                            <div key={i} style={{
                                background: layer.bg,
                                borderRadius: '16px',
                                padding: '20px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                color: (layer as any).textColor || 'var(--landing-ink)'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: layer.accent,
                                    opacity: 0.15,
                                    position: 'relative' as const
                                }}>
                                    <div style={{
                                        position: 'absolute' as const,
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: layer.accent,
                                        opacity: 1
                                    }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{layer.label}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>{layer.desc}</div>
                                </div>
                            </div>
                        ))}

                        {/* Connection lines */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '-8px 0'
                        }}>
                            <div style={{
                                width: '2px',
                                height: '0px',
                                background: 'rgba(0,0,0,0.1)'
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
