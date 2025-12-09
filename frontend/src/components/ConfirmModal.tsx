/* Custom Confirm Modal - Neo-Brutalist Style */
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}: ConfirmModalProps) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const typeColors = {
        danger: { bg: '#FF6B6B', icon: '💀' },
        warning: { bg: '#FFD93D', icon: '🥺' },
        info: { bg: '#4D96FF', icon: '🤔' }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className={styles.modalContainer}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <div className={styles.modal}>
                            {/* Close Button */}
                            <button className={styles.closeBtn} onClick={onClose}>
                                <X size={20} />
                            </button>

                            {/* Icon */}
                            <div
                                className={styles.iconContainer}
                                style={{ background: typeColors[type].bg }}
                            >
                                <span className={styles.emoji}>{typeColors[type].icon}</span>
                            </div>

                            {/* Content */}
                            <h2 className={styles.title}>{title}</h2>
                            <p className={styles.message}>{message}</p>

                            {/* Actions */}
                            <div className={styles.actions}>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={onClose}
                                >
                                    {cancelText}
                                </button>
                                <button
                                    className={`${styles.confirmBtn} ${type === 'danger' ? styles.danger : ''}`}
                                    onClick={handleConfirm}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
