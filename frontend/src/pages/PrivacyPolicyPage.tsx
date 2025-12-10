import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Mail } from 'lucide-react';
import styles from './LegalPage.module.css';

const PrivacyPolicyPage = () => {
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
                    <Shield size={48} />
                    <h1>Privacy Policy</h1>
                    <p>Last updated: December 10, 2024</p>
                </div>

                <div className={styles.section}>
                    <h2><Eye size={24} /> Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, make a transaction, or contact us for support.</p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
                        <li><strong>Transaction Data:</strong> Purchase amounts, categories, dates, and merchant information you choose to track</li>
                        <li><strong>Usage Data:</strong> How you interact with our service to improve your experience</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><Lock size={24} /> How We Protect Your Data</h2>
                    <p>Your financial data is important to us. We implement industry-standard security measures:</p>
                    <ul>
                        <li>End-to-end encryption for all sensitive data</li>
                        <li>Secure HTTPS connections</li>
                        <li>Regular security audits and updates</li>
                        <li>Data stored on secure, encrypted servers (Supabase)</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><Database size={24} /> Data Storage & Retention</h2>
                    <p>Your data is stored securely using Supabase infrastructure. We retain your data for as long as your account is active. You can request data deletion at any time.</p>
                </div>

                <div className={styles.section}>
                    <h2><UserCheck size={24} /> Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Delete your account and associated data</li>
                        <li>Export your data</li>
                        <li>Opt-out of marketing communications</li>
                    </ul>
                </div>

                <div className={styles.section}>
                    <h2><Mail size={24} /> Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                    <p><strong>Email:</strong> privacy@vibetracker.app</p>
                </div>

                <div className={styles.footer}>
                    <p>© 2024 Vibe Tracker. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicyPage;
