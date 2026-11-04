// Browser extension: install state from the extension bridge, health from the backend, around the shared ExtensionView.
import { useCallback, useEffect, useState } from 'react';
import { ExtensionView, type ExtensionState } from '../features/extension/ExtensionView';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { useExtensionSync } from '../hooks/useExtensionSync';

interface Health {
    sites?: { hostname: string; site_name?: string; visit_count: number; detection_count: number; last_visited: string }[];
    recentEvents?: { id: string; event_type: string; status: string; message?: string; site_hostname?: string; created_at: string }[];
    queuedSyncs?: number; failedDetections?: number; lastSuccessfulSync?: string | null;
}

export const ExtensionHealthPage = () => {
    const { extensionStatus, checking, checkExtension } = useExtensionSync();
    const [health, setHealth] = useState<Health>({});

    const load = useCallback(async () => {
        try { setHealth((await featureExpansionApi.extensionHealth()) || {}); }
        catch { /* the status line still comes from the extension itself */ }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const state: ExtensionState = !extensionStatus.installed ? 'missing' : extensionStatus.loggedIn ? 'connected' : 'signed-out';

    return (
        <ExtensionView
            state={state}
            lastSync={health.lastSuccessfulSync || null}
            queued={Number(health.queuedSyncs) || 0}
            failed={Number(health.failedDetections) || 0}
            sites={(health.sites || []).map((s) => ({ hostname: s.hostname, name: s.site_name, visits: s.visit_count, caught: s.detection_count, lastSeen: s.last_visited }))}
            events={(health.recentEvents || []).map((e) => ({ id: e.id, type: e.event_type, status: e.status, message: e.message, site: e.site_hostname, at: e.created_at }))}
            checking={checking}
            onCheck={() => { void checkExtension(); void load(); }}
        />
    );
};

export default ExtensionHealthPage;
