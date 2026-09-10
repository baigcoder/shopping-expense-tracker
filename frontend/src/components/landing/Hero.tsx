import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BRAND from '@/config/branding';

export default function Hero() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                    <p className="mb-4 text-sm font-medium text-[#E11D48]">Review-first expense tracking</p>
                    <h1 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight text-[#1C1917] sm:text-5xl lg:text-[3.25rem]">
                        {BRAND.tagline}
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-[#57534E] sm:text-lg">
                        Cashly captures checkouts from your browser, holds them in a quiet inbox, and only posts what you approve.
                        Then budgets, Analytics, Money Twin, and AI all read the same numbers.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button asChild size="lg">
                            <Link to="/signup">
                                Create a free account
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <a href="/#features">See every feature</a>
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-[#78716C]">
                        <a href="/cashly-extension.zip" className="font-medium text-[#E11D48] hover:underline">Download the extension</a>
                        {' '}when you are ready to capture checkouts.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-lg)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#78716C]">Inbox</p>
                            <h2 className="font-display text-lg font-semibold text-[#1C1917]">Waiting for review</h2>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                            <Inbox className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="space-y-3">
                        {[
                            ['Foodpanda', 'Rs 1,240', 'Needs approval'],
                            ['Netflix', '$17.99', 'Subscription'],
                            ['Statement import', '12 rows', 'Duplicates found'],
                        ].map(([merchant, amount, status]) => (
                            <div key={merchant} className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-3.5 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#1C1917]">{merchant}</p>
                                    <p className="text-xs text-[#78716C]">{status}</p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#1C1917]">{amount}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
