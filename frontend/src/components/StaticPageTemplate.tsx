// Static Page Template - Stark Gen Z Brutalist Architecture
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StaticPageTemplateProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

const StaticPageTemplate = ({ title, subtitle, children, className }: StaticPageTemplateProps) => {
    const navigate = useNavigate();

    return (
        <div className={cn("w-full max-w-5xl mx-auto min-h-screen bg-white text-black p-3 sm:p-8 md:p-12 lg:p-16 space-y-7 sm:space-y-12 overflow-x-hidden", className)}>
            {/* Header */}
            <div className="space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="min-h-11 sm:min-h-12 px-3 sm:px-6 border-4 border-black bg-white font-black uppercase text-[11px] sm:text-xs hover:bg-black hover:text-white transition-colors inline-flex items-center gap-2 sm:gap-3 max-w-full"
                >
                    <ArrowLeft size={18} strokeWidth={3} />
                    SYSTEM_RETURN
                </button>
                <div>
                    <h1 className="font-black italic uppercase tracking-tighter leading-[0.95] break-words" style={{ fontSize: 'clamp(1.1rem, 6.4vw, 3.75rem)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{title}</h1>
                    {subtitle && (
                        <p className="text-[0.68rem] sm:text-sm font-black text-black/40 mt-4 uppercase tracking-[0.08em] sm:tracking-[0.2em] max-w-2xl leading-relaxed break-words" style={{ overflowWrap: 'anywhere' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="w-full max-w-full border-2 sm:border-4 border-black p-3 sm:p-10 md:p-16 bg-white shadow-[3px_3px_0px_#000000] sm:shadow-[12px_12px_0px_#000000] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest">
                    DOC_MANIFEST_v1.0
                </div>
                <div className="prose prose-sm sm:prose-xl prose-slate w-full max-w-full
                    prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                    prose-p:font-bold prose-p:text-black/70 prose-p:leading-relaxed
                    prose-a:text-[#E11D48] prose-a:font-black prose-a:no-underline hover:prose-a:underline
                    prose-strong:font-black prose-strong:text-black
                    prose-li:font-bold prose-li:text-black/70">
                    {children}
                </div>
            </div>

            {/* System Footer */}
            <div className="pt-8 sm:pt-12 border-t-4 border-black text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:tracking-[0.5em] text-black/20 break-words">
                    CASHLY_INTERNAL_DOCUMENT_CONTROL // AUDIT_SECURE
                </p>
            </div>
        </div>
    );
};

export default StaticPageTemplate;
