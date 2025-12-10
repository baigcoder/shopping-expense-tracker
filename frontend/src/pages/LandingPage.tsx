// Landing Page - Gen-Z Expense Tracker with Extension Showcase
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chrome, ArrowRight, Sparkles, CreditCard, PieChart, Target,
    Wallet, TrendingUp, Bell, Shield, Zap, FileText, Receipt,
    Brain, Calendar, BarChart3, Lock, Smartphone, Download,
    CheckCircle, Monitor, Package, Menu, X
} from 'lucide-react';
import styles from './LandingPage.module.css';

// All App Features
const features = [
    {
        icon: <Wallet size={28} />,
        title: 'Smart Dashboard',
        description: 'Beautiful overview of your finances with real-time stats, spending patterns, and quick actions.',
        color: '#8B5CF6'
    },
    {
        icon: <Receipt size={28} />,
        title: 'Transaction Tracking',
        description: 'Log expenses manually or import from CSV/PDF bank statements with AI parsing.',
        color: '#10B981'
    },
    {
        icon: <CreditCard size={28} />,
        title: 'Card Vault',
        description: 'Securely store your card details with PIN-protected CVV reveal. Multiple card themes.',
        color: '#F59E0B'
    },
    {
        icon: <Target size={28} />,
        title: 'Savings Goals',
        description: 'Set financial goals, track progress, and celebrate when you hit your targets.',
        color: '#EC4899'
    },
    {
        icon: <PieChart size={28} />,
        title: 'Budget Limits',
        description: 'Set spending limits per category. Get alerts when you\'re approaching or over budget.',
        color: '#3B82F6'
    },
    {
        icon: <BarChart3 size={28} />,
        title: 'Analytics & Insights',
        description: 'AI-powered spending analysis with charts, trends, and personalized recommendations.',
        color: '#6366F1'
    },
    {
        icon: <Calendar size={28} />,
        title: 'Subscription Tracker',
        description: 'Never miss a renewal. See your monthly burn rate and upcoming payments.',
        color: '#14B8A6'
    },
    {
        icon: <FileText size={28} />,
        title: 'Reports Export',
        description: 'Generate detailed reports in PDF/CSV. Filter by date, category, or merchant.',
        color: '#F97316'
    },
    {
        icon: <Brain size={28} />,
        title: 'AI PDF Import',
        description: 'Upload bank statements and let AI extract transactions automatically.',
        color: '#A855F7'
    },
    {
        icon: <Bell size={28} />,
        title: 'Smart Notifications',
        description: 'Real-time alerts for budget limits, goal progress, and subscription renewals.',
        color: '#EF4444'
    },
    {
        icon: <Shield size={28} />,
        title: 'Secure Auth',
        description: 'Email OTP verification, Google OAuth, and bank-level encryption.',
        color: '#059669'
    },
    {
        icon: <Smartphone size={28} />,
        title: 'Browser Extension',
        description: 'Auto-track purchases from Amazon, eBay, and 100+ stores. Available now!',
        color: '#0EA5E9'
    },
];

// Extension Features
const extensionFeatures = [
    { icon: '🛒', title: 'Auto-Track', desc: 'Automatically detects purchases on 50+ stores' },
    { icon: '🔔', title: 'Instant Alerts', desc: 'Get notified when you buy something' },
    { icon: '🎯', title: 'Budget Warnings', desc: 'Alerts when approaching budget limits' },
    { icon: '📌', title: 'Clip Page', desc: 'Manually save any page as a purchase' },
    { icon: '🔄', title: 'Real-time Sync', desc: 'All data syncs with web dashboard' },
    { icon: '➕', title: 'Quick Add', desc: 'Add expenses directly from extension' },
];

const stats = [
    { value: '50+', label: 'Features' },
    { value: '100%', label: 'Free' },
    { value: '10s', label: 'Sign Up' },
    { value: '∞', label: 'Transactions' },
];

