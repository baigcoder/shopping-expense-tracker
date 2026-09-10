import { useEffect } from 'react';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Analyze from '@/components/landing/Analyze';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';

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
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
            <MarketingNav />
            <main>
                <Hero />
                <HowItWorks />
                <Features />
                <Analyze />
                <FAQ />
                <Footer />
            </main>
            <MarketingFooter />
        </div>
    );
};

export default LandingPage;
