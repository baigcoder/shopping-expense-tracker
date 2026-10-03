import { Chrome, Inbox, BarChart3, Brain } from 'lucide-react';

/**
 * How It Works — Staggered Color-Blocked Cards
 * Reference: bold asymmetric card grid, large numbers, color blocking
 */
export default function HowItWorks() {
    return (
        <section id="how-it-works" className="landing-how scroll-mt-20">
            <div className="landing-how__header">
                <div className="landing-how__tag">
                    <span>●</span>
                    How Cashly Works
                </div>
                <h2 className="landing-how__title">
                    CAPTURE.<br/>
                    REVIEW.<br/>
                    PREDICT.
                </h2>
            </div>

            <div className="landing-how__grid">
                {/* Card 1: Capture */}
                <div className="landing-how__card landing-how__card--capture">
                    <span className="landing-how__card-number">01</span>
                    <div>
                        <span className="landing-how__card-tag">CAPTURE</span>
                        <h3 className="landing-how__card-title">
                            Shop naturally.<br/>
                            Checkouts stage themselves.
                        </h3>
                        <p className="landing-how__card-desc">
                            The lightweight browser companion captures checkouts silently from Amazon, Shopify, and any online store. Zero bank passwords needed.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Chrome size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, letterSpacing: '0.04em' }}>BROWSER COMPANION</span>
                    </div>
                </div>

                {/* Card 2: Review */}
                <div className="landing-how__card landing-how__card--review">
                    <span className="landing-how__card-number">02</span>
                    <div>
                        <span className="landing-how__card-tag">REVIEW</span>
                        <h3 className="landing-how__card-title">
                            Nothing posts until<br/>
                            you approve it.
                        </h3>
                        <p className="landing-how__card-desc">
                            Every captured transaction waits in your quiet inbox. Split, recategorize, or dismiss—your ledger stays clean.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Inbox size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, letterSpacing: '0.04em' }}>TRANSACTION INBOX</span>
                    </div>
                </div>

                {/* Card 3: Track */}
                <div className="landing-how__card landing-how__card--track">
                    <span className="landing-how__card-number">03</span>
                    <div>
                        <span className="landing-how__card-tag">TRACK</span>
                        <h3 className="landing-how__card-title">
                            Budgets, bills, goals—<br/>
                            one unified system.
                        </h3>
                        <p className="landing-how__card-desc">
                            After approval, transactions feed budgets, update forecasts, and recalculate your financial runway automatically.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BarChart3 size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, letterSpacing: '0.04em' }}>UNIFIED ANALYTICS</span>
                    </div>
                </div>

                {/* Card 4: Predict */}
                <div className="landing-how__card landing-how__card--predict">
                    <span className="landing-how__card-number">04</span>
                    <div>
                        <span className="landing-how__card-tag">PREDICT</span>
                        <h3 className="landing-how__card-title">
                            Know where your<br/>
                            month ends before it does.
                        </h3>
                        <p className="landing-how__card-desc">
                            Money Twin models your forward cashflow using burn velocity, recurring commitments, and historical variance.
                        </p>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Brain size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6, letterSpacing: '0.04em' }}>MONEY TWIN AI</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
