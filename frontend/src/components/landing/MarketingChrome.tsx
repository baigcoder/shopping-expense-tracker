import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, Volume2, VolumeX, Globe } from 'lucide-react';
import BRAND from '@/config/branding';
import { CashlyMark } from '@/components/brand/CashlyLogo';
import { useLandingSettings, LandingCurrency } from './useLandingSettings';

const desktopNavLinks = [
    { href: '/#triptych', label: 'Ecosystem' },
    { href: '/#desktop-showcase', label: 'Desktop' },
    { href: '/#money-twin', label: 'Money Twin' },
    { href: '/#compare', label: 'Compare' },
    { href: '/#trust', label: 'Security' },
];

const allNavLinks = [
    { href: '/#triptych', label: 'Ecosystem' },
    { href: '/#lifecycle', label: 'How It Works' },
    { href: '/#desktop-showcase', label: 'Desktop Console' },
    { href: '/#pillars', label: 'The 5 Pillars' },
    { href: '/#money-twin', label: 'Money Twin™ Forecast' },
    { href: '/#extension', label: 'Companion Extension' },
    { href: '/#compare', label: 'Feature Comparison' },
    { href: '/#trust', label: 'Security Architecture' },
];

const CURRENCIES: { code: LandingCurrency; symbol: string; label: string }[] = [
    { code: 'PKR', symbol: 'Rs', label: 'PKR' },
    { code: 'USD', symbol: '$', label: 'USD' },
    { code: 'EUR', symbol: '€', label: 'EUR' },
    { code: 'GBP', symbol: '£', label: 'GBP' },
    { code: 'INR', symbol: '₹', label: 'INR' },
];

/**
 * Marketing Navigation — Editorial Minimal
 * Reference: clean, minimal nav with pill CTA, no border initially
 */
