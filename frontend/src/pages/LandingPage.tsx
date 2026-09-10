import { useEffect } from 'react';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';

const LandingPage = () => {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
            <MarketingNav />
            <main>
                <Hero />
                <HowItWorks />
                <Features />
                <FAQ />
                <Footer />
            </main>
            <MarketingFooter />
        </div>
    );
};

export default LandingPage;