const LandingPage = () => {
    // Download extension handler - uses fetch to properly download the zip
    const handleDownloadExtension = async () => {
        try {
            const response = await fetch('/expense-tracker-chrome-v2.zip');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'expense-tracker-chrome-v2.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open the file directly
            window.open('/expense-tracker-chrome-v2.zip', '_blank');
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    // Close mobile menu when a link is clicked
    const handleMobileLinkClick = () => setIsMobileMenuOpen(false);

    return (
        <div className={styles.landingPage}>
            {/* Navigation */}
            <nav className={styles.navbar}>
                <Link to="/" className={styles.navLogo}>
                    <img src="/logo.png" alt="Vibe Tracker" className={styles.logoImage} />
                    <span>Vibe Tracker</span>
                </Link>


                {/* Desktop Links */}
                <div className={styles.navLinks}>
                    <a href="#features" className={styles.navLink}>Features</a>
                    <a href="#extension" className={styles.navLink}>Extension</a>
                    <a href="#how-it-works" className={styles.navLink}>How It Works</a>
                    <Link to="/login" className={styles.navLinkBtn}>Log In</Link>
                    <Link to="/signup" className={styles.navCta}>
                        Get Started <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <div className={styles.hamburger}><Menu size={24} /></div>}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className={styles.mobileMenu}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <a href="#features" className={styles.mobileNavLink} onClick={handleMobileLinkClick}>Features</a>
                            <a href="#extension" className={styles.mobileNavLink} onClick={handleMobileLinkClick}>Extension</a>
                            <a href="#how-it-works" className={styles.mobileNavLink} onClick={handleMobileLinkClick}>How It Works</a>
                            <div className={styles.mobileNavActions}>
                                <Link to="/login" className={styles.mobilenavLinkBtn} onClick={handleMobileLinkClick}>Log In</Link>
                                <Link to="/signup" className={styles.mobileNavCta} onClick={handleMobileLinkClick}>
                                    Get Started <ArrowRight size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroGlow}></div>
                <motion.div
                    className={styles.heroContent}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.heroBadge}>
                        <Sparkles size={16} />
                        <span>Gen-Z Financial Freedom</span>
                    </div>
                    <h1>
                        Track Every <span className={styles.highlight}>Penny</span>,<br />
                        Save Every <span className={styles.highlight2}>Dream</span> ✨
                    </h1>
                    <p>
                        The most beautiful expense tracker you'll ever use. AI-powered insights,
                        stunning dashboards, and zero boring spreadsheets. Your money, your rules.
                    </p>
                    <div className={styles.heroCtas}>
                        <Link to="/signup" className={styles.ctaPrimary}>
                            Start Free Today <ArrowRight size={20} />
                        </Link>
                        <a href="#extension" className={styles.ctaSecondary}>
                            <Chrome size={20} /> Get Extension
                        </a>
                    </div>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                className={styles.statItem}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                            >
                                <span className={styles.statValue}>{stat.value}</span>
                                <span className={styles.statLabel}>{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Hero Visual */}
                <motion.div
                    className={styles.heroVisual}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div className={styles.dashboardPreview}>
                        <div className={styles.previewHeader}>
                            <div className={styles.previewDots}>
                                <span></span><span></span><span></span>
                            </div>
                            <span>Dashboard</span>
                        </div>
                        <div className={styles.previewContent}>
                            <div className={styles.previewCard}>
                                <span>This Month</span>
                                <strong>$2,847</strong>
                            </div>
                            <div className={styles.previewCard}>
                                <span>Saved</span>
                                <strong className={styles.green}>+$653</strong>
                            </div>
                            <div className={styles.previewTransaction}>
                                <span>🛍️</span>
                                <div>
                                    <strong>Amazon</strong>
                                    <small>Shopping</small>
                                </div>
                                <span className={styles.amount}>-$89.99</span>
                            </div>
                            <div className={styles.previewTransaction}>
                                <span>☕</span>
                                <div>
                                    <strong>Starbucks</strong>
                                    <small>Food</small>
                                </div>
                                <span className={styles.amount}>-$7.50</span>
                            </div>
                            <div className={styles.previewProgress}>
                                <div className={styles.progressLabel}>
                                    <span>Shopping Budget</span>
                                    <span>65%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <motion.div
                                        className={styles.progressFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: '65%' }}
                                        transition={{ duration: 1, delay: 1 }}
                                    ></motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Floating Elements */}
                    <motion.div
                        className={`${styles.floater} ${styles.floater1}`}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        🎯 Goal Reached!
                    </motion.div>
                    <motion.div
                        className={`${styles.floater} ${styles.floater2}`}
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        💳 Card Added
                    </motion.div>
                    <motion.div
                        className={`${styles.floater} ${styles.floater3}`}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >
                        📊 AI Insights
                    </motion.div>
                </motion.div>
            </section>

            {/* ============================================
               EXTENSION SECTION
               ============================================ */}
            <section id="extension" className={styles.extensionSection}>
                <motion.div
                    className={styles.sectionHeader}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className={styles.sectionBadge}>🧩 Browser Extension</span>
                    <h2>Auto-Track Your Purchases</h2>
                    <p>Install our Chrome extension and never manually log a purchase again.</p>
                </motion.div>

                <div className={styles.extensionGrid}>
                    {/* Extension Preview */}
                    <motion.div
                        className={styles.extensionPreview}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className={styles.extensionMockup}>
                            <div className={styles.mockupHeader}>
                                <span>💰 Vibe Tracker</span>
                                <span className={styles.mockupBadge}>v2.0</span>
                            </div>
                            <div className={styles.mockupStats}>
                                <div className={styles.mockupStat}>
                                    <span>💸</span>
                                    <div>
                                        <strong>$847.50</strong>
                                        <small>This Month</small>
                                    </div>
                                </div>
                                <div className={styles.mockupStat}>
                                    <span>🛒</span>
                                    <div>
                                        <strong>24</strong>
                                        <small>Purchases</small>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.mockupAlert}>
                                ⚠️ Shopping budget at 85%
                            </div>
                            <div className={styles.mockupActions}>
                                <button>📌 Clip</button>
                                <button>➕ Add</button>
                                <button>📊 Dashboard</button>
                                <button>🎯 Budgets</button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Extension Info */}
                    <motion.div
                        className={styles.extensionInfo}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3>Extension Features</h3>
                        <div className={styles.extFeaturesList}>
                            {extensionFeatures.map((f, i) => (
                                <div key={i} className={styles.extFeature}>
                                    <span className={styles.extFeatureIcon}>{f.icon}</span>
                                    <div>
                                        <strong>{f.title}</strong>
                                        <p>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Download Section */}
                <motion.div
                    className={styles.downloadSection}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className={styles.downloadCard}>
                        <div className={styles.downloadMain}>
                            <div className={styles.browserIcon}>
                                <Chrome size={40} />
                            </div>
                            <div className={styles.downloadInfo}>
                                <h4>Chrome Extension</h4>
                                <p>Developer Mode • Store Coming Soon</p>
                                <span className={styles.devBadge}>🛠️ Dev Mode</span>
                            </div>
                            <button
                                onClick={handleDownloadExtension}
                                className={styles.downloadBtn}
                            >
                                <Download size={20} />
                                Download v2.1
                            </button>
                        </div>

                        <div className={styles.browserRow}>
                            <div className={styles.browserItem}>
                                <span>🌐</span>
                                <div>
                                    <strong>Brave</strong>
                                    <small>Use Chrome version</small>
                                </div>
                                <span className={styles.compatBadge}>Compatible</span>
                            </div>
                            <div className={styles.browserItem}>
                                <span>🦊</span>
                                <div>
                                    <strong>Firefox</strong>
                                    <small>Dev Mode Available</small>
                                </div>
                                <span className={styles.devBadge}>🛠️ Dev</span>
                            </div>
                            <div className={styles.browserItem}>
                                <span>🔷</span>
                                <div>
                                    <strong>Edge</strong>
                                    <small>Dev Mode Available</small>
                                </div>
                                <span className={styles.devBadge}>🛠️ Dev</span>
                            </div>
                        </div>

                        <div className={styles.storeNotice}>
                            <span>🏪</span>
                            <div>
                                <strong>Chrome Web Store Coming Soon!</strong>
                                <p>We're working on publishing to official browser stores. For now, use Developer Mode installation.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* Installation Guide */}
                <motion.div
                    className={styles.installGuide}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h3>How to Install (Developer Mode)</h3>
                    <div className={styles.installSteps}>
                        <div className={styles.installStep}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <h4>Download & Extract</h4>
                                <p>Download the .zip file above and extract it to a folder on your computer.</p>
                            </div>
                        </div>
                        <div className={styles.installStep}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <h4>Open Extensions Page</h4>
                                <p>Go to <code>chrome://extensions</code> in Chrome or <code>brave://extensions</code> in Brave.</p>
                            </div>
                        </div>
                        <div className={styles.installStep}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <h4>Enable Developer Mode</h4>
                                <p>Toggle "Developer mode" ON in the top-right corner of the extensions page.</p>
                            </div>
                        </div>
                        <div className={styles.installStep}>
                            <div className={styles.stepNumber}>4</div>
                            <div className={styles.stepContent}>
                                <h4>Load Extension</h4>
                                <p>Click "Load unpacked" and select the extracted folder. The extension is now installed!</p>
                            </div>
                        </div>
                        <div className={styles.installStep}>
                            <div className={styles.stepNumber}>5</div>
                            <div className={styles.stepContent}>
                                <h4>Sign In & Sync</h4>
                                <p>Click the extension icon, sign in with your account, and start tracking!</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className={styles.features}>
                <motion.div
                    className={styles.sectionHeader}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className={styles.sectionBadge}>✨ Everything You Need</span>
                    <h2>Packed with Features</h2>
                    <p>From basic tracking to AI-powered insights, we've got you covered.</p>
                </motion.div>

                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className={styles.featureCard}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                        >
                            <div
                                className={styles.featureIcon}
                                style={{ background: `${feature.color}15`, color: feature.color }}
                            >
                                {feature.icon}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className={styles.howItWorks}>
                <motion.div
                    className={styles.sectionHeader}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className={styles.sectionBadge}>🚀 Quick Start</span>
                    <h2>Up & Running in Minutes</h2>
                    <p>No complex setup. Just sign up and start tracking.</p>
                </motion.div>

                <div className={styles.stepsContainer}>
                    {[
                        { num: '01', title: 'Create Account', desc: 'Sign up with email or Google. Takes 10 seconds.', icon: '📧' },
                        { num: '02', title: 'Add a Transaction', desc: 'Log your first expense or import from CSV/PDF.', icon: '➕' },
                        { num: '03', title: 'Set Budgets', desc: 'Define limits per category. Get smart alerts.', icon: '🎯' },
                        { num: '04', title: 'Track & Grow', desc: 'Watch your savings grow. Hit your goals.', icon: '📈' },
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            className={styles.stepCard}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <div className={styles.stepNum}>{step.num}</div>
                            <div className={styles.stepIcon}>{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Security Section */}
            <section className={styles.securitySection}>
                <motion.div
                    className={styles.securityContent}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className={styles.securityIcon}>
                        <Lock size={40} />
                    </div>
                    <h2>Your Data is <span>Fort Knox</span> Safe</h2>
                    <p>
                        We use bank-level encryption, secure authentication, and never sell your data.
                        Your financial information stays private. Always.
                    </p>
                    <div className={styles.securityBadges}>
                        <div className={styles.badge}>🔐 256-bit Encryption</div>
                        <div className={styles.badge}>✅ Email OTP Verification</div>
                        <div className={styles.badge}>🔑 OAuth 2.0</div>
                        <div className={styles.badge}>🛡️ Row-Level Security</div>
                    </div>
                </motion.div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <motion.div
                    className={styles.ctaContent}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <Sparkles className={styles.ctaSparkle} size={40} />
                    <h2>Ready to Take Control? 🚀</h2>
                    <p>Join thousands who've transformed their financial habits. It's free, forever.</p>
                    <div className={styles.ctaButtons}>
                        <Link to="/signup" className={styles.ctaPrimaryLarge}>
                            Create Free Account <ArrowRight size={24} />
                        </Link>
                    </div>
                    <span className={styles.ctaNote}>No credit card required • Free forever • Cancel anytime</span>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerTop}>
                    <div className={styles.footerBrand}>
                        <span className={styles.footerLogo}>
                            <img src="/logo.png" alt="Vibe Tracker" className={styles.footerLogoImage} />
                            Vibe Tracker
                        </span>

                        <p>The Gen-Z way to manage money.</p>
                        <div className={styles.footerSocials}>
                            <a href="https://github.com/baigcoder" target="_blank" rel="noopener noreferrer" title="GitHub">
                                <span>🐙</span>
                            </a>
                            <a href="https://hassan-baigo-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" title="Portfolio">
                                <span>🌐</span>
                            </a>
                            <a href="https://www.linkedin.com/in/hassan-baig-672778111/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                <span>💼</span>
                            </a>
                        </div>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#extension">Extension</a>
                            <a href="#how-it-works">How It Works</a>
                            <Link to="/login">Login</Link>
                        </div>
                        <div>
                            <h4>Legal</h4>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/faq">Cookie Policy</Link>
                        </div>
                        <div>
                            <h4>Support</h4>
                            <Link to="/faq">Help Center</Link>
                            <Link to="/contact">Contact Us</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>

                    </div>
                </div>

                <div className={styles.footerDivider} />

                <div className={styles.footerBottom}>
                    <p>© 2024 Vibe Tracker. All rights reserved.</p>
                    <a
                        href="https://hassan-baigo-portfolio.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.developerCard}
                    >
                        <img src="/developer.png" alt="Hassan Baig" className={styles.developerAvatar} />
                        <div className={styles.developerInfo}>
                            <span className={styles.developerName}>
                                Hassan<span className={styles.orangeText}>Baig</span>
                            </span>
                            <span className={styles.developerRole}>FULL STACK DEV</span>
                        </div>
                    </a>
                </div>

            </footer>

        </div>
    );
};

export default LandingPage;
