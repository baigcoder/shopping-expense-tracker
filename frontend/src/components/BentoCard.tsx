import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import styles from './BentoCard.module.css';

interface BentoCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    variant?: 'default' | 'alt' | 'transparent' | 'dark';
    className?: string;
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const BentoCard = ({
    children,
    variant = 'default',
    className = '',
    title,
    actionLabel,
    onAction,
    ...props
}: BentoCardProps) => {
    return (
        <motion.div
            className={`${styles.card} ${styles[variant]} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            {...props}
        >
            {title && (
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    {actionLabel && (
                        <button className={styles.action} onClick={onAction}>
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
            {children}
        </motion.div>
    );
};

export default BentoCard;
