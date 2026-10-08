import { Chrome, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { CashlyMark } from '@/components/brand/CashlyLogo';

const supportedStores = [
    { name: 'Amazon', category: 'Global Marketplace', icon: '📦' },
    { name: 'Shopify Stores', category: 'E-commerce & Independent Brands', icon: '🛍️' },
    { name: 'Foodpanda', category: 'Food & Quick Commerce', icon: '🐼' },
    { name: 'Daraz', category: 'Regional Marketplace', icon: '🛒' },
    { name: 'eBay', category: 'Auctions & Collectibles', icon: '🏷️' },
];

export default function ExtensionShowcase() {
    return (
        <section id="extension" className="landing-extension-showcase scroll-mt-20">
            <div className="landing-extension-showcase__header">
                <div className="landing-extension-showcase__tag">
                    <Chrome size={14} />
                    <span>BROWSER COMPANION</span>
                </div>

                <h2 className="landing-extension-showcase__title">
                    SHOP WITHOUT<br />
                    LOSING TRACK.
                </h2>

                <p className="landing-extension-showcase__sub">
                    No manual receipt copying. No waiting for 3-day bank statements.
                    The companion captures checkouts right at the point of confirmation.
                </p>
            </div>

            {/* Split Editorial Composition */}
            <div className="landing-extension-showcase__grid">

                {/* Left: Statement & Mechanics */}
                <div className="landing-extension-showcase__info-pane">
                    <div className="ext-stat-chip">100% PRIVATE & LOCAL</div>

                    <h3 className="ext-info-headline">
                        Checkouts stage silently.<br />
                        Your bank credentials<br />
                        stay unshared.
                    </h3>

                    <p className="ext-info-desc">
                        Conventional finance tools demand your online banking usernames and passwords,
                        scraping transaction data through third-party data brokers. Cashly works locally in your
                        browser, capturing order totals directly from verified confirmation pages.
                    </p>

                    <div className="ext-features-list">
                        <div className="ext-feat-item">
                            <span className="ext-feat-icon">✓</span>
                            <div>
                                <strong>Silent Background Interception:</strong>
                                <p>Captures only when you reach the order confirmation screen.</p>
                            </div>
                        </div>

                        <div className="ext-feat-item">
                            <span className="ext-feat-icon">✓</span>
                            <div>
                                <strong>Zero-Password Architecture:</strong>
                                <p>Never requires bank login, 2FA codes, or credentials.</p>
                            </div>
                        </div>

                        <div className="ext-feat-item">
                            <span className="ext-feat-icon">✓</span>
                            <div>
                                <strong>Direct Review Staging:</strong>
                                <p>Held in private inbox until you choose to post to your ledger.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: High-Fidelity Browser + Companion HUD Scene */}
                <div className="landing-extension-showcase__scene-pane">
                    <div className="browser-hud-frame">
                        {/* Browser Bar */}
                        <div className="browser-hud-bar">
                            <div className="browser-hud-dots">
                                <span className="b-dot b-dot--red" />
                                <span className="b-dot b-dot--yellow" />
                                <span className="b-dot b-dot--green" />
                            </div>
                            <div className="browser-hud-url">
                                <span>checkout.amazon.com/order-confirmation</span>
                            </div>
                            <span className="browser-hud-secure">🔒 TLS 1.3</span>
                        </div>

                        {/* Store Page Mockup */}
                        <div className="browser-hud-body">
                            <div className="store-checkout-preview">
                                <span className="order-confirmed-badge">✓ Order Placed with Amazon</span>
                                <div className="order-product-meta">
                                    <div className="order-item-title">Sony WH-1000XM5 Wireless Noise-Canceling Headphones</div>
                                    <div className="order-item-desc">Color: Silver · Sold by Amazon Official Store</div>
                                </div>
                                <div className="order-total-price">Rs 34,990</div>
                            </div>

                            {/* Floating Cashly Extension Companion HUD Overlay */}
                            <div className="companion-hud-overlay landing-animate-in">
                                <div className="hud-overlay-head">
                                    <div className="hud-brand">
                                        <CashlyMark size={20} variant="orange" />
                                        <strong>Cashly Companion</strong>
                                    </div>
                                    <span className="hud-badge-detected">● CHECKOUT CAPTURED</span>
                                </div>

                                <div className="hud-overlay-body">
                                    <div className="hud-price-row">
                                        <div>
                                            <span className="hud-lbl">Detected Checkout</span>
                                            <div className="hud-val">Rs 34,990</div>
                                        </div>
                                        <span className="hud-cat-tag">Electronics</span>
                                    </div>

                                    <div className="hud-runway-alert">
                                        <span>Estimated Runway Impact: </span>
                                        <strong>-3.8 days</strong>
                                    </div>

                                    <div className="hud-action-row">
                                        <span className="hud-status-note">Staged in Review Queue</span>
                                        <a href="/demo?ext=open" className="hud-action-btn">
                                            <span>Inspect in Live Demo OS</span>
                                            <ArrowRight size={12} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Direct Demo Trigger Bar below Mockup */}
                        <div className="mt-4 p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">Try Pre-Swipe Interceptor:</span>
                                <span className="text-neutral-500 hidden sm:inline">Simulate checkout on Amazon, Gymshark, or Foodpanda</span>
                            </div>
                            <a
                                href="/demo?ext=open"
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#EE5024] text-white text-xs font-mono font-bold hover:bg-[#d84318] transition-colors shadow-sm"
                            >
                                <span>⚡ Launch Extension Simulator</span>
                                <ArrowRight size={12} />
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* Supported Stores Ribbon */}
            <div className="landing-extension-showcase__stores-ribbon">
                <span className="stores-ribbon-label">OFFICIALLY SUPPORTED PLATFORMS:</span>
                <div className="stores-ribbon-list">
                    {supportedStores.map((store) => (
                        <div key={store.name} className="store-chip">
                            <span className="store-chip-icon">{store.icon}</span>
                            <div>
                                <strong className="store-chip-name">{store.name}</strong>
                                <span className="store-chip-cat">{store.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
