import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import styles from './LegalPage.module.css';

const TermsOfServicePage = () => {
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
                    <FileText size={48} />
                    <h1>Terms of Service</h1>
                    <p>Last updated: December 10, 2024</p>
                </div>

                <div className={styles.section}>
                    <h2><CheckCircle size={24} /> Acceptance of Terms</h2>
                    <p>By accessing or using Vibe Tracker, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
                </div>

                <div className={styles.section}>
                    <h2><CheckCircle size={24} /> Description of Service</h2>
                    <p>Vibe Tracker is a personal expense tracking application that helps you:</p>
                    <ul>
                        <li>Track your daily expenses and transactions</li>
                        <li>Set and monitor budgets</li>
                        <li>Analyze spending patterns with visual insights</li>
                        <li>Auto-track purchases via browser extension</li>
                        <li>Export financial reports</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><CreditCard size={24} /> Account Responsibilities</h2>
                    <p>You are responsible for:</p>
                    <ul>
                        <li>Maintaining the confidentiality of your account credentials</li>
                        <li>All activities that occur under your account</li>
                        <li>Providing accurate and complete information</li>
                        <li>Notifying us immediately of any unauthorized use</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><XCircle size={24} /> Prohibited Uses</h2>
                    <p>You agree not to use the service to:</p>
                    <ul>
                        <li>Violate any applicable laws or regulations</li>
                        <li>Upload malicious code or attempt to hack the system</li>
                        <li>Impersonate others or provide false information</li>
                        <li>Use automated systems to scrape or extract data</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><AlertTriangle size={24} /> Disclaimer</h2>
                    <p>Vibe Tracker is provided "as is" without warranties of any kind. We do not provide financial advice. Always consult a financial professional for important financial decisions.</p>
                </div>

                <div className={styles.section}>
                    <h2>Termination</h2>
                    <p>We may terminate or suspend your account at any time for violations of these terms. You may delete your account at any time from your settings.</p>
                </div>

                <div className={styles.footer}>
                    <p>© 2024 Vibe Tracker. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default TermsOfServicePage;
