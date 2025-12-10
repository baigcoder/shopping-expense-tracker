// Landing Page - The Ultimate Gen-Z Vibe 🚀
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Chrome, ArrowRight, Sparkles, CreditCard, PieChart, Target,
    Bell, Shield, Zap, Globe, Menu, X, Download, Star, TrendingUp, DollarSign, CheckCircle, Smartphone
} from 'lucide-react';
import styles from './LandingPage.module.css';

// Feature Visual Components (Mini UIs)
const VisualAnalytics = () => (
    <div className={styles.mockUI}>
        <div className={styles.mockChart}>
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
                <motion.div
                    key={i}
                    className={styles.chartBar}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                />
            ))}
        </div>
    </div>
);

// New Dynamic Auto-Save Visual
const VisualAutoSave = () => {
    return (
        <div className={`${styles.mockUI} ${styles.autoSaveContainer}`}>
            <div className={styles.autoSaveWrapper}>
                {/* Step 1: Purchase */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={styles.autoSaveCard}
                >
                    <div className={styles.autoSaveIcon}>🛒</div>
                    <div className={styles.autoSaveText}>
                        <div className={styles.autoSaveLabel}>CHECKOUT COMPLETED</div>
                        <div className={styles.autoSaveValue}>Nike Air Max</div>
                    </div>
                    <div className={styles.autoSavePrice}>$120.00</div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <ArrowRight style={{ transform: 'rotate(90deg)' }} />
                </motion.div>

                {/* Step 2: Auto Saved */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, type: 'spring' }}
                    className={styles.autoSaveSuccess}
                >
                    <div className={styles.successIcon}>
                        <CheckCircle size={14} />
                    </div>
                    <div className={styles.autoSaveText}>
                        <div className={styles.successLabel}>AUTO-SAVED</div>
                        <div className={styles.autoSaveValue}>Transaction Recorded</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const VisualChat = () => (
    <div className={styles.mockUI}>
        <div className={styles.mockChat}>
            <div className={`${styles.chatMsg} ${styles.msgLeft}`}>"You spent $400 on boba..."</div>
            <div className={`${styles.chatMsg} ${styles.msgRight}`}>"Oops 😅"</div>
        </div>
    </div>
);

const VisualGoal = () => (
    <div className={styles.mockUI}>
        <div className={styles.mockGoal}>
            <motion.div
                className={styles.goalCircle}
                initial={{ rotate: 0 }}
                whileInView={{ rotate: 360 }}
                transition={{ duration: 2 }}
            >
                85%
            </motion.div>
            <p style={{ fontWeight: 800, fontSize: '0.8rem' }}>BALI TRIP ✈️</p>
        </div>
    </div>
);

// NEW: Dark Pattern Shield Visual
const VisualShield = () => (
    <div className={`${styles.mockUI} ${styles.shieldVisualContainer}`}>
        <div className={styles.shieldWrapper}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.shieldAlertCard}
            >
                <span className={styles.shieldEmoji}>⚠️</span>
                <div className={styles.shieldTextContent}>
                    <div className={styles.shieldAlertTitle}>DARK PATTERN DETECTED</div>
                    <div className={styles.shieldDesc}>Auto-renewal enabled</div>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className={styles.shieldSuccessCard}
            >
                <span className={styles.shieldEmoji}>🛡️</span>
                <div className={styles.shieldTextContent}>
                    <div className={styles.shieldSuccessTitle}>BLOCKED & SAVED</div>
                    <div className={styles.shieldDesc}>Rs 2,500/month avoided</div>
                </div>
            </motion.div>
        </div>
    </div>
);

const LandingPage = () => {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 400]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleDownloadExtension = async () => {
        try {
            const response = await fetch('/vibetracker-chrome-v2.7.0.zip');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'vibetracker-chrome-v2.7.0.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open('/vibetracker-chrome-v2.7.1.zip', '_blank');
        }
    };

    return (
        <div className={styles.landingContainer}>
            {/* NAVIGATION */}
            <nav className={styles.nav}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>⚡</div>
                    <span>VIBE TRACKER</span>
                </div>
                <div className={styles.navLinks}>
                    <a href="#features">Features</a>
                    <a href="#extension">Extension</a>
                    <Link to="/login" className={styles.loginBtn}>Login</Link>
                    <Link to="/signup" className={styles.signupBtn}>GET RICH 🤑</Link>
                </div>
                <button className={styles.mobileMenuBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* HERO SECTION */}
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.heroBadge}
                    >
                        <Sparkles size={16} /> EST. 2024 • FINANCE FOR GEN Z
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={styles.heroTitle}
                    >
                        STOP BEING<br />
                        <span className={styles.highlight}>BROKE.</span> PERIOD.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={styles.heroSubtitle}
                    >
                        Track expenses, expose your spending habits, and actually save money for once.
                        No boring spreadsheets. Just vibes.
                    </motion.p>

                    <div className={styles.heroActions}>
                        <Link to="/signup" className={styles.ctaPrimary}>
                            START TRACKING <ArrowRight size={20} />
                        </Link>
                        <button onClick={() => document.getElementById('extension')?.scrollIntoView()} className={styles.ctaSecondary}>
                            EXTENSION <Chrome size={20} />
                        </button>
                    </div>

                    <div className={styles.activeUsers}>
                        <div className={styles.avatars}>
                            {[1, 2, 3].map(i => <div key={i} className={styles.avatar}>😎</div>)}
                        </div>
                        <p>Join <strong>10k+</strong> besties saving money</p>
                    </div>
                </div>

                <div className={styles.heroVisual}>
                    <motion.div style={{ y: yHero }} className={styles.dashboardCard}>
                        {/* Mock Dashboard Representation */}
                        <div className={styles.browserHeader}>
                            <div className={`${styles.browserDot} ${styles.red}`} />
                            <div className={`${styles.browserDot} ${styles.yellow}`} />
                            <div className={`${styles.browserDot} ${styles.green}`} />
                            <div className={styles.browserUrl}>vibetracker.app/dashboard</div>
                        </div>
                        <div className={styles.mockDashContent}>
                            <div className={styles.mockStatRow}>
                                <div className={styles.mockStatCard}>
                                    <span className={styles.mockStatValue}>$12,450</span>
                                    <span className={styles.mockStatLabel}>Total Balance</span>
                                </div>
                                <div className={styles.mockStatCard}>
                                    <span className={styles.mockStatValue}>-$850</span>
                                    <span className={styles.mockStatLabel}>This Month</span>
                                </div>
                            </div>
                            <div className={styles.mockGraph}>
                                {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className={styles.graphBar}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            className={`${styles.floatSticker} ${styles.sticker1}`}
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                        >
                            💸 SAVED $500!
                        </motion.div>
                        <motion.div
                            className={`${styles.floatSticker} ${styles.sticker2}`}
                            animate={{ y: [10, -10, 10] }}
                            transition={{ repeat: Infinity, duration: 5 }}
                        >
                            🔥 ON STREAK
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            {/* MARQUEE */}
            <div className={styles.marqueeContainer}>
                <div className={styles.marqueeTrack}>
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className={styles.marqueeItem}>
                            TRACK MONEY 💸 SAVE VIBES ✨ NO CAP 🧢 STAY RICH 💰
                        </span>
                    ))}
                </div>
            </div>

            {/* FEATURES GRID */}
            <section id="features" className={styles.featuresSection}>
                <h2 className={styles.sectionTitle}>EVERYTHING YOU NEED 📦</h2>
                <p className={styles.sectionSubtitle}>We packed this bad boy with features to help you stop impulse buying used items at 3AM.</p>

                <div className={styles.bentoGrid}>
                    {/* Dark Pattern Shield - NEW FEATURE */}
                    <div className={`${styles.bentoCard} ${styles.span2}`} style={{ background: '#F0FDF4', borderColor: '#10B981', position: 'relative' }}>
                        <div className={styles.newBadge}>NEW ✨</div>
                        <div className={styles.featureIcon} style={{ background: '#10B981', color: '#fff' }}>
                            <Shield size={30} />
                        </div>
                        <h3 className={styles.featureTitle}>Dark Pattern Shield 🛡️</h3>
                        <p className={styles.featureDesc}>
                            We detect sneaky subscriptions, hidden charges, and guilt-trip buttons.
                            Get warned BEFORE you get charged. Set trial reminders. Stay protected.
                        </p>
                        <VisualShield />
                    </div>

                    {/* Dynamic Auto-Tracking */}
                    <div className={`${styles.bentoCard} ${styles.span2}`} style={{ background: '#F0FDFA', borderColor: '#059669' }}>
                        <div className={styles.featureIcon} style={{ background: '#0891B2', color: '#fff' }}>
                            <Zap size={30} fill="currentColor" />
                        </div>
                        <h3 className={styles.featureTitle}>Auto-Save Magic ✨</h3>
                        <p className={styles.featureDesc}>
                            You shop. We save it. Instantly. <br />
                            Our tech detects transactions and logs them for you. No manual entry required.
                        </p>
                        <VisualAutoSave />
                    </div>

                    {/* Analytics Card */}
                    <div className={`${styles.bentoCard} ${styles.span2}`}>
                        <div className={styles.featureIcon}><PieChart /></div>
                        <h3 className={styles.featureTitle}>The Command Center</h3>
                        <p className={styles.featureDesc}>Real-time analytics that look sexy.</p>
                        <VisualAnalytics />
                    </div>

                    {/* AI Chat Card */}
                    <div className={`${styles.bentoCard} ${styles.span1} ${styles.rowSpan2}`}>
                        <div className={styles.featureIcon}><Sparkles /></div>
                        <h3 className={styles.featureTitle}>AI Roast Master</h3>
                        <p className={styles.featureDesc}>Get roasted when you overspend.</p>
                        <VisualChat />
                    </div>

                    {/* Goals Card */}
                    <div className={`${styles.bentoCard} ${styles.span1}`}>
                        <div className={styles.featureIcon}><Target /></div>
                        <h3 className={styles.featureTitle}>Dream Big</h3>
                        <p className={styles.featureDesc}>Saving for a trip? Track it here.</p>
                        <VisualGoal />
                    </div>

                    {/* Other Features */}
                    <div className={`${styles.bentoCard} ${styles.span1}`}>
                        <div className={styles.featureIcon}><CreditCard /></div>
                        <h3 className={styles.featureTitle}>Budgets</h3>
                        <p className={styles.featureDesc}>Set limits. Don't cross them.</p>
                    </div>

                    <div className={`${styles.bentoCard} ${styles.span1}`}>
                        <div className={styles.featureIcon}><Bell /></div>
                        <h3 className={styles.featureTitle}>Sub Slayers</h3>
                        <p className={styles.featureDesc}>Kill unused subscriptions.</p>
                    </div>
                </div>
            </section>

            {/* EXTENSION SHOWCASE */}
            < section id="extension" className={styles.extensionSection} >
                <div className={styles.extensionContent}>
                    <div className={styles.extensionText}>
                        <span className={styles.heroBadge}>v2.7.1 • AVAILABLE ON CHROME</span>
                        <h2 className={styles.extensionTitle}>BROWSE. CLICK. TRACKED. 🪄</h2>
                        <p className={styles.extensionDesc}>
                            Our extension sits quietly in your browser. When you visit Amazon, eBay, or 100+ other stores, it lights up.
                            <br /><br />
                            <strong>See a price? One click to save it.</strong> Manage categories, add notes, and sync to your dashboard instantly.
                            <br /><br />
                            <span style={{ color: '#10B981', fontWeight: 800 }}>✨ NEW in v2.7.1:</span> Secure auto-logout sync, improved login UI, and smarter notifications!
                        </p>

                        <div className={styles.installBox}>
                            <div className={styles.stepsGrid}>
                                <div className={styles.stepCard}>
                                    <div className={styles.stepNum}>1</div>
                                    <div className={styles.stepTitle}>DOWNLOAD</div>
                                    <div className={styles.stepDesc}>Get the .zip file</div>
                                </div>
                                <div className={styles.stepCard}>
                                    <div className={styles.stepNum}>2</div>
                                    <div className={styles.stepTitle}>LOAD</div>
                                    <div className={styles.stepDesc}>Unpack in Chrome</div>
                                </div>
                                <div className={styles.stepCard}>
                                    <div className={styles.stepNum}>3</div>
                                    <div className={styles.stepTitle}>PROFIT</div>
                                    <div className={styles.stepDesc}>Start tracking!</div>
                                </div>
                            </div>

                            <button onClick={handleDownloadExtension} className={styles.ctaPrimary}>
                                <Download size={24} /> DOWNLOAD EXTENSION
                            </button>
                        </div>
                    </div>

                    <div className={styles.extensionVisual}>
                        <motion.div
                            className={styles.mockExtensionPopup}
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className={styles.popupHeader}>
                                <div className={styles.popupBrand}>
                                    <div className={styles.popupLogo}>⚡</div>
                                    <div className={styles.popupTitle}>VIBE TRACKER</div>
                                </div>
                            </div>
                            <div className={styles.popupBody}>
                                <div className={`${styles.popupCard} ${styles.primary}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 800 }}>THIS MONTH</span>
                                        <span style={{ fontWeight: 800 }}>💸</span>
                                    </div>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 900, display: 'block' }}>$342.50</span>
                                </div>

                                <div className={styles.popupCard}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '30px', height: '30px', background: '#E5E7EB', borderRadius: '50%', border: '2px solid #000' }} />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Amazon</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Headphones</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', fontWeight: 800 }}>-$298</div>
                                    </div>
                                </div>

                                <div className={styles.popupBtn}>
                                    + ADD EXPENSE
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* FINAL CTA */}
            < section className={styles.finalCta} >
                <div className={styles.ctaContent}>
                    <h2 className={styles.finalTitle}>READY TO FIX YOUR FINANCES?</h2>
                    <Link to="/signup" className={styles.finalBtn}>
                        CREATE FREE ACCOUNT <Star fill="currentColor" />
                    </Link>
                </div>
            </section >

            {/* FOOTER */}
            < footer className={styles.nav} style={{ position: 'relative', borderTop: '3px solid #000', borderBottom: 'none' }}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>⚡</div>
                    <span>VIBE TRACKER</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontWeight: 800 }}>
                    <Globe size={20} />
                    <span>Built by Hassan Baig</span>
                </div>
            </footer >
        </div >
    );
};

export default LandingPage;
