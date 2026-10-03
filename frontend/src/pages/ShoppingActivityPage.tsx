// Shopping Activity Page — Cashly Calm Finance Companion Telemetry
// Authority: docs/design-v5/28_EXTENSION.md & docs/design-v5/37_COMPONENT_MIGRATION.md
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, CreditCard, Clock, Store,
    Globe, Activity, RefreshCw, Zap, ExternalLink,
    Landmark, Smartphone, Package,
    ShoppingBag, Tag, CreditCard as CardIcon, ArrowRight, Target, Radio
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const FADE_VARIANTS = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }
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
                    console.log('TELEMETRY_PARSE_FAILURE');
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
            <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <ActivitySkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <Radio className="h-3.5 w-3.5 animate-pulse" />
                        <span>Companion Telemetry</span>
                    </div>
                    <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                        Shopping Activity & Interceptions
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">
                        Recent digital checkout platforms, payment gateways, and retail sites observed by the browser companion.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSiteVisits}
                    disabled={isRefreshing}
                    className="h-9 gap-2 border-[var(--color-border)] text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                    <span>{isRefreshing ? 'Refreshing…' : 'Sync Telemetry'}</span>
                </Button>
            </div>

            {/* 4-Tile Telemetry Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: ShoppingCart, label: "Retail Sites", value: stats.shoppingSites, color: "text-[#D92F57] bg-[#FBE8ED]" },
                    { icon: CreditCard, label: "Payment Gateways", value: stats.paymentSites, color: "text-[#0284C7] bg-[#E0F2FE]" },
                    { icon: Target, label: "Total Sessions", value: stats.totalVisits, color: "text-[#167A52] bg-[#E8F5EF]" },
                    { icon: Globe, label: "Monitored Domains", value: stats.totalSites, color: "text-[#7547C7] bg-[#F1EBFF]" }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Surface key={i} className="p-4 sm:p-5 flex items-center gap-3.5">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", stat.color)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-[var(--color-muted)] truncate">{stat.label}</p>
                                <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold tabular-nums text-[var(--color-ink)]">
                                    {stat.value}
                                </p>
                            </div>
                        </Surface>
                    );
                })}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(['all', 'shopping', 'payment', 'finance'] as const).map(filter => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
                            activeFilter === filter
                                ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white shadow-xs"
                                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]"
                        )}
                    >
                        {filter === 'all' && <Zap className="h-3 w-3" />}
                        <span>{filter === 'all' ? 'All Platforms' : filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
                    </button>
                ))}
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredSites.length === 0 ? (
                        <div className="col-span-full py-16 text-center">
                            <Surface className="mx-auto max-w-md p-8 text-center">
                                <ShoppingBag className="mx-auto h-12 w-12 text-[var(--color-muted)] opacity-40" />
                                <h3 className="mt-3 font-display text-base font-semibold text-[var(--color-ink)]">
                                    No sessions recorded
                                </h3>
                                <p className="mt-1 text-xs text-[var(--color-muted)]">
                                    As you browse online checkout flows, captured sessions and domains will appear here.
                                </p>
                            </Surface>
                        </div>
                    ) : (
                        filteredSites.map((site) => {
                            const { Icon } = getSiteCategory(site.site_name);
                            return (
                                <motion.div
                                    key={site.id}
                                    variants={FADE_VARIANTS}
                                    initial="hidden"
                                    animate="visible"
                                    layout
                                >
                                    <Surface className="p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)]">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)] truncate">
                                                        {site.site_name}
                                                    </h3>
                                                    <p className="text-xs text-[var(--color-muted)] truncate font-mono">
                                                        {site.hostname}
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={site.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Visit ${site.site_name}`}
                                                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-ink-secondary)]">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                                                <span>{timeAgo(site.last_visited)}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-mono tabular-nums uppercase border-[var(--color-border)]">
                                                {site.visit_count} {site.visit_count === 1 ? 'visit' : 'visits'}
                                            </Badge>
                                        </div>
                                    </Surface>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ShoppingActivityPage;
