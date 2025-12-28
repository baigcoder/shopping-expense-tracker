// Shopping Activity Page - Premium Modern SaaS Redesign
// Midnight Coral Theme - 3px Borders & Glassmorphism
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, CreditCard, Clock, Store,
    Globe, Activity, RefreshCw, Zap, ExternalLink,
    Landmark, Smartphone, MonitorPlay, Package,
    ShoppingBag, Tag, CreditCard as CardIcon
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import { cn } from '@/lib/utils';
import styles from './ShoppingActivityPage.module.css';
import { ActivitySkeleton } from '../components/LoadingSkeleton';

interface SiteVisit {
    id: string;
    site_name: string;
    hostname: string;
    url: string;
    category: 'shopping' | 'payment' | 'finance' | 'other';
    visit_count: number;
    last_visited: string;
    first_visited: string;
    favicon?: string;
    iconType?: 'lucide' | 'emoji';
}

const SITE_CATEGORIES: Record<string, { category: 'shopping' | 'payment' | 'finance'; iconComponent: any }> = {
    'amazon': { category: 'shopping', iconComponent: ShoppingBag },
    'daraz': { category: 'shopping', iconComponent: ShoppingBag },
    'aliexpress': { category: 'shopping', iconComponent: Store },
    'ebay': { category: 'shopping', iconComponent: Tag },
    'walmart': { category: 'shopping', iconComponent: ShoppingCart },
    'flipkart': { category: 'shopping', iconComponent: Smartphone },
    'shopify': { category: 'shopping', iconComponent: ShoppingBag },
    'etsy': { category: 'shopping', iconComponent: Store },
    'paypal': { category: 'payment', iconComponent: CreditCard },
    'stripe': { category: 'payment', iconComponent: CreditCard },
    'jazzcash': { category: 'payment', iconComponent: Smartphone },
    'easypaisa': { category: 'payment', iconComponent: Smartphone },
    'paypak': { category: 'payment', iconComponent: CardIcon },
    'bank': { category: 'finance', iconComponent: Landmark },
    'hbl': { category: 'finance', iconComponent: Landmark },
    'meezan': { category: 'finance', iconComponent: Landmark },
    'ubl': { category: 'finance', iconComponent: Landmark },
    'mcb': { category: 'finance', iconComponent: Landmark },
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
};

