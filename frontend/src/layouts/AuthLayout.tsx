import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BRAND from '@/config/branding';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="flex min-h-dvh flex-col bg-[#FAF8F5] text-[#1C1917]">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
                <Link to="/" className="mb-8 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E11D48] font-display text-base font-semibold text-white">
                        C
                    </span>
                    <span className="font-display text-lg font-semibold tracking-tight">{BRAND.name}</span>
                </Link>

                <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <p className="text-sm text-[#78716C]">{BRAND.tagline}</p>
                    <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#57534E]">{subtitle}</p>
                    <div className="mt-6">{children}</div>
                </div>

                <p className="mt-6 text-center text-xs leading-relaxed text-[#78716C]">
                    By continuing, you agree to our{' '}
                    <Link to="/terms" className="text-[#E11D48] hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-[#E11D48] hover:underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
};

export default AuthLayout;
