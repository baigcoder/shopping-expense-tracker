// Loading Screen Component - Neo-Brutalist Style
import { motion } from 'framer-motion';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {
    return (
        <div className={styles.container}>
            {/* Decorative Background Shapes */}
            <motion.div
                className={styles.shape1}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className={styles.shape2}
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
                className={styles.shape3}
                animate={{ x: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.content}
            >
                {/* Logo Icon */}
                <motion.div
                    className={styles.logoContainer}
                    animate={{
                        rotate: [0, -5, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <img src="/logo.png" alt="Vibe Tracker" className={styles.logo} />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={styles.title}
                >
                    Vibe Tracker
                </motion.h1>

                {/* Loading Bar Container */}
                <div className={styles.loadingBarContainer}>
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className={styles.loadingBar}
                    />
                </div>

                {/* Loading Text */}
                <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={styles.loadingText}
                >
                    Getting your vibes ready... ⚡
                </motion.p>

                {/* Bouncing Dots */}
                <div className={styles.dotsContainer}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className={styles.dot}
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
