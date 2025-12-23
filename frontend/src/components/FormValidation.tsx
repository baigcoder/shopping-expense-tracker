// Form Validation Component - Reusable validation feedback
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './FormValidation.module.css';

interface FormValidationProps {
    error?: string | null;
    success?: string | null;
    touched?: boolean;
}

const FormValidation = ({ error, success, touched = false }: FormValidationProps) => {
    if (!touched) return null;

    return (
        <AnimatePresence mode="wait">
            {error && (
                <motion.div
                    key="error"
                    className={`${styles.message} ${styles.error}`}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <AlertCircle size={16} strokeWidth={3} />
                    <span>{error}</span>
                </motion.div>
            )}
            {success && !error && (
                <motion.div
                    key="success"
                    className={`${styles.message} ${styles.success}`}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <CheckCircle2 size={16} strokeWidth={3} />
                    <span>{success}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FormValidation;
