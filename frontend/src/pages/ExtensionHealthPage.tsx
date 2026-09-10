import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Globe, RefreshCw, Shield, Zap } from 'lucide-react';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ExtensionHealthPage = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            setHealth(await featureExpansionApi.extensionHealth());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const stats = [
        { label: 'Tracked sites', value: health?.sites?.length || 0, icon: <Globe size={18} /> },
        { label: 'Queued syncs', value: health?.queuedSyncs || 0, icon: <Clock size={18} /> },
        { label: 'Failed detections', value: health?.failedDetections || 0, icon: <AlertTriangle size={18} /> },
        { label: 'Permission', value: health?.permissionStatus || 'Unknown', icon: <Shield size={18} /> },
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <PageHeader
                title="Extension health"
                description="Tracked sites, queued syncs, and recent capture events."
                actions={
                    <Button variant="outline" onClick={load}>
                        <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
                        Refresh
                    </Button>
                }
            />

            {loading ? (
                <Surface className="py-12 text-center text-sm text-[var(--text-muted)]">Checking the extension…</Surface>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => (
                            <StatTile key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
                        ))}
                    </div>

                    <Surface>
                        <h2 className="font-display text-lg font-semibold">Recent events</h2>
                        <div className="mt-4 space-y-3">
                            {(health?.recentEvents || []).map((event: any) => (
                                <div key={event.id} className="flex flex-col justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-4 py-3 md:flex-row md:items-center">
                                    <div>
                                        <p className="text-sm font-medium">{event.event_type}</p>
                                        <p className="mt-0.5 text-xs text-[#78716C]">{event.message || event.site_hostname || 'No extra detail'}</p>
                                    </div>
                                    <span className={cn(
                                        'w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                                        event.status === 'error' ? 'bg-[#FFE4E6] text-[#E11D48]' : 'bg-[#F4F0EB] text-[#57534E]'
                                    )}>
                                        {event.status}
                                    </span>
                                </div>
                            ))}
                            {(!health?.recentEvents || health.recentEvents.length === 0) && (
                                <EmptyState icon={<Zap size={20} />} title="Quiet so far" description="No recent extension events." />
                            )}
                        </div>
                    </Surface>
                </>
            )}
        </div>
    );
};

export default ExtensionHealthPage;
