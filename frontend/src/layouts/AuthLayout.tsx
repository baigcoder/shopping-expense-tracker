import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Inbox, Check } from 'lucide-react';
import BRAND from '@/config/branding';
import { CashlyMark } from '@/components/brand/CashlyLogo';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="flex min-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)] selection:bg-[var(--color-brand-soft)] selection:text-[var(--color-brand)]">
            {/* Left Column: Editorial Brand Story & Product Preview (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-[var(--color-border)] bg-[#111111] text-white p-12 xl:p-16 relative overflow-hidden">
                <div className="relative z-10">
                    {/* Brand Logo */}
                    <Link to="/" className="inline-flex items-center gap-3">
                        <CashlyMark size={38} variant="orange" />
                        <div className="flex flex-col">
                            <span className="font-display text-xl font-bold tracking-tight text-white">{BRAND.name}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Financial OS</span>
                        </div>
                    </Link>

                    {/* Editorial Value Pitch */}
                    <div className="mt-14 max-w-md">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[var(--color-orange)] tracking-wider uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Sovereign Financial Operating System</span>
                        </div>

                        <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-white xl:text-4xl uppercase leading-[0.96]">
                            KNOW WHAT HAPPENED.<br />
                            <span className="text-[var(--color-orange)]">KNOW WHAT COMES NEXT.</span>
                        </h2>

                        <p className="mt-5 text-sm leading-relaxed text-neutral-300">
                            Cashly captures online purchases silently from your browser, stages them in a private review queue, and turns approved numbers into predictive cashflow forecasts.
                        </p>
                    </div>

                    {/* Simulated Live Product Card */}
                    <div className="mt-8 max-w-md rounded-2xl bg-[#1E1E1E] border border-white/10 p-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-orange)] uppercase tracking-wider">
                                <Inbox className="h-4 w-4" />
                                <span>Needs Review Queue</span>
                            </div>
                            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                                Live Intercept
                            </span>
                        </div>

                        <div className="mt-3.5 flex items-center justify-between">
                            <div>
                                <p className="font-display text-sm font-bold text-white">Foodpanda Delivery</p>
                                <p className="text-[11px] text-neutral-400">Captured in Browser • Dining Category</p>
                            </div>
                            <span className="font-display text-base font-bold text-white tabular-nums">
                                Rs 1,240
                            </span>
                        </div>

                        <div className="mt-3.5 flex items-center gap-2 border-t border-white/10 pt-2.5 text-[11px] text-neutral-400">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Zero bank passwords needed. Nothing posts without consent.</span>
                        </div>
                    </div>
                </div>

                {/* Left Bottom Security & Architecture Note */}
                <div className="relative z-10 flex items-center gap-3 text-xs text-neutral-400">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                    <p className="leading-relaxed">
                        Protected by Supabase Row-Level Security. Offline browser sandbox with isolated staging queue.
                    </p>
                </div>
            </div>

            {/* Right Column: Focused Authentication Surface */}
            <div className="flex w-full lg:w-1/2 flex-col justify-between p-6 sm:p-10 xl:p-14">
                {/* Mobile Brand Bar */}
                <div className="flex items-center justify-between lg:hidden pb-6 border-b border-[var(--color-border)]">
                    <Link to="/" className="flex items-center gap-2.5">
                        <CashlyMark size={32} variant="orange" />
                        <span className="font-display text-base font-bold text-[var(--color-ink)]">{BRAND.name}</span>
                    </Link>
                    <Link to="/" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                        ← Back to site
                    </Link>
                </div>

                <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                            {title}
                        </h1>
                        <p className="mt-1.5 text-sm text-[var(--color-secondary-ink)]">
                            {subtitle}
                        </p>
                    </div>

                    {/* Main Form Slot */}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                        {children}
                    </div>

                    {/* Footer Legal Links */}
                    <p className="mt-6 text-center text-xs leading-relaxed text-[var(--color-muted)]">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="font-medium text-[var(--color-ink)] underline hover:text-[var(--color-brand)]">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="font-medium text-[var(--color-ink)] underline hover:text-[var(--color-brand)]">
                            Privacy Policy
                        </Link>.
                    </p>
                </div>

                {/* Sub-footer note */}
                <div className="text-center text-[11px] text-[#A8A29E] pt-4">
                    <span>Calm Finance Authentication • Enterprise 256-bit TLS</span>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
