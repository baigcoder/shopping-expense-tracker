import { useEffect, useRef, useState } from 'react';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { useReveal } from '@/lib/reveal';
import { cn } from '@/lib/utils';

interface StaticPageTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    /** Long-form text (legal pages) gets the reading column; other pages lay out their own body. */
    prose?: boolean;
}

const StaticPageTemplate = ({ title, subtitle, children, className, prose = true }: StaticPageTemplateProps) => {
    useReveal();
    useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
    const articleRef = useRef<HTMLElement>(null);
    const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
    useEffect(() => {
        const heads = [...(articleRef.current?.querySelectorAll('h2') || [])];
        heads.forEach((h, i) => { if (!h.id) h.id = `s-${i}`; });
        setToc(heads.map((h) => ({ id: h.id, text: h.textContent || '' })));
    }, [children]);
    return (
        <div className={cn('min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]', className)}>
            <MarketingNav />
            <main className="mx-auto w-full max-w-[1320px] px-5 pb-[clamp(72px,9vw,136px)] pt-[clamp(48px,7vw,96px)] sm:px-8">
                <header className="grid gap-6 lg:grid-cols-12" data-reveal-group>
                    <h1 className="font-display text-[length:clamp(36px,5vw,72px)] font-bold leading-[1.02] tracking-[-0.035em] lg:col-span-7" data-reveal>{title}</h1>
                    {subtitle && <p className="max-w-[46ch] self-end text-[18px] leading-relaxed text-[var(--color-ink-secondary)] lg:col-span-5" data-reveal>{subtitle}</p>}
                </header>
                {prose ? (
                    <div className="mt-[clamp(48px,6vw,88px)] grid gap-10 lg:grid-cols-12">
                    <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
                        <p className="font-display text-[17px] font-semibold">On this page</p>
                        <ul className="mt-3 flex flex-col gap-2 text-[16px]">
                            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:underline underline-offset-4">{t.text}</a></li>)}
                        </ul>
                    </nav>
                    <article ref={articleRef} className="max-w-[68ch] lg:col-span-8 [&_h2]:scroll-mt-24
                        [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-semibold [&_h2]:tracking-tight
                        [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-[19px] [&_h3]:font-semibold
                        [&_p]:mt-4 [&_p]:text-[17px] [&_p]:leading-relaxed
                        [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2 [&_li]:text-[17px] [&_li]:leading-relaxed
                        [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold">
                        {children}
                    </article>
                    </div>
                ) : (
                    <div className="mt-[clamp(48px,6vw,88px)]">{children}</div>
                )}
            </main>
            <MarketingFooter />
        </div>
    );
};

export default StaticPageTemplate;
