import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Send, Github, Linkedin, Globe, CheckCircle } from 'lucide-react';
import styles from './LegalPage.module.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In real app, this would send to backend
        console.log('Contact form:', formData);
        setSubmitted(true);
    };

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
                    <MessageCircle size={48} />
                    <h1>Contact Us</h1>
                    <p>We'd love to hear from you! Get in touch with our team.</p>
                </div>

                <div className={styles.contactGrid}>
                    <div className={styles.contactInfo}>
                        <h3>Get in Touch</h3>

                        <div className={styles.contactItem}>
                            <Mail size={24} />
                            <div>
                                <strong>Email</strong>
                                <p>support@vibetracker.app</p>
                            </div>
                        </div>

                        <div className={styles.contactItem}>
                            <MessageCircle size={24} />
                            <div>
                                <strong>Response Time</strong>
                                <p>Within 24-48 hours</p>
                            </div>
                        </div>

                        <div className={styles.socialLinks}>
                            <h4>Connect with the Developer</h4>
                            <div className={styles.socialIcons}>
                                <a href="https://github.com/baigcoder" target="_blank" rel="noopener noreferrer">
                                    <Github size={24} />
                                </a>
                                <a href="https://www.linkedin.com/in/hassan-baig-672778111/" target="_blank" rel="noopener noreferrer">
                                    <Linkedin size={24} />
                                </a>
                                <a href="https://hassan-baigo-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
                                    <Globe size={24} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className={styles.contactForm}>
                        {submitted ? (
                            <motion.div
                                className={styles.successMessage}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                <CheckCircle size={48} />
                                <h3>Message Sent! 🎉</h3>
                                <p>Thank you for reaching out. We'll get back to you soon!</p>
                                <button onClick={() => setSubmitted(false)}>Send Another</button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Subject</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a topic...</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="bug">Bug Report</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="account">Account Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Message</label>
                                    <textarea
                                        placeholder="How can we help you?"
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>

                                <button type="submit" className={styles.submitBtn}>
                                    <Send size={18} />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <p>© 2024 Vibe Tracker. All rights reserved.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default ContactPage;
