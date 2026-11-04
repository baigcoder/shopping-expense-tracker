import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { CORE_FAQS, MORE_FAQS, Questions } from '@/features/landing/Questions';
import { useReveal } from '@/lib/reveal';

const FAQPage = () => {
    useReveal();
    useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
    return (
        <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
            <MarketingNav />
            <main>
                <Questions id="faq" heading="Questions, answered" headingAs="h1" items={[...CORE_FAQS, ...MORE_FAQS]} className="bg-[var(--color-surface)]" />
                <section className="mx-auto flex w-full max-w-[1320px] flex-wrap items-end justify-between gap-6 px-5 py-[clamp(72px,9vw,136px)] sm:px-8" aria-labelledby="still-h">
                    <h2 id="still-h" className="max-w-[18ch] font-display text-[length:clamp(28px,3.4vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">Still wondering? Try it with sample money.</h2>
                    <div className="flex flex-wrap items-center gap-5">
                        <Link to="/contact" className="text-[16px] font-medium underline underline-offset-4">Ask us directly</Link>
                        <Link to="/demo" className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-[16px] font-semibold text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)]">
                            Try the demo <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>
            <MarketingFooter />
        </div>
    );
};

export default FAQPage;
