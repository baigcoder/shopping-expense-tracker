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
        <div className={cn("p-8 md:p-12 lg:p-16 max-w-5xl mx-auto space-y-12 bg-white min-h-screen text-black", className)}>
            {/* Header */}
            <div className="space-y-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="h-12 px-6 border-4 border-black bg-white font-black uppercase text-xs hover:bg-black hover:text-white transition-colors flex items-center gap-3"
                >
                    <ArrowLeft size={18} strokeWidth={3} />
                    SYSTEM_RETURN
                </button>
                <div>
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{title}</h1>
                    {subtitle && (
                        <p className="text-sm font-black text-black/40 mt-4 uppercase tracking-[0.2em] max-w-2xl">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="border-4 border-black p-10 md:p-16 bg-white shadow-[12px_12px_0px_#000000] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest">
                    DOC_MANIFEST_v1.0
                </div>
                <div className="prose prose-xl prose-slate max-w-none 
                    prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                    prose-p:font-bold prose-p:text-black/70 prose-p:leading-relaxed
                    prose-a:text-[#E11D48] prose-a:font-black prose-a:no-underline hover:prose-a:underline
                    prose-strong:font-black prose-strong:text-black
                    prose-li:font-bold prose-li:text-black/70">
                    {children}
                </div>
            </div>

            {/* System Footer */}
            <div className="pt-12 border-t-4 border-black text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20">
                    CASHLY_INTERNAL_DOCUMENT_CONTROL // AUDIT_SECURE
                </p>
            </div>
        </div>
    );
};

export default StaticPageTemplate;
