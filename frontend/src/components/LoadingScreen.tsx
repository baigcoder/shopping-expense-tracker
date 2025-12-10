// Loading Screen Component - Compact Gen-Z Vibe ⚡
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationSound } from '../services/notificationSoundService';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {

    useEffect(() => {
        // Play a subtle pop sound on mount
        const timer = setTimeout(() => {
            notificationSound.playPop();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.loaderCard}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className={styles.spinner}></div>

                <div style={{ textAlign: 'center' }}>
                    <h2 className={styles.loadingText}>Loading Vibes...</h2>
                    <p className={styles.subText}>Hold tight, we're crunching the numbers.</p>
                </div>

                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}></div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
