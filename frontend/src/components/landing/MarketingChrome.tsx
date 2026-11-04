import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { CashlyMark } from '../brand/CashlyLogo';

const links = [
    { href: '/#how', label: 'How it works' },
    { href: '/#what', label: 'What you get' },
    { href: '/#faq', label: 'Questions' },
];

const btnPrimary = 'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]';

export function MarketingNav({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
    const [open, setOpen] = useState(false);
    const dark = tone === 'dark';
    const ink = dark ? 'text-white' : 'text-[var(--color-ink)]';
    return (
        <header className={`relative z-30 ${dark ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-canvas)]'}`}>
            <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
                <Link to="/" className={`flex items-center gap-2.5 ${ink}`}>
                    <CashlyMark size={28} variant="orange" />
                    <span className="font-display text-[18px] font-bold tracking-tight">Cashly</span>
                </Link>
                <nav aria-label="Site" className="hidden items-center gap-8 md:flex">
                    {links.map((l) => (
                        <a key={l.href} href={l.href} className={`text-[15px] ${dark ? 'text-white/80 hover:text-white' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'} transition-colors`}>{l.label}</a>
                    ))}
                </nav>
                <div className="hidden items-center gap-5 md:flex">
                    <Link to="/login" className={`text-[15px] font-medium ${ink} hover:underline underline-offset-4`}>Sign in</Link>
                    <Link to="/demo" className={btnPrimary}>Try the demo</Link>
                </div>
                <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className={`-mr-2 rounded-full p-2 md:hidden ${ink}`}>
                    <Menu size={22} />
                </button>
            </div>
            {open && (
                <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-canvas)] px-5 pb-8 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
                    <div className="flex h-[72px] items-center justify-between">
                        <span className="flex items-center gap-2.5"><CashlyMark size={28} variant="orange" /><span className="font-display text-[18px] font-bold">Cashly</span></span>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-2 rounded-full p-2"><X size={22} /></button>
                    </div>
                    <nav aria-label="Site" className="mt-6 flex flex-col">
                        {links.map((l) => (
                            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 font-display text-[28px] font-semibold tracking-tight">{l.label}</a>
                        ))}
                        <Link to="/login" className="py-3 font-display text-[28px] font-semibold tracking-tight">Sign in</Link>
                    </nav>
                    <Link to="/demo" className={`${btnPrimary} mt-auto h-12 text-[16px]`}>Try the demo</Link>
                </div>
            )}
        </header>
    );
}

export function MarketingFooter() {
    return (
        <footer className="bg-[var(--color-canvas)] p-2 sm:p-3" aria-label="Footer">
            <div className="grid gap-2 sm:grid-cols-12">
                <div className="flex min-h-[200px] flex-col justify-between rounded-[20px] bg-[var(--color-surface)] p-6 sm:col-span-5">
                    <p className="max-w-[30ch] font-display text-[22px] font-semibold leading-snug tracking-tight">Every purchase waits for your yes before it counts.</p>
                    <p className="text-[13px] text-[var(--color-muted)]">© {new Date().getFullYear()} Cashly. Works in PKR and your own currency.</p>
                </div>
                <nav aria-label="Footer" className="rounded-[20px] bg-[var(--color-surface)] p-6 sm:col-span-4">
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[16px]">
                        {[['/demo', 'Demo'], ['/features', 'Features'], ['/faq', 'Questions'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms'], ['/login', 'Sign in'], ['/signup', 'Create account']].map(([to, label]) => (
                            <li key={to}><Link to={to} className="hover:underline underline-offset-4">{label}</Link></li>
                        ))}
                    </ul>
                </nav>
                <a href="/cashly-extension.zip" className="group flex min-h-[200px] flex-col justify-between rounded-[20px] bg-[var(--color-sage)] p-6 text-[var(--color-ink)] sm:col-span-3">
                    <span className="font-display text-[22px] font-semibold leading-snug tracking-tight">Get the browser extension</span>
                    <span className="flex items-end justify-between text-[14px]">Chrome and Firefox <ArrowUpRight size={28} strokeWidth={2.5} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></span>
                </a>
                <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-[20px] bg-[var(--color-ink)] sm:col-span-8 sm:min-h-[300px]">
                    <span className="select-none font-display text-[22vw] font-bold leading-none tracking-[-0.05em] text-[var(--color-canvas)] sm:text-[12vw]" aria-hidden>Cashly</span>
                </div>
                <Link to="/signup" className="group flex min-h-[220px] flex-col justify-between rounded-[20px] bg-[var(--color-brand)] p-6 text-[var(--color-on-brand)] sm:col-span-4 sm:min-h-[300px]">
                    <span className="font-display text-[28px] font-semibold leading-tight tracking-tight">Start with your own money</span>
                    <ArrowUpRight size={44} strokeWidth={2.5} className="self-end transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </Link>
            </div>
        </footer>
    );
}
