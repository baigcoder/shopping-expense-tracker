import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, FileText, Zap } from 'lucide-react'; // Import icons for animation
import { useState, useEffect } from 'react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: number;
    color?: 'red' | 'emerald' | 'amber' | 'blue';
    isAutoFeature?: boolean; // New prop to trigger special animation
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0, color = 'red', isAutoFeature }: FeatureCardProps) => {
    const [showAuto, setShowAuto] = useState(false);

    // Specific animation logic for the "Zero Manual Entry" card
    useEffect(() => {
        if (isAutoFeature) {
            const interval = setInterval(() => {
                setShowAuto(prev => !prev);
            }, 2500); // Toggle every 2.5s
            return () => clearInterval(interval);
        }
    }, [isAutoFeature]);

    return (
        <motion.div
            className={`${styles.card} ${styles[color]}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay }}
        >
            <div className={styles.iconWrapper}>
                {isAutoFeature ? (
                    <div className={styles.manualToAutoAnim}>
                        <AnimatePresence mode="wait">
                            {showAuto ? (
                                <motion.div
                                    key="auto"
                                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                    transition={{ duration: 0.4 }}
                                    className={styles.animIcon}
                                >
                                    <Zap size={28} strokeWidth={2} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="manual"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.4 }}
                                    className={styles.animIcon}
                                >
                                    <FileText size={28} strokeWidth={2} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Icon size={28} strokeWidth={2} />
                )}
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </motion.div>
    );
};

export default FeatureCard;
