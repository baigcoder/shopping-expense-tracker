import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function FinalCampaignCTA() {
    return (
        <section id="final-cta" className="landing-final-campaign scroll-mt-20">
            <div className="landing-final-campaign__block">
                <div className="landing-final-campaign__tag">
                    <Sparkles size={14} />
                    <span>THE NEW STANDARD FOR PERSONAL FINANCE</span>
                </div>

                <h2 className="landing-final-campaign__title">
                    KNOW WHAT HAPPENED.<br />
                    KNOW WHAT COMES NEXT.
                </h2>

                <p className="landing-final-campaign__desc">
                    Stop letting delayed bank statements dictate your financial reality.
                    Capture checkouts silently at source, review on your own terms, and forecast
                    your cash runway with Money Twin.
                </p>

                <div className="landing-final-campaign__actions">
                    <Link to="/signup" className="landing-final-btn landing-final-btn--white">
                        <span>Create Free Account</span>
                        <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="landing-final-btn landing-final-btn--translucent">
                        <span>Sign In to Console</span>
                    </Link>
                </div>

                <div className="landing-final-campaign__guarantees">
                    <div className="guarantee-item">
                        <ShieldCheck size={14} />
                        <span>Zero Bank Passwords Needed</span>
                    </div>
                    <div className="guarantee-item">
                        <span>●</span>
                        <span>Private Local Browser Extension</span>
                    </div>
                    <div className="guarantee-item">
                        <span>●</span>
                        <span>Free Tier Available Forever</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
