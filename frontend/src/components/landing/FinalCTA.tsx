import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Final CTA — Full-bleed Orange Color Block
 * Reference: bold color blocking, massive typography, cinematic presence
 */
export default function FinalCTA() {
    return (
        <section className="landing-final-cta">
            <div className="landing-final-cta__block">
                <h2 className="landing-final-cta__title">
                    STOP TRACKING<br/>
                    WHAT HAPPENED.<br/>
                    START KNOWING<br/>
                    WHAT'S NEXT.
                </h2>

                <p className="landing-final-cta__desc">
                    Join Cashly today. Capture spending silently as you shop, maintain total review authority over your ledger,
                    and predict your month-end cashflow with confidence.
                </p>

                <div className="landing-final-cta__actions">
                    <Link to="/signup" className="landing-final-cta__btn landing-final-cta__btn--primary">
                        Create a free account
                        <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="landing-final-cta__btn landing-final-cta__btn--secondary">
                        Sign in
                    </Link>
                </div>

                {/* Trust micro-strip */}
                <div style={{
                    marginTop: '48px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    flexWrap: 'wrap' as const,
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.7)'
                }}>
                    <span>✓ Free to start</span>
                    <span>✓ No bank passwords</span>
                    <span>✓ Chrome companion included</span>
                </div>
            </div>
        </section>
    );
}
