import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertOctagon } from 'lucide-react';
import styles from './StatusOverlay.module.css';

interface StatusOverlayProps {
    status: 'success' | 'error' | null;
    message: string;
    onClose?: () => void;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({ status, message, onClose }) => {
    return (
        <AnimatePresence>
            {status && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={styles.overlay}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={styles.card}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className={`${styles.iconWrapper} ${status === 'success' ? styles.successIcon : styles.errorIcon}`}
                        >
                            {status === 'success' ? (
                                <Check size={40} strokeWidth={3} />
                            ) : (
                                <X size={40} strokeWidth={3} />
                            )}
                        </motion.div>

                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={styles.title}
                            >
                                {status === 'success' ? 'Success!' : 'Error'}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={styles.message}
                            >
                                {message}
                            </motion.p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StatusOverlay;
