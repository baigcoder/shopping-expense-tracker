import React, { useRef } from 'react'; // Added React imports
import { motion, useScroll, useTransform } from 'framer-motion';
import { Chrome, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import styles from './HowItWorks.module.css';

const steps = [
    {
        icon: Chrome,
        title: "Install Extension",
        desc: "Add to Chrome in one click. It sits quietly in your browser toolbar."
    },
    {
        icon: CreditCard,
        title: "Shop Normally",
        desc: "Browse your favorite stores like Amazon or eBay. We auto-detect checkout."
    },
    {
        icon: Sparkles,
        title: "Watch the Magic",
        desc: "Transactions appear instantly in your dashboard. Categories assigned automatically."
    }
];

const HowItWorks = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start center", "end center"]
    });

    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <section className={styles.section} id="how-it-works" ref={ref}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    How It Works
                </motion.h2>
                <p className={styles.subtitle}>Start tracking your automated financial life in 3 simple steps.</p>

                <div className={styles.timeline}>
                    {steps.map((step, index) => (
                        <StepCard
                            key={index}
                            step={step}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const StepCard = ({ step, index }: { step: any, index: number }) => {
    return (
        <motion.div
            className={styles.step}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
        >
            <motion.div
                className={styles.iconWrapper}
                whileHover={{ scale: 1.1, rotate: 5, backgroundColor: "#FEF2F2", borderColor: "#DC2626" }}
                animate={{
                    boxShadow: ["0px 0px 0px rgba(220,38,38,0)", "0px 0px 15px rgba(220,38,38,0.2)", "0px 0px 0px rgba(220,38,38,0)"]
                }}
                transition={{
                    boxShadow: {
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 1
                    }
                }}
            >
                <step.icon size={40} color={index === 1 ? "#DC2626" : "#64748B"} style={{ transition: 'color 0.3s' }} />
            </motion.div>
            <div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
            </div>
        </motion.div>
    );
}

export default HowItWorks;
