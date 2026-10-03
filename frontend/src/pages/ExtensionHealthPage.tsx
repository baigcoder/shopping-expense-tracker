import React, { useEffect, useState, useCallback } from 'react';
import {
    AlertTriangle, Clock, Globe, RefreshCw, Shield,
    Radio, Activity, ExternalLink
} from 'lucide-react';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const POPULAR_CHECKOUT_SITES = [
    { name: 'Amazon', domain: 'amazon.com', status: 'Active Detection', category: 'General Merchandise' },
    { name: 'Walmart', domain: 'walmart.com', status: 'Active Detection', category: 'Retail & Grocery' },
    { name: 'Target', domain: 'target.com', status: 'Active Detection', category: 'Retail' },
    { name: 'Best Buy', domain: 'bestbuy.com', status: 'Active Detection', category: 'Electronics' },
    { name: 'DoorDash', domain: 'doordash.com', status: 'Active Detection', category: 'Food & Dining' },
    { name: 'Uber Eats', domain: 'ubereats.com', status: 'Active Detection', category: 'Food & Dining' },
];

export const ExtensionHealthPage = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const data = await featureExpansionApi.extensionHealth();
            setHealth(data);
        } catch (error) {
            console.error('Failed to load extension health:', error);
            toast.error('Could not load companion telemetry');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        toast.success('Companion telemetry synchronized');
    };

    const stats = [
        { label: 'Tracked Checkout Sites', value: health?.sites?.length || POPULAR_CHECKOUT_SITES.length, icon: Globe, color: 'text-[var(--color-info)]' },
        { label: 'Queued Inbound Syncs', value: health?.queuedSyncs || 0, icon: Clock, color: 'text-[var(--color-warning)]' },
        { label: 'Failed Checkout Detections', value: health?.failedDetections || 0, icon: AlertTriangle, color: 'text-[var(--color-danger)]' },
        { label: 'Background Permissions', value: health?.permissionStatus || 'Active', icon: Shield, color: 'text-[var(--color-positive)]' },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-8 md:px-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-ink)] text-white text-[10px] font-mono tracking-wider uppercase mb-3 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE5024] animate-pulse" />
                        Companion Telemetry & Capture Pipeline
                    </div>
                    <h1 className="editorial-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] text-[var(--color-ink)] uppercase leading-none">
                        Browser Companion
                    </h1>
                    <p className="text-sm text-[var(--color-ink)]/70 mt-2 max-w-xl font-medium leading-relaxed">
                        Live background DOM checkout observation, supported platform integrations, and inbox staging telemetry.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-full border-[var(--color-border)] bg-white text-xs h-10 px-5 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-all"
                >
                    <RefreshCw className={cn('h-3.5 w-3.5 mr-2 text-[#EE5024]', refreshing && 'animate-spin')} />
                    Sync Status
                </Button>
            </div>

            {/* Companion Status Hero Banner */}
            <div className="p-6 md:p-8 rounded-[24px] bg-[#111111] text-white border border-[#222222] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-[#222222] border border-white/10 flex items-center justify-center text-[#EE5024] shrink-0">
                        <Radio className="h-7 w-7 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-base text-white tracking-tight uppercase font-mono">
                                Cashly Companion Protocol
                            </h2>
                            <Badge variant="default" className="text-[10px] bg-[#16804D] text-white font-mono uppercase">
                                Operational
                            </Badge>
                        </div>
                        <p className="text-sm text-white/70 mt-1 max-w-2xl leading-relaxed">
                            The Cashly companion monitors digital checkouts in your browser and stages candidate purchases into your Review Inbox without touching your bank credentials.
                        </p>
                    </div>
                </div>

                <Button
                    size="sm"
                    onClick={() => {
                        window.open('https://github.com/baigcoder/shopping-expense-tracker', '_blank');
                    }}
                    className="rounded-full bg-[#EE5024] hover:bg-[#EE5024]/90 text-white font-bold text-xs h-10 px-5 shrink-0 shadow-xs transition-all"
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Extension Docs
                </Button>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    const isOrange = idx === 0;
                    const isWhite = idx === 1;
                    const isSage = idx === 2;
                    const isInk = idx === 3;
                    return (
                        <div 
                            key={stat.label} 
                            className={cn(
                                "p-6 rounded-[24px] flex flex-col justify-between min-h-[140px] shadow-xs",
                                isOrange && "bg-[#EE5024] text-white",
                                isInk && "bg-[#111111] text-white",
                                isWhite && "bg-white border border-[var(--color-border)] text-[var(--color-ink)]",
                                isSage && "bg-[#BBC7B1]/30 border border-[#BBC7B1]/60 text-[var(--color-ink)]"
                            )}
                        >
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                                <span>{stat.label}</span>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-3xl font-extrabold tracking-tight tabular-nums font-mono mt-3 leading-none">
                                {loading ? '—' : stat.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Supported Merchant Checkouts Table */}
            <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[var(--color-border)] shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
                    <div>
                        <h2 className="text-base font-extrabold text-[var(--color-ink)] uppercase tracking-tight">
                            Tracked Merchant Sites
                        </h2>
                        <p className="text-xs text-[var(--color-ink)]/70 mt-0.5">
                            Top digital checkout portals with automated background DOM receipt capture
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase bg-[var(--color-canvas)] text-[var(--color-ink)]">
                        6 Primary Retailers
                    </Badge>
                </div>

                <div className="divide-y divide-[var(--color-border-subtle)]">
                    {POPULAR_CHECKOUT_SITES.map(site => (
                        <div key={site.domain} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center font-bold text-[var(--color-text-primary)] font-mono">
                                    {site.name[0]}
                                </div>
                                <div>
                                    <span className="font-semibold text-[var(--color-text-primary)] block">{site.name}</span>
                                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{site.domain}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[var(--color-text-secondary)] hidden sm:inline">{site.category}</span>
                                <Badge variant="default" className="text-[10px] bg-[var(--color-positive-subtle)] text-[var(--color-positive)] border border-[var(--color-positive)]/20 font-mono">
                                    {site.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Capture Events */}
            <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                            Recent Telemetry & Sync Events
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Event logs from companion checkout activity
                        </p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    {(!health?.recentEvents || health.recentEvents.length === 0) ? (
                        <div className="p-8 text-center rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] space-y-1.5">
                            <div className="h-8 w-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
                                <Activity className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-[var(--color-text-primary)] block">All quiet</span>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                                No error events logged. Companion is listening in the background.
                            </p>
                        </div>
                    ) : (
                        health.recentEvents.map((evt: any) => (
                            <div key={evt.id} className="p-3 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-[var(--color-text-primary)]">{evt.event_type}</span>
                                    <p className="text-[11px] text-[var(--color-text-secondary)]">{evt.message || evt.site_hostname || 'Normal telemetry'}</p>
                                </div>
                                <Badge variant={evt.status === 'error' ? 'destructive' : 'secondary'} className="text-[10px] capitalize font-mono">
                                    {evt.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExtensionHealthPage;
