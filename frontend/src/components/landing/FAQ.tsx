
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FAQ.module.css';

const faqs = [
    {
        question: "Is Finzen really free?",
        answer: "Yes! We offer a generous free plan that includes the browser extension, basic tracking, and monthly summaries. For advanced features like AI predictions, unlimited budgets, and custom goal tracking, we offer a Premium plan."
    },
    {
        question: "Is my financial data safe?",
        answer: "Absolutely. We use bank-grade 256-bit encryption to protect your data. Your credentials are never stored on our servers, and we never sell your personal information to third parties."
    },
    {
        question: "Which browsers does the extension support?",
        answer: "The Finzen extension is currently available for Google Chrome, Mozilla Firefox, Microsoft Edge, and Brave. Safari support is coming soon!"
    },
    {
        question: "Can I use Finzen on my phone?",
        answer: "Yes! While the extension works on your desktop browser, you can access your dashboard, view insights, and manage budgets from any mobile device via our responsive web app."
    },
    {
        question: "How does the auto-tracking work?",
        answer: "Our extension detects checkout confirmations on supported e-commerce sites. It securely captures the order total, date, and merchant name, then syncs it to your dashboard instantly. No manual entry required!"
    }
];

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.faqItem} data-open={isOpen}>
            <button
                className={styles.question}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {question}
                <ChevronDown className={styles.icon} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={styles.answerWrapper}
                    >
                        <div className={styles.answer}>
                            <p className={styles.answerText}>{answer}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQ = () => {
    return (
        <section className={styles.faqSection} id="faq">
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Frequently Asked Questions</h2>
                    <p className={styles.subtitle}>
                        Everything you need to know about Finzen and how it works.
                    </p>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} {...faq} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
