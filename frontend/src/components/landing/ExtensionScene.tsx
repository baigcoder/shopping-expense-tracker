import { Chrome, Download, Inbox, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPPORTED_PLATFORMS = [
    'Amazon', 'Foodpanda', 'Shopify', 'Daraz', 'eBay', 'AliExpress', 'Uber Eats', 'Walmart', 'Target', 'Best Buy'
];

export default function ExtensionScene() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#141210] p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
            {/* Ambient subtle rose depth lighting */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#E11D48]/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-[#E11D48]/10 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-12 items-center">
                {/* Left: Editorial Narrative & Action */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#FDA4AF] backdrop-blur-sm">
                        <Chrome className="h-3.5 w-3.5 text-[#FDA4AF]" />
                        <span>The Browser Companion</span>
                    </div>

                    <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        Cashly works silently while you shop.
                    </h2>

                    <p className="text-base sm:text-lg leading-relaxed text-[#D6D3D1]">
                        Instead of fragile screen scrapers that break or demand your online banking credentials,
                        Cashly’s companion captures checkouts, trials, and invoices right from your active browser session as they happen.
                    </p>

                    {/* Supported Platforms Ribbon */}
                    <div className="pt-2">
                        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8A29E] mb-3">
                            Supported Checkout Engines:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SUPPORTED_PLATFORMS.map((platform) => (
                                <span
                                    key={platform}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#D6D3D1] backdrop-blur-sm"
                                >
                                    {platform}
                                </span>
                            ))}
                            <span className="rounded-full border border-[#FDA4AF]/30 bg-[#E11D48]/20 px-3 py-1 text-xs font-semibold text-[#FDA4AF]">
                                + 20 more
                            </span>
                        </div>
                    </div>

                    {/* Action Group */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-lg shadow-[#E11D48]/20"
                        >
                            <a href="/cashly-extension.zip" download>
                                <Download className="mr-2 h-4 w-4" />
                                Download Extension (.zip)
                            </a>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                        >
                            <a href="#how-it-works">See how staging works</a>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#A8A29E] pt-2">
                        <ShieldCheck className="h-4 w-4 text-[#059669]" />
                        <span>Zero banking passwords shared • Runs locally in Chromium</span>
                    </div>
                </div>

                {/* Right: Layered Physical Browser Scene */}
                <div className="relative">
                    {/* Layer 1: Simulated Browser Window */}
                    <div className="rounded-2xl border border-white/15 bg-[#1C1917] p-5 shadow-2xl backdrop-blur-md">
                        {/* Browser Top Bar */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-[#A8A29E]">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]/80" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]/80" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#059669]/80" />
                                <span className="ml-2 font-mono text-[11px] text-[#A8A29E]">
                                    amazon.com/checkout/order-summary
                                </span>
                            </div>
                            <span className="font-mono text-[10px] text-[#059669] bg-[#059669]/20 px-2 py-0.5 rounded">
                                HTTPS SECURE
                            </span>
                        </div>

                        {/* Underlying Checkout Webpage Content */}
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-display text-sm font-bold text-white">
                                        Keychron K2 Mechanical Keyboard
                                    </p>
                                    <p className="text-xs text-[#A8A29E]">Wireless RGB • Space Gray (Brown Switch)</p>
                                    <p className="text-[10px] text-[#78716C] mt-0.5">Ships to: Office Address • Delivery by 2 PM</p>
                                </div>
                                <span className="font-mono text-base font-bold text-white tabular-nums">
                                    $79.99
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-[#A8A29E]">
                                <span>Estimated Sales Tax & Shipping</span>
                                <span className="font-mono text-white">$7.43</span>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                                <span>Order Grand Total</span>
                                <span className="font-mono text-[#FDA4AF]">$87.42</span>
                            </div>
                        </div>

                        {/* Layer 2: Docked Cashly Companion Popover */}
                        <div className="mt-4 rounded-xl border border-[#FDA4AF] bg-gradient-to-b from-[#1C1917] to-[#25211E] p-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E11D48] text-[11px] font-bold text-white">
                                        C
                                    </div>
                                    <span className="text-xs font-bold text-white">Cashly Detected Checkout</span>
                                </div>
                                <span className="rounded bg-[#059669] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                    Captured
                                </span>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-[#D6D3D1]">Staged to Review Inbox:</span>
                                <span className="font-mono font-bold text-[#FDA4AF] tabular-nums">$87.42</span>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-[11px] text-[#A8A29E]">
                                <div className="flex items-center gap-1.5 text-white">
                                    <Inbox className="h-3.5 w-3.5 text-[#FDA4AF]" />
                                    <span>Awaiting your decision in Cashly</span>
                                </div>
                                <span className="font-semibold text-[#059669]">Unposted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
