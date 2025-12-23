import StaticPageTemplate from '../components/StaticPageTemplate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "What is SpendSync?",
            a: "SpendSync is a smart expense tracking application that automatically captures and categorizes your transactions using our browser extension. Get real-time insights, set budgets, and achieve your financial goals."
        },
        {
            q: "How does the browser extension work?",
            a: "Our extension monitors your online shopping activity and automatically logs transactions. It works with popular e-commerce sites and captures details like merchant, amount, and category. All data is encrypted and stored securely."
        },
        {
            q: "Is my financial data secure?",
            a: "Yes! We use bank-level encryption (AES-256) for all data. We never store your credit card details or banking credentials. All data is encrypted in transit and at rest using Supabase's secure infrastructure."
        },
        {
            q: "What's the difference between Free and Premium?",
            a: "Free includes unlimited transaction tracking, basic analytics, and budgets. Premium adds AI insights, advanced analytics, PDF export, goal tracking, subscription management, and priority support."
        },
        {
            q: "Can I export my data?",
            a: "Yes! You can export your transactions in CSV, JSON, or PDF format anytime. Go to Profile > Data & Privacy > Export Data."
        },
        {
            q: "How do I delete my account?",
            a: "Go to Settings > Security > Delete Account. This action is permanent and will remove all your data from our servers. You can also contact support for assistance."
        },
        {
            q: "Does SpendSync work on mobile?",
            a: "The web app is fully responsive and works on mobile browsers. We're currently developing native iOS and Android apps (coming Q2 2025)."
        },
        {
            q: "How accurate is transaction categorization?",
            a: "Our AI achieves 95%+ accuracy for common categories. You can always manually edit categories, and the system learns from your corrections."
        },
        {
            q: "Can I track cash transactions?",
            a: "Yes! Use the 'Add Transaction' button to manually log cash expenses. The extension only auto-tracks online purchases."
        },
        {
            q: "What browsers are supported?",
            a: "Chrome, Edge, Firefox, and Brave. Safari support coming soon."
        }
    ];

    return (
        <StaticPageTemplate
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about SpendSync"
        >
            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <Card key={index} className="overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <span className="font-semibold">{faq.q}</span>
                            {openIndex === index ? (
                                <Minus className="h-5 w-5 text-primary" />
                            ) : (
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            )}
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-4 text-muted-foreground">
                                {faq.a}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <div className="mt-8 p-6 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button>Contact Support</Button>
            </div>
        </StaticPageTemplate>
    );
};

export default FAQPage;
