import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BRAND from '@/config/branding';
import { Button } from '@/components/ui/button';

const links = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#features', label: 'Features' },
    { href: '/#analyze', label: 'Analyze' },
    { href: '/#extension', label: 'Extension' },
];

export function MarketingNav() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-[#E7E5E4] bg-[#FAF8F5]/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link to="/" className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E11D48] font-display text-base font-semibold text-white">
                        C
                    </span>
                    <span className="font-display text-lg font-semibold tracking-tight text-[#1C1917]">{BRAND.name}</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {links.map((item) => (
                        <a key={item.href} href={item.href} className="text-sm text-[#57534E] transition-colors hover:text-[#1C1917]">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    <Button asChild variant="ghost">
                        <Link to="/login">Sign in</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/signup">Get started</Link>
                    </Button>
                </div>

                <button
                    type="button"
                    className="rounded-[var(--r-md)] p-2 text-[#1C1917] md:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {open && (
                <div className="border-t border-[#E7E5E4] bg-[#FAF8F5] px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-3">
                        {links.map((item) => (
                            <a key={item.href} href={item.href} className="py-1 text-sm text-[#57534E]" onClick={() => setOpen(false)}>
                                {item.label}
                            </a>
                        ))}
                        <Link to="/login" className="py-1 text-sm font-medium text-[#1C1917]" onClick={() => setOpen(false)}>
                            Sign in
                        </Link>
                        <Button asChild className="mt-1">
                            <Link to="/signup" onClick={() => setOpen(false)}>Get started</Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}

export function MarketingFooter() {
    return (
        <footer className="border-t border-[#E7E5E4] bg-[#F4F0EB]">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <p className="font-display font-semibold text-[#1C1917]">{BRAND.name}</p>
                    <p className="mt-1 text-sm text-[#78716C]">{BRAND.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#57534E]">
                    <Link to="/features" className="hover:text-[#1C1917]">Features</Link>
                    <a href="/#analyze" className="hover:text-[#1C1917]">Analyze</a>
                    <Link to="/faq" className="hover:text-[#1C1917]">FAQ</Link>
                    <Link to="/privacy" className="hover:text-[#1C1917]">Privacy</Link>
                    <Link to="/terms" className="hover:text-[#1C1917]">Terms</Link>
                    <Link to="/contact" className="hover:text-[#1C1917]">Contact</Link>
                </div>
            </div>
        </footer>
    );
}
