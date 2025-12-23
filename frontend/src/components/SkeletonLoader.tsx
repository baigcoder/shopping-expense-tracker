// Skeleton Loader Components - For loading states
import styles from './SkeletonLoader.module.css';

export const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonFooter} />
    </div>
);

export const SkeletonTransaction = () => (
    <div className={styles.skeletonTransaction}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonInfo}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
        </div>
        <div className={styles.skeletonAmount} />
    </div>
);

export const SkeletonChart = () => (
    <div className={styles.skeletonChart}>
        <div className={styles.skeletonChartHeader} />
        <div className={styles.skeletonChartBars}>
            <div className={styles.skeletonBar} style={{ height: '60%' }} />
            <div className={styles.skeletonBar} style={{ height: '80%' }} />
            <div className={styles.skeletonBar} style={{ height: '40%' }} />
            <div className={styles.skeletonBar} style={{ height: '90%' }} />
            <div className={styles.skeletonBar} style={{ height: '70%' }} />
        </div>
    </div>
);

export const SkeletonList = ({ count = 5 }: { count?: number }) => (
    <div className={styles.skeletonList}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonTransaction key={i} />
        ))}
    </div>
);

export const PulseLoader = ({ message = 'Loading...' }: { message?: string }) => (
    <div className={styles.pulseLoader}>
        <div className={styles.pulse} />
        <span>{message}</span>
    </div>
);

export default {
    SkeletonCard,
    SkeletonTransaction,
    SkeletonChart,
    SkeletonList,
    PulseLoader
};
