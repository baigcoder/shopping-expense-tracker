import { Target, TrendingUp, Sparkles, Shield, Wallet } from 'lucide-react';

/**
 * Features Bento — Asymmetric Feature Showcase
 * Reference: large visual blocks, bold color blocking, mixed panel sizes
 */
export default function WhyCashlySection() {
    return (
        <section id="why-cashly" className="landing-features scroll-mt-20">
            <div className="landing-features__header">
                <div className="landing-features__tag">THE 5-PILLAR SYSTEM</div>
                <h2 className="landing-features__title">
                    EVERY SURFACE<br/>
                    CONNECTED.<br/>
                    ONE OPERATING<br/>
                    SYSTEM.
                </h2>
            </div>

            <div className="landing-features__bento">
                {/* Large card: Budgets */}
                <div className="landing-features__card landing-features__card--budgets">
                    <div className="landing-features__card-icon landing-features__card-icon--light">
                        <Target size={22} />
                    </div>
                    <div>
                        <h3 className="landing-features__card-title">
                            Budgets that<br/>
                            breathe with<br/>
                            your spending.
                        </h3>
                        <p className="landing-features__card-desc">
                            Forward-looking budgets update in real-time as transactions post to your canonical ledger. See velocity warnings before you overspend.
                        </p>
                    </div>
                    <div className="landing-features__card-stat">
                        <div className="landing-features__card-stat-value">Rs 78,200</div>
                        <div className="landing-features__card-stat-label">Monthly budget capacity</div>
                    </div>
                </div>

                {/* Forecast card */}
                <div className="landing-features__card landing-features__card--forecast">
                    <div className="landing-features__card-icon landing-features__card-icon--light">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <h3 className="landing-features__card-title">
                            Money Twin<br/>
                            Forecast Engine.
                        </h3>
                        <p className="landing-features__card-desc">
                            "If nothing changes, this is where your month ends." Predictive modeling grounded in your real data.
                        </p>
                    </div>
                    <div className="landing-features__card-stat">
                        <div className="landing-features__card-stat-value">42 days</div>
                        <div className="landing-features__card-stat-label">Cash runway projected</div>
                    </div>
                </div>

                {/* AI card */}
                <div className="landing-features__card landing-features__card--ai">
                    <div className="landing-features__card-icon landing-features__card-icon--dark">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h3 className="landing-features__card-title">
                            AI that acts on<br/>
                            your real numbers.
                        </h3>
                        <p className="landing-features__card-desc">
                            Not a chatbot repeating internet advice. A co-pilot that generates action chips connected to your approved ledger data.
                        </p>
                    </div>
                    <div className="landing-features__card-stat">
                        <div className="landing-features__card-stat-value" style={{ color: 'var(--landing-orange)' }}>3 alerts</div>
                        <div className="landing-features__card-stat-label">Active insights this week</div>
                    </div>
                </div>
            </div>

            {/* Secondary feature strip */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginTop: '20px'
            }}>
                <div style={{
                    background: 'var(--landing-sage)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(28px, 3vw, 40px)',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'space-between'
                }}>
                    <Shield size={20} style={{ color: 'var(--landing-ink)' }} />
                    <div>
                        <h4 style={{
                            fontFamily: 'var(--landing-font-sans)',
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--landing-ink)',
                            lineHeight: 1.2
                        }}>
                            Zero bank passwords stored
                        </h4>
                        <p style={{
                            fontSize: '13px',
                            color: 'var(--landing-ink-secondary)',
                            marginTop: '8px',
                            lineHeight: 1.5
                        }}>
                            Browser-side capture with row-level security isolation.
                        </p>
                    </div>
                </div>

                <div style={{
                    background: 'var(--landing-pink)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(28px, 3vw, 40px)',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'space-between'
                }}>
                    <Wallet size={20} style={{ color: 'var(--landing-ink)' }} />
                    <div>
                        <h4 style={{
                            fontFamily: 'var(--landing-font-sans)',
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--landing-ink)',
                            lineHeight: 1.2
                        }}>
                            Bills, subscriptions & recurring
                        </h4>
                        <p style={{
                            fontSize: '13px',
                            color: 'var(--landing-ink-secondary)',
                            marginTop: '8px',
                            lineHeight: 1.5
                        }}>
                            Track every commitment. Get warned before they hit.
                        </p>
                    </div>
                </div>

                <div style={{
                    background: 'var(--landing-ink)',
                    borderRadius: 'var(--landing-r-lg)',
                    padding: 'clamp(28px, 3vw, 40px)',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'space-between',
                    color: 'white'
                }}>
                    <TrendingUp size={20} />
                    <div>
                        <h4 style={{
                            fontFamily: 'var(--landing-font-sans)',
                            fontSize: '20px',
                            fontWeight: 700,
                            lineHeight: 1.2
                        }}>
                            Reports you can share
                        </h4>
                        <p style={{
                            fontSize: '13px',
                            opacity: 0.75,
                            marginTop: '8px',
                            lineHeight: 1.5
                        }}>
                            Export clean financial reports at any time range.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
