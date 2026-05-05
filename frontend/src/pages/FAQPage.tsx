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
            q: "What is Cashly Core?",
            a: "Cashly is a mission-critical financial audit engine. It automatically captures and categorizes your shopping telemetry using our browser extension, providing real-time data on your financial outflow."
        },
        {
            q: "How does the browser extension work?",
            a: "Our telemetry node monitors e-commerce sites and automatically logs transactions. It captures merchant data, quantum (amount), and category labels. All data is encrypted using high-fidelity protocols."
        },
        {
            q: "Is my financial data secure?",
            a: "Affirmative. We utilize bank-grade AES-256 encryption. We never store credit card details or banking credentials. All telemetry is encrypted in transit and at rest."
        },
        {
            q: "Free vs. Premium Tiers?",
            a: "Free tier covers basic telemetry and budgeting. Premium unlocks AI Neural Insights, advanced audit reports, PDF manifests, and priority mission support."
        },
        {
            q: "Can I export my data manifest?",
            a: "Yes. You can export your data in CSV, JSON, or PDF manifests at any time. Navigate to System Control > Security > Export Manifest."
        },
        {
            q: "How do I terminate my account?",
            a: "Navigate to System Control > Danger Protocol > Purge Account. This action is permanent and will securely wipe all your telemetry from our nodes."
        },
        {
            q: "Does Cashly work on mobile nodes?",
            a: "The web interface is fully responsive across all mobile browsers. Dedicated mobile nodes for iOS and Android are currently in development."
        },
        {
            q: "Accuracy of categorization?",
            a: "Our Neural Engine achieves 95%+ accuracy for common merchant nodes. You can manually reconfigure categories to train the system."
        },
        {
            q: "Manual transaction logging?",
            a: "Yes. Use the 'Issue Transaction' protocol to manually log cash or external expenses that bypass the extension node."
        },
        {
            q: "Supported browser nodes?",
            a: "Chrome, Edge, Firefox, and Brave. Safari node deployment is pending."
        }
    ];

    return (
        <StaticPageTemplate
            title="System FAQ Matrix"
            subtitle="EVERYTHING_YOU_NEED_TO_KNOW_ABOUT_CASHLY_CORE_OPERATIONS"
        >
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div 
                        key={index} 
                        className={cn(
                            "border-4 border-black transition-all",
                            openIndex === index ? "bg-black text-white shadow-[8px_8px_0px_#E11D48]" : "bg-white text-black hover:border-[#E11D48]"
                        )}
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full p-8 text-left flex items-center justify-between gap-6 outline-none"
                        >
                            <span className="font-black uppercase text-lg italic tracking-tighter">{faq.q}</span>
                            <div className={cn(
                                "p-2 border-2 shrink-0 transition-colors",
                                openIndex === index ? "border-white bg-[#E11D48] text-white" : "border-black bg-white text-black"
                            )}>
                                {openIndex === index ? (
                                    <Minus size={24} strokeWidth={4} />
                                ) : (
                                    <Plus size={24} strokeWidth={4} />
                                )}
                            </div>
                        </button>
                        <AnimatePresence>
                            {openIndex === index && (
                                <div className="px-8 pb-10 font-bold text-sm uppercase tracking-widest leading-relaxed opacity-80">
                                    {faq.a}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-10 bg-white border-4 border-black shadow-[10px_10px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black text-white flex items-center justify-center border-2 border-black shrink-0">
                        <HelpCircle size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-1">Still have questions?</h3>
                        <p className="text-xs font-black uppercase tracking-widest text-black/40">
                            Our support team is active on the dispatch hub.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.href = '/contact'}
                    className="h-16 px-10 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors flex items-center gap-3"
                >
                    <MessageSquare size={20} strokeWidth={3} />
                    Contact_Support
                </button>
            </div>
        </StaticPageTemplate>
    );
};

export default FAQPage;
