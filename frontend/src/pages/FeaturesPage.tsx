import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { FEATURE_GROUPS } from '@/components/landing/featureCatalog';
import { LiveCheckoutCard } from '@/features/landing/LiveCheckoutCard';
import { useReveal } from '@/lib/reveal';
import { cn } from '@/lib/utils';

const wrap = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8';

const FeaturesPage = () => {
    useReveal();
    useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
    return (
        <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
            <MarketingNav />
            <main>
                <section className={cn(wrap, 'grid items-center gap-12 py-[clamp(48px,7vw,104px)] lg:grid-cols-12')} aria-labelledby="feat-h" data-reveal-group>
                    <div className="lg:col-span-6">
                        <h1 id="feat-h" className="font-display text-[length:clamp(36px,5vw,72px)] font-bold leading-[1.02] tracking-[-0.035em]" data-reveal>Everything Cashly does</h1>
                        <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-[var(--color-ink-secondary)]" data-reveal>
                            It starts with one card like this one. Approved purchases then feed your budgets, your calendar, your forecast and every answer the AI gives.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4 pr-2" data-reveal>
                            <Link to="/demo" className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-[16px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)]">Try the demo <ArrowRight size={18} /></Link>
                            <Link to="/signup" className="text-[16px] font-medium underline underline-offset-4">Create a free account</Link>
                        </div>
                    </div>
                    <div className="flex justify-center rounded-[24px] bg-[var(--color-ink)] px-5 py-12 lg:col-span-6" data-reveal>
                        <LiveCheckoutCard />
                    </div>
                </section>

                {FEATURE_GROUPS.map((group, gi) => (
                    <section key={group.id} className={cn('py-[clamp(64px,8vw,120px)]', gi % 2 === 0 && 'bg-[var(--color-surface)]')} aria-labelledby={`g-${group.id}`} data-reveal-group>
                        <div className={cn(wrap, 'grid gap-10 lg:grid-cols-12')}>
                            <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start" data-reveal>
                                <h2 id={`g-${group.id}`} className="font-display text-[length:clamp(28px,3.2vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">{group.title}</h2>
                                <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-[var(--color-ink-secondary)]">{group.description}</p>
                            </div>
                            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8" data-reveal>
                                {group.features.map((f) => (
                                    <div key={f.title}>
                                        <dt className="font-display text-[20px] font-semibold tracking-tight">{f.title}</dt>
                                        <dd className="mt-2 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">{f.description}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                ))}
            </main>
            <MarketingFooter />
        </div>
    );
};

export default FeaturesPage;
