import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import BRAND from '@/config/branding';

const navLinks = [
    { href: '/#triptych', label: 'Ecosystem' },
    { href: '/#lifecycle', label: 'How It Works' },
    { href: '/#desktop-showcase', label: 'Desktop' },
    { href: '/#mobile-showcase', label: 'Mobile' },
    { href: '/#pillars', label: 'Pillars' },
    { href: '/#money-twin', label: 'Money Twin' },
    { href: '/#extension', label: 'Companion' },
    { href: '/#trust', label: 'Security' },
];

/**
 * Marketing Navigation — Editorial Minimal
 * Reference: clean, minimal nav with pill CTA, no border initially
 */
export function MarketingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

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
                    <div className="landing-nav__logo">C</div>
                    <span className="landing-nav__name">{BRAND.name}</span>
                </Link>

                <nav className="landing-nav__links">
                    {navLinks.map((item) => (
                        <a key={item.href} href={item.href} className="landing-nav__link">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="landing-nav__actions">
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

                    {navLinks.map((item) => (
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
                        <div className="landing-footer__brand-logo">C</div>
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