const ShoppingActivityPage = () => {
    const { user } = useAuthStore();
    const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'shopping' | 'payment' | 'finance'>('all');

    const getSiteCategory = (siteName: string) => {
        const lower = siteName.toLowerCase();
        for (const [key, value] of Object.entries(SITE_CATEGORIES)) {
            if (lower.includes(key)) return { category: value.category, Icon: value.iconComponent };
        }
        return { category: 'other', Icon: Globe };
    };

    const fetchSiteVisits = useCallback(async () => {
        if (!user?.id) return;
        setIsRefreshing(true);

        try {
            const extensionCache = localStorage.getItem('finzen_site_visits');
            if (extensionCache) {
                try {
                    const cachedSites = JSON.parse(extensionCache);
                    const siteArray: SiteVisit[] = Object.values(cachedSites).map((site: any, i) => ({
                        id: `ext-${i}`,
                        site_name: site.siteName,
                        hostname: site.hostname,
                        url: site.url,
                        category: site.category || 'shopping',
                        visit_count: site.visitCount || 1,
                        last_visited: new Date(site.lastVisited).toISOString(),
                        first_visited: new Date(site.firstVisited).toISOString()
                    }));
                    if (siteArray.length > 0) {
                        setSiteVisits(siteArray);
                        setLoading(false);
                        setIsRefreshing(false);
                        return;
                    }
                } catch (e) {
                    console.log('Could not parse extension cache');
                }
            }

            const { data, error } = await supabase
                .from('site_visits')
                .select('*')
                .eq('user_id', user.id)
                .order('last_visited', { ascending: false });

            if (!error && data && data.length > 0) {
                setSiteVisits(data);
            } else {
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('store, description, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (txData) {
                    const siteMap = new Map<string, SiteVisit>();
                    txData.forEach((tx, i) => {
                        const siteName = tx.store || (tx.description?.split(' ')[0]) || 'Unknown';
                        if (siteName && !siteMap.has(siteName.toLowerCase())) {
                            const { category } = getSiteCategory(siteName);
                            siteMap.set(siteName.toLowerCase(), {
                                id: `tx-${i}`,
                                site_name: siteName,
                                hostname: `${siteName.toLowerCase().replace(/\s/g, '')}.com`,
                                url: `https://${siteName.toLowerCase().replace(/\s/g, '')}.com`,
                                category: category as any,
                                visit_count: 1,
                                last_visited: tx.created_at,
                                first_visited: tx.created_at
                            });
                        } else if (siteName) {
                            const existing = siteMap.get(siteName.toLowerCase())!;
                            existing.visit_count++;
                        }
                    });
                    setSiteVisits(Array.from(siteMap.values()));
                }
            }
        } catch (error) {
            console.error('Failed to fetch site visits:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchSiteVisits();
    }, [fetchSiteVisits]);

    useEffect(() => {
        const handleExtensionUpdate = () => fetchSiteVisits();
        const handleLiveSiteVisit = (event: CustomEvent) => {
            const data = event.detail;
            if (!data?.siteName) return;
            setSiteVisits(prev => {
                const existingIdx = prev.findIndex(s => s.hostname.toLowerCase() === data.hostname?.toLowerCase());
                if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        visit_count: updated[existingIdx].visit_count + 1,
                        last_visited: new Date().toISOString()
                    };
                    return updated;
                } else {
                    const { category } = getSiteCategory(data.siteName);
                    return [{
                        id: `live-${Date.now()}`,
                        site_name: data.siteName,
                        hostname: data.hostname || `${data.siteName.toLowerCase()}.com`,
                        url: data.url || `https://${data.hostname || data.siteName.toLowerCase()}`,
                        category: category as any,
                        visit_count: 1,
                        last_visited: new Date().toISOString(),
                        first_visited: new Date().toISOString()
                    }, ...prev];
                }
            });
        };
        window.addEventListener('site-visit-tracked', handleLiveSiteVisit as EventListener);
        window.addEventListener('shopping-site-detected', handleLiveSiteVisit as EventListener);
        window.addEventListener('transactions-synced', handleExtensionUpdate);
        return () => {
            window.removeEventListener('site-visit-tracked', handleLiveSiteVisit as EventListener);
            window.removeEventListener('shopping-site-detected', handleLiveSiteVisit as EventListener);
            window.removeEventListener('transactions-synced', handleExtensionUpdate);
        };
    }, [fetchSiteVisits]);

    const filteredSites = siteVisits.filter(site => activeFilter === 'all' || site.category === activeFilter);
    const stats = {
        totalSites: siteVisits.length,
        shoppingSites: siteVisits.filter(s => s.category === 'shopping').length,
        paymentSites: siteVisits.filter(s => s.category === 'payment').length,
        totalVisits: siteVisits.reduce((sum, s) => sum + s.visit_count, 0)
    };

    const timeAgo = (dateStr: string): string => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <ActivitySkeleton />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* Header */}
                <motion.header className={styles.header} variants={itemVariants}>
                    <div className={styles.headerLeft}>
                        <h1>
                            SyncStream Activity
                            <span className={styles.liveBadge}>
                                <Activity size={12} className="animate-pulse" />
                                LIVE PULSE
                            </span>
                        </h1>
                        <p>Real-time Extension Telemetry • Automated Analysis</p>
                    </div>
                    <button className={styles.refreshBtn} onClick={fetchSiteVisits} disabled={isRefreshing}>
                        <RefreshCw size={16} className={cn(isRefreshing && styles.spinner)} />
                        {isRefreshing ? 'SYNCING...' : 'SYNC PIPELINE'}
                    </button>
                </motion.header>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <motion.div variants={itemVariants} className={cn(styles.statCard, styles.shopping)}>
                        <div className={styles.statIcon}><ShoppingCart size={20} /></div>
                        <div>
                            <div className={styles.statValue}>{stats.shoppingSites}</div>
                            <div className={styles.statLabel}>Retail Clusters</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className={cn(styles.statCard, styles.payment)}>
                        <div className={styles.statIcon}><CreditCard size={20} /></div>
                        <div>
                            <div className={styles.statValue}>{stats.paymentSites}</div>
                            <div className={styles.statLabel}>Payment Hubs</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className={cn(styles.statCard, styles.visits)}>
                        <div className={styles.statIcon}><Clock size={20} /></div>
                        <div>
                            <div className={styles.statValue}>{stats.totalVisits}</div>
                            <div className={styles.statLabel}>Aggregate Hits</div>
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className={cn(styles.statCard, styles.total)}>
                        <div className={styles.statIcon}><Globe size={20} /></div>
                        <div>
                            <div className={styles.statValue}>{stats.totalSites}</div>
                            <div className={styles.statLabel}>Sites Rooted</div>
                        </div>
                    </motion.div>
                </div>

                {/* Filter Tabs */}
                <motion.div className={styles.filterTabs} variants={itemVariants}>
                    {(['all', 'shopping', 'payment', 'finance'] as const).map(filter => (
                        <button
                            key={filter}
                            className={cn(styles.filterTab, activeFilter === filter && styles.active)}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter === 'all' && <Zap size={14} />}
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </motion.div>

                {/* Site List */}
                <div className={styles.siteGrid}>
                    <AnimatePresence mode="popLayout">
                        {filteredSites.length === 0 ? (
                            <motion.div key="empty" className={styles.emptyState} variants={itemVariants}>
                                <ShoppingBag size={64} strokeWidth={1} className="text-slate-200" />
                                <h3>Telemetry Quiet</h3>
                                <p>No shopping or payment activity detected in current interval.</p>
                            </motion.div>
                        ) : (
                            filteredSites.map((site, index) => {
                                const { Icon } = getSiteCategory(site.site_name);
                                return (
                                    <motion.div
                                        key={site.id}
                                        className={cn(styles.siteCard, styles[site.category])}
                                        variants={itemVariants}
                                        layout
                                    >
                                        <div className={styles.siteHeader}>
                                            <div className={styles.siteIcon}>
                                                <Icon size={28} strokeWidth={1.5} />
                                            </div>
                                            <div className={styles.siteInfo}>
                                                <h3>{site.site_name}</h3>
                                                <span className={styles.siteHostname}>{site.hostname}</span>
                                            </div>
                                            <a href={site.url} target="_blank" rel="noopener noreferrer" className={styles.visitLink}>
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                        <div className={styles.siteStats}>
                                            <div className={styles.siteStat}>
                                                <Clock size={14} />
                                                <span>{timeAgo(site.last_visited)}</span>
                                            </div>
                                            <div className={styles.siteStat}>
                                                <Activity size={14} />
                                                <span>{site.visit_count} HITS</span>
                                            </div>
                                        </div>
                                        <span className={styles.categoryBadge}>
                                            {site.category}
                                        </span>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ShoppingActivityPage;
