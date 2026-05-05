// Extension Health Page - Stark Gen Z Brutalist Telemetry Audit
import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Globe, RefreshCw, Zap, Target, Shield } from 'lucide-react';
import { featureExpansionApi } from '../services/featureExpansionApi';
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
        { label: 'TRACKED_NODES', value: health?.sites?.length || 0, icon: Globe, color: '#000000' },
        { label: 'QUEUED_SYNCS', value: health?.queuedSyncs || 0, icon: Clock, color: '#000000' },
        { label: 'FAILED_HITS', value: health?.failedDetections || 0, icon: AlertTriangle, color: '#E11D48' },
        { label: 'PERMISSION_LEVEL', value: health?.permissionStatus || 'UNKNOWN', icon: Shield, color: '#000000' },
    ];

    return (
        <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-white min-h-screen text-black">
            {/* Brutalist Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-4 border-black p-10 bg-white shadow-[10px_10px_0px_#000000]">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-black text-white flex items-center justify-center border-4 border-black shrink-0">
                        <Activity size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Extension Audit</h1>
                        <p className="text-sm font-black text-black/50 mt-1 uppercase tracking-widest">REAL_TIME_TELEMETRY_PIPELINE // SYSTEM_HEALTH_INDEX</p>
                    </div>
                </div>
                <button 
                    onClick={load} 
                    className="h-14 px-8 bg-black text-white font-black uppercase text-xs hover:bg-[#E11D48] transition-colors flex items-center justify-center gap-3"
                >
                    <RefreshCw size={18} strokeWidth={3} className={cn(loading && "animate-spin")} />
                    REINITIALIZE_SYNC
                </button>
            </header>

            {loading ? (
                <div className="border-4 border-black p-12 text-center font-black uppercase text-2xl animate-pulse">
                    SYNCING_TELEMETRY_NODES...
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {stats.map(stat => (
                            <div key={stat.label} className="bg-white border-4 border-black p-8 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#E11D48] transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-2 border-black mb-6">
                                    <stat.icon size={24} strokeWidth={3} />
                                </div>
                                <div className="text-4xl font-black italic tracking-tighter mb-2" style={{ color: stat.color }}>
                                    {typeof stat.value === 'string' ? stat.value.toUpperCase() : stat.value}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-black/40">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Events Section */}
                    <section className="bg-white border-4 border-black p-10 shadow-[10px_10px_0px_#000000]">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b-4 border-black">
                            <h2 className="text-2xl font-black italic uppercase italic flex items-center gap-4">
                                <Target size={28} strokeWidth={3} />
                                Event_Manifest
                            </h2>
                            <div className="bg-black text-white text-[10px] font-black uppercase px-3 py-1">ENCRYPTED_FEED</div>
                        </div>

                        <div className="space-y-4">
                            {(health?.recentEvents || []).map((event: any) => (
                                <div 
                                    key={event.id} 
                                    className="p-6 border-4 border-black bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black hover:text-white transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-3 h-3 border-2 border-black",
                                            event.status === 'error' ? "bg-[#E11D48]" : "bg-black group-hover:bg-white"
                                        )} />
                                        <div>
                                            <div className="font-black uppercase text-sm tracking-widest italic">{event.event_type}</div>
                                            <div className="text-xs font-black opacity-50 uppercase mt-1">
                                                {event.message || event.site_hostname || 'NO_DETAILS_SPECIFIED'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black px-4 py-2 border-2 border-black uppercase tracking-widest",
                                        event.status === 'error' ? "bg-[#E11D48] text-white" : "bg-black text-white group-hover:bg-white group-hover:text-black"
                                    )}>
                                        {event.status.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                            {(!health?.recentEvents || health.recentEvents.length === 0) && (
                                <div className="p-12 border-4 border-dashed border-black/10 text-center">
                                    <Zap size={64} strokeWidth={1} className="mx-auto text-black/10 mb-6" />
                                    <p className="text-sm font-black text-black/30 uppercase tracking-widest">TELEMETRY_STREAM_EMPTY</p>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default ExtensionHealthPage;
