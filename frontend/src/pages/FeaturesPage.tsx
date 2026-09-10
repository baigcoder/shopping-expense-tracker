import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { FEATURE_GROUPS, HOW_IT_WORKS } from '@/components/landing/featureCatalog';
import BRAND from '@/config/branding';

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
            <MarketingNav />
            <main>
                <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#E11D48]">
                            <CheckCircle2 className="h-4 w-4" />
                            Review-first workflows
                        </p>
                        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Everything in Cashly</h1>
                        <p className="mt-4 max-w-xl leading-relaxed text-[#57534E]">
                            Capture waits in Inbox. Rules make repeats predictable. Analytics, Money Twin, and AI only treat approved spend as real.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg">
                                <Link to="/signup">
                                    Create account
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <a href="/#analyze">How analysis works</a>
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-md)]">
                        <p className="text-xs font-medium text-[#78716C]">Review queue</p>
                        <h2 className="mt-1 font-display text-xl font-semibold">Pending automation</h2>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Foodpanda', 'Food rule matched', 'High confidence'],
                                ['Netflix', 'Subscription alert', 'Price check'],
                                ['CSV import row 42', 'Duplicate warning', 'Needs review'],
                            ].map(([title, meta, status]) => (
                                <div key={title} className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-3.5 py-3">
                                    <div>
                                        <p className="text-sm font-medium">{title}</p>
                                        <p className="text-xs text-[#78716C]">{meta}</p>
                                    </div>
                                    <span className="rounded-full bg-[#FFE4E6] px-2.5 py-1 text-[11px] font-medium text-[#E11D48]">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-y border-[#E7E5E4] bg-[#F4F0EB]">
                    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                        {HOW_IT_WORKS.map((step, index) => (
                            <div key={step.title} className="rounded-2xl border border-[#E7E5E4] bg-white p-4">
                                <p className="text-sm font-medium text-[#E11D48]">{index + 1}</p>
                                <p className="mt-2 text-sm font-medium leading-snug">{step.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-[#78716C]">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {FEATURE_GROUPS.map((group) => (
                    <section key={group.title} className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{group.title}</h2>
                        <p className="mt-2 max-w-2xl text-[#57534E]">{group.description}</p>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {group.features.map((feature) => (
                                <article key={feature.title} className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-sm)]">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-display font-semibold">{feature.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </main>
            <MarketingFooter />
            <p className="sr-only">{BRAND.name}</p>
        </div>
    );
};

export default FeaturesPage;
