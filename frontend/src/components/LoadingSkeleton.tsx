// Loading Skeleton Components - Cashly Premium
// Provides visual placeholders while content is loading with Midnight Coral styling

import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingSkeleton.module.css';

// Base skeleton with shimmer animation
export const Skeleton = ({
    width = '100%',
    height = '20px',
    borderRadius = '12px',
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

// Stat card skeleton
export const StatSkeleton = ({ height = '120px', width = '100%' }: { height?: string; width?: string }) => (
    <div className={styles.statSkeleton}>
        <Skeleton width="100px" height="20px" />
        <Skeleton width={width} height={height} className="mt-4" />
    </div>
);

// Transaction row skeleton
export const TransactionSkeleton = () => (
    <div className={styles.transactionSkeleton}>
        <Skeleton width="40px" height="40px" borderRadius="12px" />
        <div className={styles.txDetails}>
            <Skeleton width="150px" height="16px" />
            <Skeleton width="80px" height="12px" />
        </div>
        <Skeleton width="70px" height="24px" borderRadius="8px" />
    </div>
);

// Table/List skeleton
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className={styles.tableSkeleton}>
        {Array.from({ length: rows }).map((_, i) => (
            <TransactionSkeleton key={i} />
        ))}
    </div>
);

// Chart skeleton
export const ChartSkeleton = ({ height = "380px" }: { height?: string }) => (
    <div className={styles.chartSkeleton} style={{ minHeight: height }}>
        <div className="flex justify-between items-start mb-auto">
            <div className="space-y-2">
                <Skeleton width="180px" height="24px" />
                <Skeleton width="120px" height="14px" />
            </div>
            <div className="flex gap-4">
                <Skeleton width="60px" height="14px" />
                <Skeleton width="60px" height="14px" />
            </div>
        </div>
        <div className={styles.chartBars}>
            {[60, 85, 45, 90, 75, 80, 55, 70].map((h, i) => (
                <motion.div
                    key={i}
                    className={styles.chartBar}
                    style={{ height: `${h}%` }}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${h}%`, opacity: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                />
            ))}
        </div>
        <div className={styles.chartLabels}>
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} width="40px" height="12px" />
            ))}
        </div>
    </div>
);

// Header skeleton for pages
export const HeaderSkeleton = ({ hasDateControls = true }: { hasDateControls?: boolean }) => (
    <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
            <Skeleton width="48px" height="48px" borderRadius="16px" />
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <Skeleton width="200px" height="32px" />
                    <Skeleton width="70px" height="20px" borderRadius="8px" />
                </div>
                <Skeleton width="280px" height="16px" />
            </div>
        </div>
        {hasDateControls && (
            <Skeleton width="300px" height="48px" borderRadius="18px" className="hidden md:block" />
        )}
    </div>
);

// --- Page Specific Skeletons ---

export const ReportsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton />
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className={styles.grid2}>
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
        <div className="space-y-6">
            <Skeleton width="250px" height="28px" />
            <div className={styles.grid4}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={styles.statSkeleton}>
                        <Skeleton width="52px" height="52px" borderRadius="16px" />
                        <Skeleton width="140px" height="20px" />
                        <Skeleton width="100%" height="40px" />
                        <Skeleton width="100%" height="44px" borderRadius="14px" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const SubscriptionsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className="flex justify-between items-center">
            <Skeleton width="220px" height="28px" />
            <Skeleton width="150px" height="44px" borderRadius="16px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton}>
                    <div className={styles.cardHeader}>
                        <Skeleton width="56px" height="56px" borderRadius="18px" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="120px" height="20px" />
                            <Skeleton width="80px" height="14px" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton width="100%" height="12px" />
                        <div className="flex justify-between">
                            <Skeleton width="60px" height="24px" />
                            <Skeleton width="100px" height="24px" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AnalyticsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton />
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className={styles.grid2}>
            <ChartSkeleton height="450px" />
            <div className="space-y-6">
                <ChartSkeleton height="210px" />
                <ChartSkeleton height="210px" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={styles.cardSkeleton}>
                <Skeleton width="200px" height="24px" />
                <ListSkeleton rows={4} />
            </div>
            <div className={styles.cardSkeleton}>
                <Skeleton width="200px" height="24px" />
                <ListSkeleton rows={4} />
            </div>
        </div>
    </div>
);

export const TransactionsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        <div className={styles.cardSkeleton}>
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <Skeleton width="100%" height="48px" borderRadius="16px" className="md:w-[250px]" />
                <div className="flex gap-2">
                    <Skeleton width="100px" height="40px" borderRadius="12px" />
                    <Skeleton width="100px" height="40px" borderRadius="12px" />
                </div>
            </div>
            <ListSkeleton rows={8} />
        </div>
    </div>
);

export const ActivitySkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton />
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className={styles.grid2}>
            <div className="space-y-6">
                <div className={styles.cardSkeleton}>
                    <Skeleton width="180px" height="24px" />
                    <div className="flex gap-4 mt-4">
                        <Skeleton width="120px" height="60px" borderRadius="16px" />
                        <Skeleton width="120px" height="60px" borderRadius="16px" />
                        <Skeleton width="120px" height="60px" borderRadius="16px" />
                    </div>
                </div>
                <div className={styles.cardSkeleton}>
                    <div className="flex justify-between mb-4">
                        <Skeleton width="200px" height="24px" />
                        <Skeleton width="100px" height="20px" />
                    </div>
                    <ListSkeleton rows={6} />
                </div>
            </div>
            <div className="space-y-6">
                <ChartSkeleton height="300px" />
                <div className={styles.cardSkeleton}>
                    <Skeleton width="150px" height="24px" />
                    <div className="space-y-4 mt-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton width="44px" height="44px" borderRadius="12px" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton width="100%" height="14px" />
                                    <Skeleton width="60%" height="10px" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const MoneyTwinSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
                <Skeleton width="80px" height="80px" borderRadius="50%" />
                <div className="space-y-2">
                    <Skeleton width="180px" height="32px" />
                    <Skeleton width="250px" height="16px" />
                </div>
            </div>
            <Skeleton width="180px" height="48px" borderRadius="18px" />
        </div>
        <div className={styles.grid4}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="120px" height="48px" borderRadius="16px" />
            ))}
        </div>
        <div className={styles.cardSkeleton}>
            <Skeleton width="220px" height="28px" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.statSkeleton}>
                        <div className="flex justify-between">
                            <Skeleton width="80px" height="20px" />
                            <Skeleton width="60px" height="20px" borderRadius="8px" />
                        </div>
                        <Skeleton width="100%" height="24px" className="mt-4" />
                        <Skeleton width="80%" height="24px" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const ExpenseDetailsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <Skeleton width="40px" height="40px" borderRadius="12px" />
            <Skeleton width="200px" height="32px" />
            <div className="flex gap-4">
                <Skeleton width="40px" height="40px" borderRadius="12px" />
                <Skeleton width="80px" height="40px" borderRadius="12px" />
            </div>
        </div>
        <div className={styles.statsRow}>
            <div className={styles.statSkeleton} style={{ flex: 2 }}>
                <Skeleton width="100px" height="20px" />
                <Skeleton width="180px" height="36px" className="mt-2" />
                <Skeleton width="100%" height="8px" borderRadius="4px" className="mt-4" />
            </div>
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <ChartSkeleton height="250px" />
        <div className={styles.grid2}>
            <div className={styles.cardSkeleton}>
                <Skeleton width="150px" height="24px" className="mb-6" />
                <ListSkeleton rows={5} />
            </div>
            <div className={styles.cardSkeleton}>
                <Skeleton width="150px" height="24px" className="mb-6" />
                <ListSkeleton rows={5} />
            </div>
        </div>
    </div>
);

export const BillRemindersSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        <div className={styles.statsRow}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className={styles.cardSkeleton}>
            <Skeleton width="200px" height="28px" className="mb-6" />
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border-2 border-slate-50 rounded-2xl">
                        <div className="flex gap-4 items-center">
                            <Skeleton width="48px" height="48px" borderRadius="16px" />
                            <div className="space-y-2">
                                <Skeleton width="150px" height="20px" />
                                <Skeleton width="100px" height="14px" />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="text-right space-y-2">
                                <Skeleton width="80px" height="20px" />
                                <Skeleton width="60px" height="12px" />
                            </div>
                            <Skeleton width="40px" height="40px" borderRadius="12px" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <div className="space-y-2">
                <Skeleton width="180px" height="28px" />
                <Skeleton width="120px" height="16px" />
            </div>
            <div className="flex gap-4">
                <Skeleton width="48px" height="48px" borderRadius="16px" />
                <Skeleton width="120px" height="48px" borderRadius="16px" />
            </div>
        </div>
        <div className={styles.grid3}>
            <StatSkeleton height="150px" />
            <StatSkeleton height="150px" />
            <StatSkeleton height="150px" />
        </div>
        <div className={styles.grid2}>
            <ChartSkeleton height="350px" />
            <div className="space-y-6">
                <div className={styles.cardSkeleton}>
                    <Skeleton width="150px" height="24px" className="mb-6" />
                    <ListSkeleton rows={5} />
                </div>
                <div className={styles.cardSkeleton}>
                    <Skeleton width="150px" height="24px" className="mb-6" />
                    <div className="flex gap-4">
                        <Skeleton width="80px" height="80px" borderRadius="20px" />
                        <Skeleton width="80px" height="80px" borderRadius="20px" />
                        <Skeleton width="80px" height="80px" borderRadius="20px" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const BudgetsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        <div className={styles.grid3}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className={styles.grid2}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton}>
                    <div className="flex justify-between mb-6">
                        <div className="flex gap-4">
                            <Skeleton width="48px" height="48px" borderRadius="16px" />
                            <div className="space-y-2">
                                <Skeleton width="120px" height="20px" />
                                <Skeleton width="80px" height="14px" />
                            </div>
                        </div>
                        <Skeleton width="24px" height="24px" borderRadius="6px" />
                    </div>
                    <Skeleton width="100%" height="12px" borderRadius="6px" className="mb-4" />
                    <div className="flex justify-between">
                        <Skeleton width="60px" height="16px" />
                        <Skeleton width="60px" height="16px" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const CardsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <div className="space-y-2">
                <Skeleton width="220px" height="32px" />
                <Skeleton width="150px" height="16px" />
            </div>
            <Skeleton width="120px" height="48px" borderRadius="16px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton} style={{ height: '220px', borderRadius: '32px' }}>
                    <div className="flex justify-between mb-8">
                        <Skeleton width="50px" height="30px" borderRadius="6px" />
                        <Skeleton width="40px" height="40px" borderRadius="80px" />
                    </div>
                    <Skeleton width="180px" height="24px" className="mb-8" />
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <Skeleton width="100px" height="12px" />
                            <Skeleton width="140px" height="20px" />
                        </div>
                        <Skeleton width="60px" height="36px" borderRadius="8px" />
                    </div>
                </div>
            ))}
        </div>
        <div className={styles.cardSkeleton} style={{ marginTop: '40px' }}>
            <Skeleton width="200px" height="24px" className="mb-8" />
            <ListSkeleton rows={5} />
        </div>
    </div>
);

export const GoalsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <div className={styles.pageHeader}>
            <div className="space-y-2">
                <Skeleton width="200px" height="32px" />
                <Skeleton width="180px" height="16px" />
            </div>
            <div className="flex gap-4">
                <Skeleton width="80px" height="48px" borderRadius="16px" />
                <Skeleton width="140px" height="48px" borderRadius="16px" />
            </div>
        </div>
        <div className={styles.grid4}>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton} style={{ borderRadius: '40px' }}>
                    <div className="flex justify-between mb-8">
                        <Skeleton width="60px" height="60px" borderRadius="20px" />
                        <div className="flex gap-2">
                            <Skeleton width="32px" height="32px" borderRadius="8px" />
                            <Skeleton width="32px" height="32px" borderRadius="8px" />
                        </div>
                    </div>
                    <Skeleton width="180px" height="24px" className="mb-4" />
                    <Skeleton width="120px" height="14px" className="mb-10" />
                    <div className="flex gap-8 items-center">
                        <Skeleton width="80px" height="80px" borderRadius="40px" />
                        <div className="grow space-y-4">
                            <div className="flex justify-between">
                                <Skeleton width="40px" height="12px" />
                                <Skeleton width="60px" height="12px" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton width="40px" height="12px" />
                                <Skeleton width="60px" height="12px" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const InsightsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        <div className={styles.grid3}>
            <StatSkeleton height="180px" />
            <StatSkeleton height="180px" />
            <StatSkeleton height="180px" />
        </div>
        <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton} style={{ borderRadius: '32px' }}>
                    <div className="flex gap-6">
                        <Skeleton width="64px" height="64px" borderRadius="20px" />
                        <div className="grow space-y-3">
                            <div className="flex justify-between">
                                <Skeleton width="200px" height="24px" />
                                <Skeleton width="100px" height="24px" borderRadius="12px" />
                            </div>
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="60%" height="16px" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AccountsSkeleton = () => (
    <div className={styles.pageSkeleton}>
        <HeaderSkeleton hasDateControls={false} />
        {/* Net Worth Summary Card */}
        <div className={styles.cardSkeleton} style={{ padding: '32px' }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4 items-center">
                    <Skeleton width="56px" height="56px" borderRadius="16px" />
                    <div className="space-y-2">
                        <Skeleton width="120px" height="14px" />
                        <Skeleton width="200px" height="32px" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="flex gap-3 items-center">
                    <Skeleton width="32px" height="32px" borderRadius="8px" />
                    <div className="space-y-2">
                        <Skeleton width="60px" height="12px" />
                        <Skeleton width="100px" height="16px" />
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <Skeleton width="32px" height="32px" borderRadius="8px" />
                    <div className="space-y-2">
                        <Skeleton width="60px" height="12px" />
                        <Skeleton width="100px" height="16px" />
                    </div>
                </div>
            </div>
        </div>
        {/* Accounts Grid */}
        <div className={styles.grid3}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton} style={{ padding: '24px' }}>
                    <div className="flex gap-4 items-start mb-6">
                        <Skeleton width="48px" height="48px" borderRadius="14px" />
                        <div className="grow space-y-2">
                            <Skeleton width="140px" height="18px" />
                            <Skeleton width="100px" height="12px" />
                        </div>
                    </div>
                    <div className="space-y-2 mb-6">
                        <Skeleton width="80px" height="12px" />
                        <Skeleton width="160px" height="24px" />
                    </div>
                    <div className="flex justify-between pt-4 border-t border-slate-50">
                        <Skeleton width="70px" height="12px" />
                        <Skeleton width="100px" height="12px" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Spinner for inline loading
export const Spinner = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <motion.div
        style={{
            width: size,
            height: size,
            border: `2.5px solid ${color}20`,
            borderTop: `2.5px solid ${color}`,
            borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
);

export default {
    Skeleton,
    StatSkeleton,
    TransactionSkeleton,
    ListSkeleton,
    ChartSkeleton,
    HeaderSkeleton,
    ReportsSkeleton,
    SubscriptionsSkeleton,
    AnalyticsSkeleton,
    TransactionsSkeleton,
    ActivitySkeleton,
    MoneyTwinSkeleton,
    ExpenseDetailsSkeleton,
    BillRemindersSkeleton,
    DashboardSkeleton,
    BudgetsSkeleton,
    CardsSkeleton,
    GoalsSkeleton,
    InsightsSkeleton,
    AccountsSkeleton,
    Spinner,
};
