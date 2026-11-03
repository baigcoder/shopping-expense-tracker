import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CashlyMark } from '@/components/brand/CashlyLogo';
import { LiveCheckoutCard } from '@/features/landing/LiveCheckoutCard';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

/** Form on the ivory side; on desktop the other half shows the product doing its one job. */
const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => (
    <div className="grid min-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)] lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col px-5 py-6 sm:px-10">
            <Link to="/" className="flex w-fit items-center gap-2.5">
                <CashlyMark size={28} variant="orange" />
                <span className="font-display text-[18px] font-bold tracking-tight">Cashly</span>
            </Link>

            <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
                <h1 className="font-display text-[length:clamp(34px,3vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
                <p className="mt-3 text-[17px] leading-relaxed text-[var(--color-ink-secondary)]">{subtitle}</p>
                <div className="mt-8">{children}</div>
            </main>

            <p className="text-[13px] text-[var(--color-muted)]">
                By continuing you agree to the <Link to="/terms" className="underline underline-offset-2 hover:text-[var(--color-ink)]">Terms</Link> and the{' '}
                <Link to="/privacy" className="underline underline-offset-2 hover:text-[var(--color-ink)]">Privacy policy</Link>.
            </p>
        </div>

        <aside className="hidden flex-col justify-between bg-[var(--color-ink)] p-12 text-white lg:flex" aria-label="What Cashly does">
            <p className="max-w-[24ch] font-display text-[28px] font-semibold leading-tight tracking-tight">
                Every purchase waits for your yes before it counts.
            </p>
            <div className="flex justify-center">
                <LiveCheckoutCard />
            </div>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-white/75">
                Try it: change the category or press Approve. Your real inbox works the same way, with your own purchases.
            </p>
        </aside>
    </div>
);

export default AuthLayout;