export function MarketingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { currency, setCurrency, acoustic, setAcoustic, playSound } = useLandingSettings();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => { setOpen(false); }, [location]);

    return (
        <>
            <header className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <Link to="/" className="landing-nav__brand">
                    <CashlyMark size={38} variant="orange" />
                    <span className="landing-nav__name">{BRAND.name}</span>
                </Link>

                <nav className="landing-nav__links">
                    {desktopNavLinks.map((item) => (
                        <a key={item.href} href={item.href} className="landing-nav__link">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="landing-nav__actions">
                    {/* Currency Switcher */}
                    <div className="hidden lg:flex items-center rounded-full bg-[var(--landing-surface-2,rgba(0,0,0,0.04))] p-0.5 border border-[var(--landing-border,#e5e5e5)] text-[11px] font-mono font-bold shrink-0">
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => setCurrency(c.code)}
                                className={`px-2 py-0.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ${
                                    currency === c.code
                                        ? 'bg-[var(--landing-ink,#111)] text-white shadow-xs'
                                        : 'text-[var(--landing-ink-secondary,#666)] hover:text-[var(--landing-ink,#111)]'
                                }`}
                            >
                                <span className="opacity-75">{c.symbol}</span>
                                <span>{c.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Acoustic Sound Feedback Toggle */}
                    <button
                        type="button"
                        onClick={() => setAcoustic(!acoustic)}
                        title={acoustic ? 'Acoustic Sound Mode: Active' : 'Sound Muted'}
                        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border border-[var(--landing-border,#e5e5e5)] hover:bg-[var(--landing-surface-2,rgba(0,0,0,0.04))] transition-colors text-[var(--landing-ink-secondary,#666)] shrink-0"
                    >
                        {acoustic ? (
                            <>
                                <Volume2 size={13} className="text-emerald-600" />
                                <span className="text-[10px]">Audio</span>
                            </>
                        ) : (
                            <>
                                <VolumeX size={13} className="opacity-50" />
                                <span className="text-[10px] opacity-60">Mute</span>
                            </>
                        )}
                    </button>

                    {/* Live Demo Trigger */}
                    <Link
                        to="/demo"
                        className="landing-nav__demo-btn"
                        title="Experience the full interactive Cashly OS Sandbox without signing up"
                    >
                        <span className="landing-nav__demo-pulse" />
                        <span>⚡ Live Demo</span>
                    </Link>

                    <Link to="/login" className="landing-nav__sign-in">Sign in</Link>
                    <Link to="/signup" className="landing-nav__cta">
                        Get started
                        <ArrowRight size={14} />
                    </Link>
                </div>

                <button
                    className="landing-nav__mobile-toggle"
                    onClick={() => setOpen(v => !v)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Mobile Menu Drawer */}
            <div className={`landing-mobile-menu ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
                <div className="landing-mobile-menu__panel" onClick={(e) => e.stopPropagation()}>
                    <button className="landing-mobile-menu__close" onClick={() => setOpen(false)}>
                        <X size={18} />
                    </button>

                    {/* Mobile Currency & Audio Row */}
                    <div className="mb-4 pb-4 border-b border-[var(--landing-border)] flex flex-col gap-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--landing-ink-secondary)]">Currency</div>
                        <div className="flex flex-wrap gap-1.5">
                            {CURRENCIES.map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => setCurrency(c.code)}
                                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                                        currency === c.code
                                            ? 'bg-[var(--landing-ink,#111)] text-white shadow-xs'
                                            : 'bg-white border border-[var(--landing-border)] text-[var(--landing-ink-secondary,#666)]'
                                    }`}
                                >
                                    <span>{c.symbol}</span>
                                    <span>{c.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-medium text-[var(--landing-ink-secondary)]">Sound Effects</span>
                            <button
                                type="button"
                                onClick={() => setAcoustic(!acoustic)}
                                className="px-3 py-1 rounded-full text-xs font-mono font-semibold border border-[var(--landing-border)] bg-white flex items-center gap-1.5"
                            >
                                {acoustic ? (
                                    <>
                                        <Volume2 size={13} className="text-emerald-600" />
                                        <span>Audio On</span>
                                    </>
                                ) : (
                                    <>
                                        <VolumeX size={13} className="opacity-50" />
                                        <span>Muted</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {allNavLinks.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="landing-mobile-menu__link"
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                            <ArrowRight size={16} style={{ opacity: 0.4 }} />
                        </a>
                    ))}

                    <div className="landing-mobile-menu__actions">
                        <Link
                            to="/demo"
                            onClick={() => setOpen(false)}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '100px',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '14px',
                                textDecoration: 'none',
                                color: 'white',
                                background: 'var(--landing-orange)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>Launch Live Demo OS</span>
                            <ArrowRight size={14} />
                        </Link>
                        <Link
                            to="/login"
                            onClick={() => setOpen(false)}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '100px',
                                border: '1px solid var(--landing-border)',
                                textAlign: 'center',
                                fontWeight: 600,
                                fontSize: '14px',
                                textDecoration: 'none',
                                color: 'var(--landing-ink)',
                                background: 'white'
                            }}
                        >
                            Sign in
                        </Link>
                        <Link
                            to="/signup"
                            onClick={() => setOpen(false)}
                            style={{
                                padding: '14px 24px',
                                borderRadius: '100px',
                                textAlign: 'center',
                                fontWeight: 600,
                                fontSize: '14px',
                                textDecoration: 'none',
                                color: 'white',
                                background: 'var(--landing-orange)'
                            }}
                        >
                            Create free account
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Marketing Footer — Editorial Minimal
 * Reference: clean footer with column layout, matching the cream background
 */
export function MarketingFooter() {
    return (
        <footer className="landing-footer">
            <div className="landing-footer__grid">
                <div className="landing-footer__brand">
                    <Link to="/" className="landing-footer__brand-name">
                        <CashlyMark size={34} variant="orange" />
                        <span className="landing-footer__brand-text">{BRAND.name}</span>
                    </Link>
                    <p className="landing-footer__brand-desc">
                        The personal finance operating system that captures, reviews, and predicts your financial activity with complete transparency.
                    </p>
                    <div style={{
                        marginTop: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--landing-ink-secondary)'
                    }}>
                        <ShieldCheck size={14} color="#059669" />
                        <span>Zero bank passwords stored</span>
                    </div>
                </div>

                <div>
                    <p className="landing-footer__col-title">Product</p>
                    <div className="landing-footer__col-links">
                        <a href="/#how-it-works" className="landing-footer__col-link">How it works</a>
                        <a href="/#pillars" className="landing-footer__col-link">Product Demo</a>
                        <a href="/#why-cashly" className="landing-footer__col-link">Features</a>
                        <a href="/#money-twin" className="landing-footer__col-link">Money Twin</a>
                        <Link to="/features" className="landing-footer__col-link">Full Catalog</Link>
                    </div>
                </div>

                <div>
                    <p className="landing-footer__col-title">Resources</p>
                    <div className="landing-footer__col-links">
                        <a href="/#assist" className="landing-footer__col-link">Browser Extension</a>
                        <a href="/#assist" className="landing-footer__col-link">AI Co-Pilot</a>
                        <Link to="/faq" className="landing-footer__col-link">FAQ</Link>
                        <Link to="/contact" className="landing-footer__col-link">Contact</Link>
                    </div>
                </div>

                <div>
                    <p className="landing-footer__col-title">Legal</p>
                    <div className="landing-footer__col-links">
                        <Link to="/privacy" className="landing-footer__col-link">Privacy Policy</Link>
                        <Link to="/terms" className="landing-footer__col-link">Terms of Service</Link>
                        <Link to="/contact" className="landing-footer__col-link">Support</Link>
                    </div>
                </div>
            </div>

            <div className="landing-footer__bottom">
                <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
                <p style={{ fontFamily: 'monospace', fontSize: '11px' }}>Financial OS v3.0</p>
            </div>
        </footer>
    );
}
