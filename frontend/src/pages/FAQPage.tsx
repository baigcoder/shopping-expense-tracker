// FAQ Page - Stark Gen Z Brutalist Mission Manifest
import { useState } from 'react';
import StaticPageTemplate from '../components/StaticPageTemplate';
import { Plus, Minus, HelpCircle, MessageSquare, Zap } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "What is Cashly?",
            a: "Cashly tracks your shopping and spending. The browser extension captures checkouts, then you review them in Inbox before they hit your ledger."
        },
        {
            q: "How does the browser extension work?",
            a: "It watches supported checkout pages and captures merchant, amount, and category. You approve each capture in Inbox unless a merchant rule auto-posts it."
        },
        {
            q: "Is my financial data secure?",
            a: "We never store full card numbers or banking passwords. Data is encrypted in transit and at rest."
        },
        {
            q: "Free vs Premium?",
            a: "Free covers capture, budgets, and the ledger. Premium adds live AI insights, richer reports, PDF import, and priority support."
        },
        {
            q: "Can I export my data?",
            a: "Yes. Download CSV, JSON, or PDF from Reports whenever you want."
        },
        {
            q: "How do I delete my account?",
            a: "Go to Settings → Danger zone. That permanently deletes your data."
        },
        {
            q: "Does Cashly work on phones?",
            a: "The website works in mobile browsers. Native iOS and Android apps are not ready yet."
        },
        {
            q: "How accurate is categorization?",
            a: "Common merchants are usually right. You can change a category any time and add a merchant rule so it sticks."
        },
        {
            q: "Can I add a transaction by hand?",
            a: "Yes. Use Add in the sidebar for cash or anything the extension missed."
        },
        {
            q: "Which browsers are supported?",
            a: "Chrome, Edge, Firefox, and Brave. Safari is not available yet."
        }
    ];

    return (
        <StaticPageTemplate
            title="FAQ"
            subtitle="How Cashly works, in plain language."
        >
            <div className="w-full max-w-full space-y-4 overflow-hidden">
                {faqs.map((faq, index) => (
                    <div 
                        key={index} 
                        className={cn(
                            "w-full max-w-full overflow-hidden border-2 sm:border-4 border-black transition-all",
                            openIndex === index ? "bg-black text-white shadow-[4px_4px_0px_#E11D48] sm:shadow-[8px_8px_0px_#E11D48]" : "bg-white text-black hover:border-[#E11D48]"
                        )}
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full max-w-full p-3 sm:p-8 text-left flex items-center justify-between gap-2 sm:gap-6 outline-none whitespace-normal"
                        >
                            <span className="block min-w-0 flex-1 font-black uppercase text-[0.72rem] sm:text-lg italic tracking-tighter leading-tight whitespace-normal break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{faq.q}</span>
                            <div className={cn(
                                "p-1.5 sm:p-2 border-2 shrink-0 transition-colors",
                                openIndex === index ? "border-white bg-[#E11D48] text-white" : "border-black bg-white text-black"
                            )}>
                                {openIndex === index ? (
                                    <Minus size={20} strokeWidth={4} />
                                ) : (
                                    <Plus size={20} strokeWidth={4} />
                                )}
                            </div>
                        </button>
                        <AnimatePresence>
                            {openIndex === index && (
                                <div className="px-3 sm:px-8 pb-6 sm:pb-10 font-bold text-[11px] sm:text-sm uppercase tracking-wide sm:tracking-widest leading-relaxed opacity-80 break-words">
                                    {faq.a}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-4 sm:p-10 bg-white border-2 sm:border-4 border-black shadow-[3px_3px_0px_#000000] sm:shadow-[10px_10px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center border-2 border-black shrink-0">
                        <HelpCircle size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter mb-1">Still have questions?</h3>
                        <p className="text-[11px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest text-black/40">
                            Our support team is active on the dispatch hub.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.href = '/contact'}
                    className="min-h-14 sm:h-16 w-full sm:w-auto px-6 sm:px-10 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors flex items-center justify-center gap-3"
                >
                    <MessageSquare size={20} strokeWidth={3} />
                    Contact_Support
                </button>
            </div>
        </StaticPageTemplate>
    );
};

export default FAQPage;
