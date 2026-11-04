import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/supabase.js', () => ({ supabase: {} }));

import { nextSiteStats, summarizeExtensionHealth } from '../featureExpansionService.js';

const now = '2026-11-20T10:00:00.000Z';

describe('nextSiteStats', () => {
    it('adds to the counts instead of overwriting them', () => {
        const after = nextSiteStats({ visit_count: 4, detection_count: 6, last_detection_at: '2026-11-01T00:00:00.000Z' }, 'site_visit', 'info', now);
        expect(after).toEqual({ visit_count: 5, detection_count: 6, last_detection_at: '2026-11-01T00:00:00.000Z' });
    });

    it('counts a checkout whether it went to the ledger or to review, but not a failed one', () => {
        expect(nextSiteStats(null, 'sync', 'success', now)).toMatchObject({ detection_count: 1, last_detection_at: now });
        expect(nextSiteStats({ detection_count: 1 }, 'detected_transaction', 'success', now).detection_count).toBe(2);
        expect(nextSiteStats({ detection_count: 1 }, 'sync', 'error', now).detection_count).toBe(1);
    });
});

describe('summarizeExtensionHealth', () => {
    const at = (daysAgo: number) => new Date(Date.parse(now) - daysAgo * 86400000).toISOString();

    it('treats a capture sent to review as a successful sync', () => {
        const s = summarizeExtensionHealth([{ event_type: 'detected_transaction', status: 'success', created_at: at(0) }], new Date(now));
        expect(s.lastSuccessfulSync).toBe(at(0));
    });

    it('counts only recent errors and takes the waiting count from the latest event', () => {
        const s = summarizeExtensionHealth([
            { event_type: 'sync', status: 'success', queued_count: 0, created_at: at(0) },
            { event_type: 'sync', status: 'error', created_at: at(2) },
            { event_type: 'sync', status: 'error', queued_count: 5, created_at: at(30) },
        ], new Date(now));
        expect(s.failedDetections).toBe(1);
        expect(s.queuedSyncs).toBe(0);
    });
});
