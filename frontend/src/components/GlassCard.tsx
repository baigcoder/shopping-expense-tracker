import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './GlassCard.module.css';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard = ({ children, className = '', hoverEffect = true, ...props }: GlassCardProps) => {
    return (
        <motion.div
            className={`${styles.card} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : {}}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
