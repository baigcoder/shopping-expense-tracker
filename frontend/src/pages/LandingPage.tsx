import { useEffect } from 'react';
import EditorialHero from '@/components/landing/EditorialHero';
import ProductTriptych from '@/components/landing/ProductTriptych';
import LifecycleStory from '@/components/landing/LifecycleStory';
import ReviewFirstDifference from '@/components/landing/ReviewFirstDifference';
import DesktopShowcase from '@/components/landing/DesktopShowcase';
import MobileShowcase from '@/components/landing/MobileShowcase';
import PillarSystem from '@/components/landing/PillarSystem';
import MoneyTwinShowcase from '@/components/landing/MoneyTwinShowcase';
import AIShowcase from '@/components/landing/AIShowcase';
import ExtensionShowcase from '@/components/landing/ExtensionShowcase';
import TrustArchitecture from '@/components/landing/TrustArchitecture';
import FinalCampaignCTA from '@/components/landing/FinalCampaignCTA';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import '@/components/landing/landing.css';

/**
 * CASHLY LANDING V10 — EDITORIAL / CINEMATIC FINTECH SHOWCASE
 * 
 * 14-Stage Visual Narrative:
 * 01 HERO — Campaign Poster with monumental typography & Architectural Blocks
 * 02 PRODUCT TRIPTYCH — Three large product canvases (Desktop, Mobile, Extension)
 * 03 CASHLY LIFECYCLE — 6-stage interactive transformation (Capture -> Review -> Understand -> Plan -> Predict -> Act)
 * 04 REVIEW-FIRST DIFFERENCE — Sovereign review pipeline vs delayed bank scrapers
 * 05/06 DESKTOP EXPERIENCE — Full financial console showcase (Safe to Spend, commitments, attention, ledger)
 * 07 MOBILE EXPERIENCE — Touch-native mobile phone showcase with tabbed sub-screens
 * 08 FIVE-PILLAR SYSTEM — Interconnected 5 pillars with interactive state switching
 * 09 MONEY TWIN — Dark data field with predictive trajectory & interactive what-if slider
 * 10 AI / ASSIST — Technical financial decision surface with real ledger anomalies
 * 11 EXTENSION COMPANION — Checkout interception HUD with supported stores ribbon
 * 12 TRUST / SECURITY — Architectural security flow & cryptographic isolation
 * 13 FINAL CTA — Saturated Cadmium Orange visual climax
 * 14 FOOTER — Minimal editorial brand footer
 */
const LandingPage = () => {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        const scrollToHash = () => {
            const id = window.location.hash.replace('#', '');
            if (!id) return;
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        scrollToHash();
        window.addEventListener('hashchange', scrollToHash);
        return () => window.removeEventListener('hashchange', scrollToHash);
    }, []);

    return (
        <div className="landing-root">
            <MarketingNav />
            <main>
                {/* 01 HERO */}
                <EditorialHero />

                {/* 02 PRODUCT TRIPTYCH */}
                <ProductTriptych />

                {/* 03 CASHLY LIFECYCLE */}
                <LifecycleStory />

                {/* 04 REVIEW-FIRST DIFFERENCE */}
                <ReviewFirstDifference />

                {/* 05/06 DESKTOP EXPERIENCE */}
                <DesktopShowcase />

                {/* 07 MOBILE EXPERIENCE */}
                <MobileShowcase />

                {/* 08 FIVE-PILLAR SYSTEM */}
                <PillarSystem />

                {/* 09 MONEY TWIN */}
                <MoneyTwinShowcase />

                {/* 10 AI / ASSIST */}
                <AIShowcase />

                {/* 11 EXTENSION COMPANION */}
                <ExtensionShowcase />

                {/* 12 TRUST / SECURITY */}
                <TrustArchitecture />

                {/* 13 FINAL CTA */}
                <FinalCampaignCTA />
            </main>
            {/* 14 FOOTER */}
            <MarketingFooter />
        </div>
    );
};

export default LandingPage;

