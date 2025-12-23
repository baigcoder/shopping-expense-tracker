
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, Github, Send } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.topSection}>
                    {/* Brand Column */}
                    <div className={styles.brandCol}>
                        <Link to="/" className={styles.logo}>
                            <span style={{ color: '#DC2626', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>FIN</span>
                            <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>ZEN</span>
                        </Link>
                        <p className={styles.description}>
                            The smart expense tracker that works in the background.
                            Master your money without the manual work.
                        </p>
                        <div className={styles.newsletter}>
                            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>
                                Subscribe to our newsletter
                            </p>
                            <div className={styles.inputGroup}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className={styles.input}
                                />
                                <button className={styles.submitBtn}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h4 className={styles.columnTitle}>Product</h4>
                        <ul className={styles.linkList}>
                            <li><a href="#features" className={styles.link}>Features</a></li>
                            <li><a href="#how-it-works" className={styles.link}>How It Works</a></li>
                            <li><Link to="/pricing" className={styles.link}>Pricing</Link></li>
                            <li><a href="#" className={styles.link}>Extension</a></li>
                            <li><a href="#" className={styles.link}>Changelog</a></li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h4 className={styles.columnTitle}>Resources</h4>
                        <ul className={styles.linkList}>
                            <li><a href="#" className={styles.link}>Blog</a></li>
                            <li><a href="#" className={styles.link}>Community</a></li>
                            <li><a href="#" className={styles.link}>Help Center</a></li>
                            <li><a href="#" className={styles.link}>Privacy Guide</a></li>
                            <li><a href="#" className={styles.link}>Status</a></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h4 className={styles.columnTitle}>Company</h4>
                        <ul className={styles.linkList}>
                            <li><a href="#" className={styles.link}>About Us</a></li>
                            <li><a href="#" className={styles.link}>Careers</a></li>
                            <li><a href="#" className={styles.link}>Legal</a></li>
                            <li><a href="#" className={styles.link}>Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bottomSection}>
                    <p className={styles.copyright}>
                        &copy; {new Date().getFullYear()} Finzen. All rights reserved.
                    </p>
                    <div className={styles.socialLinks}>
                        <a href="#" className={styles.socialLink}><Twitter size={20} /></a>
                        <a href="#" className={styles.socialLink}><Instagram size={20} /></a>
                        <a href="#" className={styles.socialLink}><Linkedin size={20} /></a>
                        <a href="#" className={styles.socialLink}><Github size={20} /></a>
                    </div>
                    <div className={styles.bottomLinks}>
                        <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
                        <Link to="/terms" className={styles.link}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
