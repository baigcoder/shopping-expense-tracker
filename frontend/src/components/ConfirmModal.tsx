/* Custom Confirm Modal - Premium SaaS Industrial Style */
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, CheckCircle2 } from 'lucide-react';

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
    };


    const typeColors = {
        danger: { bg: '#FEE2E2', color: '#EF4444' },
        warning: { bg: '#FEF3C7', color: '#F59E0B' },
        info: { bg: '#DBEAFE', color: '#3B82F6' }
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
                                style={{
                                    background: typeColors[type].bg,
                                    color: typeColors[type].color,
                                    border: 'none'
                                }}
                            >
                                {type === 'danger' && <AlertTriangle size={32} />}
                                {type === 'warning' && <AlertTriangle size={32} />}
                                {type === 'info' && <Info size={32} />}
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
