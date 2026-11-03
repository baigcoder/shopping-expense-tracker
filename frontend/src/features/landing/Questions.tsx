import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CORE_FAQS: [string, string][] = [
    ['Does Cashly need my bank password?', 'No. The browser extension reads the order total on the checkout page you are already on. Cashly never connects to your bank login.'],
    ['Which stores does it work with?', 'Any store you buy from in Chrome, Edge, Brave or Firefox: Daraz, Foodpanda, Amazon, app stores, airline sites. If a page shows an order total, Cashly can catch it. Safari is not supported yet.'],
    ['What happens if I do not approve a purchase?', 'Nothing. It stays in your inbox and does not touch your balance, budgets or forecasts. Not mine removes it for good.'],
    ['How is safe to spend worked out?', 'Your approved balance, minus bills and subscriptions due in the next 30 days, minus what you set aside for your goals.'],
    ['Can I add cash or shop purchases?', 'Yes. Add them by hand and they follow the same path as everything the extension catches.'],
    ['Does the AI see my real numbers?', 'It reads only approved transactions, and it tells you when something is still waiting in your inbox. It does not guess figures it does not have.'],
    ['Where is my data kept?', 'In your own Cashly account, protected so that only you can read your rows. Card numbers are never stored, only the last four digits. The demo keeps nothing at all.'],
];

export const MORE_FAQS: [string, string][] = [
    ['How accurate are the categories?', 'Common merchants are usually right. Change a category any time and save a merchant rule so the next purchase from that shop lands in the right place.'],
    ['Can I export my data?', 'Yes. Reports can be downloaded whenever you want.'],
    ['Does Cashly work on phones?', 'The website works in mobile browsers. There is no separate iPhone or Android app yet.'],
    ['How do I delete my account?', 'From Settings. Deleting removes your data for good.'],
];

/** Filled-tile accordion: one open at a time, the open tile turns orange. */
export function Questions({ id = 'faq', heading = 'Fair questions', items = CORE_FAQS, headingAs: H = 'h2', className }: {
    id?: string; heading?: string; items?: [string, string][]; headingAs?: 'h1' | 'h2'; className?: string;
}) {
    return (
        <section id={id} className={cn('scroll-mt-20 py-[clamp(72px,9vw,136px)]', className)} aria-labelledby={`${id}-h`} data-reveal-group>
            <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-5 sm:px-8 lg:grid-cols-12">
                <H id={`${id}-h`} className="font-display text-[length:clamp(32px,4vw,56px)] font-bold leading-[1.02] tracking-[-0.03em] lg:sticky lg:top-24 lg:col-span-4 lg:self-start" data-reveal>{heading}</H>
                <div className="flex flex-col gap-2 lg:col-span-8" data-reveal>
                    {items.map(([q, a], i) => (
                        <details key={q} name={id} open={i === 0} className="group rounded-[16px] bg-[var(--color-canvas)] open:bg-[var(--color-brand)]">
                            <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[18px] font-medium [&::-webkit-details-marker]:hidden">
                                {q}
                                <Plus size={22} strokeWidth={2.5} className="shrink-0 transition-transform group-open:rotate-45" aria-hidden />
                            </summary>
                            <p className="max-w-[56ch] px-6 pb-6 text-[17px] leading-relaxed">{a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
