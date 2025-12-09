// Loading Skeleton Components
// Provides visual placeholders while content is loading

import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingSkeleton.module.css';

// Base skeleton with shimmer animation
export const Skeleton = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    className = '',
}: {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}) => (
    <div
        className={`${styles.skeleton} ${className}`}
        style={{ width, height, borderRadius }}
    />
);

// Card skeleton for dashboard cards
export const CardSkeleton = () => (
    <div className={styles.cardSkeleton}>
        <div className={styles.cardHeader}>
            <Skeleton width="40px" height="40px" borderRadius="10px" />
            <div className={styles.cardTitleArea}>
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="12px" />
            </div>
        </div>
        <Skeleton width="60%" height="32px" />
        <Skeleton width="100%" height="8px" />
    </div>
);

// Stat card skeleton
export const StatSkeleton = () => (
    <div className={styles.statSkeleton}>
        <Skeleton width="32px" height="32px" borderRadius="8px" />
        <Skeleton width="80px" height="28px" />
        <Skeleton width="60px" height="14px" />
    </div>
);

// Transaction row skeleton
export const TransactionSkeleton = () => (
    <div className={styles.transactionSkeleton}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div className={styles.txDetails}>
            <Skeleton width="150px" height="16px" />
            <Skeleton width="80px" height="12px" />
        </div>
        <Skeleton width="70px" height="20px" />
    </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className={styles.tableSkeleton}>
        {Array.from({ length: rows }).map((_, i) => (
            <TransactionSkeleton key={i} />
        ))}
    </div>
);

// Chart skeleton
export const ChartSkeleton = () => (
    <div className={styles.chartSkeleton}>
        <div className={styles.chartBars}>
            {[70, 85, 60, 90, 75, 80].map((height, i) => (
                <motion.div
                    key={i}
                    className={styles.chartBar}
                    style={{ height: `${height}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1 }}
                />
            ))}
        </div>
        <div className={styles.chartLabels}>
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} width="30px" height="12px" />
            ))}
        </div>
    </div>
);

// Full page loading
export const PageSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <Skeleton width="200px" height="36px" />
            <Skeleton width="120px" height="40px" borderRadius="10px" />
        </div>
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <ChartSkeleton />
        <TableSkeleton rows={5} />
    </div>
);

// Budget card skeleton
export const BudgetSkeleton = () => (
    <div className={styles.budgetSkeleton}>
        <div className={styles.budgetHeader}>
            <Skeleton width="48px" height="48px" borderRadius="12px" />
            <Skeleton width="100px" height="20px" />
        </div>
        <div className={styles.budgetAmount}>
            <Skeleton width="80px" height="28px" />
            <Skeleton width="60px" height="14px" />
        </div>
        <Skeleton width="100%" height="20px" borderRadius="10px" />
        <div className={styles.budgetProgress}>
            <Skeleton width="40px" height="12px" />
            <Skeleton width="70px" height="12px" />
        </div>
    </div>
);

// Spinner for inline loading
export const Spinner = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <motion.div
        style={{
            width: size,
            height: size,
            border: `3px solid ${color}20`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
);

export default {
    Skeleton,
    CardSkeleton,
    StatSkeleton,
    TransactionSkeleton,
    TableSkeleton,
    ChartSkeleton,
    PageSkeleton,
    BudgetSkeleton,
    Spinner,
};
