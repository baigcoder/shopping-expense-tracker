
import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import styles from './Stats.module.css';

const AnimatedCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { damping: 50, stiffness: 400 });
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [isInView, value, motionValue]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.floor(latest).toLocaleString() + suffix;
            }
        });
    }, [springValue, suffix]);

    return <span ref={ref} className={styles.number}>0{suffix}</span>;
};

const Stats = () => {
    return (
        <section className={styles.statsSection}>
            <div className={styles.glow} />
            <div className={styles.container}>
                <h2 className={styles.title}>Trusted by Thousands of Smart Shoppers</h2>

                <div className={styles.grid}>
                    <motion.div
                        className={styles.statItem}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0 }}
                    >
                        <AnimatedCounter value={10000} suffix="+" />
                        <span className={styles.label}>Active Users</span>
                    </motion.div>

                    <motion.div
                        className={styles.statItem}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatedCounter value={5} suffix="M+" />
                        <span className={styles.label}>Transactions Tracked</span>
                    </motion.div>

                    <motion.div
                        className={styles.statItem}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <AnimatedCounter value={250} suffix="K+" />
                        <span className={styles.label}>Money Saved</span>
                    </motion.div>

                    <motion.div
                        className={styles.statItem}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <AnimatedCounter value={99} suffix=".9%" />
                        <span className={styles.label}>Accuracy Rate</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Stats;
