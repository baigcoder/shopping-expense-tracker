import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, CreditCard, Shield, Zap, Download } from 'lucide-react';
import styles from './LegalPage.module.css';

const faqs = [
    {
        category: 'Getting Started',
        icon: <Zap size={20} />,
        questions: [
            {
                q: 'How do I create an account?',
                a: 'Click "Get Started" on our homepage and sign up with your email or Google account. It takes less than 30 seconds!'
            },
            {
                q: 'Is Vibe Tracker free to use?',
                a: 'Yes! Vibe Tracker offers a free plan with all essential features. Premium features are available for power users.'
            },
            {
                q: 'What browsers are supported?',
                a: 'Our web app works on all modern browsers. The extension is available for Chrome, Brave, Firefox, and Edge.'
            }
        ]
    },
    {
        category: 'Tracking Expenses',
        icon: <CreditCard size={20} />,
        questions: [
            {
                q: 'How do I add a transaction?',
                a: 'Click the "+" button on your dashboard, enter the amount, category, and description. You can also use our browser extension to auto-track purchases.'
            },
            {
                q: 'Can I edit or delete transactions?',
                a: 'Yes! Click on any transaction to edit or delete it. All changes are saved automatically.'
            },
            {
                q: 'How do budgets work?',
                a: 'Set monthly budgets for different categories. We\'ll track your spending and alert you when you\'re approaching your limit.'
            }
        ]
    },
    {
        category: 'Browser Extension',
        icon: <Download size={20} />,
        questions: [
            {
                q: 'How do I install the extension?',
                a: 'Download from our website, extract the zip, go to chrome://extensions, enable Developer Mode, click "Load unpacked" and select the folder.'
            },
            {
                q: 'What sites does the extension track?',
                a: 'We auto-detect purchases from Amazon, eBay, Walmart, and 100+ other e-commerce sites.'
            },
            {
                q: 'Is my payment data safe?',
                a: 'Absolutely! We never access or store your payment card details. We only track transaction amounts and merchant names.'
            }
        ]
    },
    {
        category: 'Security & Privacy',
        icon: <Shield size={20} />,
        questions: [
            {
                q: 'Is my financial data secure?',
                a: 'Yes! We use bank-level encryption and secure infrastructure. Your data is never shared with third parties.'
            },
            {
                q: 'Can I delete my account?',
                a: 'Yes, go to Settings > Danger Zone > Delete Account. This will permanently delete all your data.'
            },
            {
                q: 'Do you sell my data?',
                a: 'Never. Your data belongs to you. We don\'t sell, share, or monetize your personal information.'
            }
        ]
    }
];

const FAQPage = () => {
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredFaqs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.content}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link to="/" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <div className={styles.header}>
                    <HelpCircle size={48} />
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about Vibe Tracker</p>
                </div>

                <div className={styles.searchBox}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredFaqs.map((category, catIdx) => (
                    <div key={catIdx} className={styles.faqCategory}>
                        <h2>{category.icon} {category.category}</h2>
                        <div className={styles.faqList}>
                            {category.questions.map((item, idx) => {
                                const itemId = `${catIdx}-${idx}`;
                                const isOpen = openItems.includes(itemId);
                                return (
                                    <div
                                        key={idx}
                                        className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}
                                    >
                                        <button
                                            className={styles.faqQuestion}
                                            onClick={() => toggleItem(itemId)}
                                        >
                                            <span>{item.q}</span>
                                            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                        {isOpen && (
                                            <motion.div
                                                className={styles.faqAnswer}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                            >
                                                <p>{item.a}</p>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className={styles.contactBox}>
                    <h3>Still have questions?</h3>
                    <p>Can't find what you're looking for? Reach out to us!</p>
                    <Link to="/contact" className={styles.contactBtn}>Contact Support</Link>
                </div>

                <div className={styles.footer}>
                    <p>© 2024 Vibe Tracker. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default FAQPage;
