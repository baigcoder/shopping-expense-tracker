import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { Button } from '@/components/ui/button';

interface StaticPageTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

const StaticPageTemplate = ({ title, subtitle, children, className }: StaticPageTemplateProps) => {
    const navigate = useNavigate();

    return (
        <div className={cn('min-h-screen bg-[#FAF8F5] text-[#1C1917]', className)}>
            <MarketingNav />
            <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
                <Button variant="ghost" className="mb-6 px-0 hover:bg-transparent" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                {subtitle && (
                    <p className="mt-3 max-w-2xl text-[#57534E] leading-relaxed">{subtitle}</p>
                )}
                <div className="prose prose-stone mt-8 max-w-none
                    prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight
                    prose-p:text-[#57534E] prose-p:leading-relaxed
                    prose-a:text-[#E11D48] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[#1C1917] prose-li:text-[#57534E]">
                    {children}
                </div>
            </main>
            <MarketingFooter />
        </div>
    );
};

export default StaticPageTemplate;
