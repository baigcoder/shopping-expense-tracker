import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle, Play, ShoppingBag, CreditCard, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import styles from './Hero.module.css';

const Hero = () => {
    // 3D Tilt Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((event.clientX - centerX) / 8);
        y.set((event.clientY - centerY) / 8);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <section className={styles.heroSection} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

            <div className={styles.container}>
                {/* Text Content */}
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className={styles.badge}>
                        <Sparkles size={16} />
                        <span>100% Free • All Features Included</span>
                    </div>

                    <h1 className={styles.title}>
                        Track Money <br />
                        <span className={styles.gradientText}>Without Thinking</span>
                    </h1>

                    <p className={styles.subtitle}>
                        Analyze your spending habits and start saving without lifting a finger.
                        Zero manual entry. Infinite peace of mind.
                    </p>

                    <div className={styles.actions}>
                        <Link to="/signup" className={styles.primaryBtn}>
                            Start Free Tracking
                        </Link>
                        <a href="#demo" className={styles.secondaryBtn}>
                            <Play size={18} fill="currentColor" />
                            Watch Demo
                        </a>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem', color: '#64748B', fontSize: '0.875rem', fontWeight: 600, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={18} color="#DC2626" /> No hidden fees
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={18} color="#DC2626" /> Unlimited history
                        </div>
                    </div>
                </motion.div>

                {/* 3D Dashboard Mockup */}
                <div className={styles.mockupContainer} style={{ perspective: 1500 }}>

                    {/* Floating Bubble 1 - Netflix Live */}
                    <motion.div className={`${styles.floatingElement} ${styles.float1}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        <div className={styles.liveDot} style={{ marginRight: '0.5rem' }} />
                        <div className={styles.dot} style={{ background: '#DC2626', display: 'none' }} />
                        <span>Netflix: -$15.99</span>
                    </motion.div>

                    {/* Floating Bubble 2 - Subscription Live */}
                    <motion.div className={`${styles.floatingElement} ${styles.float2}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <div className={styles.liveDot} style={{ marginRight: '0.5rem' }} />
                        <span>Adobe: Subscription Due</span>
                    </motion.div>

                    <motion.div
                        className={styles.mockup}
                        style={{ rotateX, rotateY }}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1.2, type: "spring" }}
                    >
                        <div className={styles.mockupHeader}>
                            <div className={`${styles.dot} ${styles.dotRed}`} />
                            <div className={`${styles.dot} ${styles.dotYellow}`} />
                            <div className={`${styles.dot} ${styles.dotGreen}`} />
                            <div className={styles.addressBar}>finzen.app/dashboard</div>
                            <div className={styles.liveBadge}>
                                <div className={styles.liveDot} /> LIVE
                            </div>
                        </div>

                        <div className={styles.mockupBody}>
                            <div className={styles.mockSidebar}>
                                <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
                                    <PieChart size={18} /> Dashboard
                                </div>
                                <div className={styles.sidebarItem}>
                                    <BarChart3 size={18} /> Analytics
                                </div>
                                <div className={styles.sidebarItem}>
                                    <ShoppingBag size={18} /> Transactions
                                </div>
                                <div className={styles.sidebarItem}>
                                    <CreditCard size={18} /> Cards
                                </div>
                            </div>

                            <div className={styles.mockMain}>
                                {/* Top Stats Row */}
                                <div className={styles.statsRow}>
                                    <div className={styles.heroStatCard}>
                                        <div>
                                            <div className={styles.statLabel}>Total Spend</div>
                                            <div className={styles.statValue}>$4,250</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>This Month</div>
                                        </div>
                                    </div>
                                    <div className={styles.billReminder}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Sparkles size={16} color="#DC2626" />
                                                <span style={{ fontWeight: 600, color: '#1E293B' }}>Upcoming</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Spotify Premium</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>$10.99</div>
                                            <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.25rem' }}>Due Tomorrow</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Savings Bubble */}
                                <div className={styles.savingsBubble}>
                                    <div style={{ background: '#ECFDF5', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                                        <TrendingUp size={16} color="#10B981" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Savings</div>
                                        <div className={styles.savingsText}>+$124.50</div>
                                    </div>
                                </div>

                                {/* Bottom Decorative Graph */}
                                <div className={styles.graphSection}>
                                    <svg viewBox="0 0 400 120" className={styles.chartArea} preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.1" />
                                                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <motion.path
                                            d="M0,100 C100,80 150,40 200,60 C250,80 300,50 400,90 V120 H0 Z"
                                            fill="url(#chartGradient)"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 1 }}
                                        />
                                        <motion.path
                                            d="M0,100 C100,80 150,40 200,60 C250,80 300,50 400,90"
                                            fill="none"
                                            stroke="#DC2626"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
