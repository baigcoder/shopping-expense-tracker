import { Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExtensionState = 'connected' | 'elsewhere' | 'signed-out' | 'missing';
export interface ExtSite { hostname: string; name?: string; visits: number; caught: number; lastSeen: string }
export interface ExtEvent { id: string; type: string; status: string; message?: string; site?: string; at: string }

interface ExtensionViewProps {
    state: ExtensionState; lastSync: string | null; queued: number; failed: number;
    sites: ExtSite[]; events: ExtEvent[]; checking?: boolean; onCheck: () => void; now?: Date;
}

const ago = (iso: string, now: Date) => {
    const m = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    if (m < 1440) return `${Math.round(m / 60)} h ago`;
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const STATE: Record<ExtensionState, { title: string; dot: string }> = {
    connected: { title: 'Connected', dot: 'bg-[var(--color-success)]' },
    elsewhere: { title: 'Working in another browser', dot: 'bg-[var(--color-success)]' },
    'signed-out': { title: 'Installed, not signed in', dot: 'bg-[var(--color-brand)]' },
    missing: { title: 'Not installed', dot: 'bg-[var(--color-muted)]' },
};

const STEPS = ['Download the extension and unzip it.', 'Open chrome://extensions and turn on Developer mode.', 'Choose Load unpacked, pick the unzipped folder, then sign in from its icon.'];

export function ExtensionView({ state, lastSync, queued, failed, sites, events, checking, onCheck, now = new Date() }: ExtensionViewProps) {
    const s = STATE[state];
    const facts = [
        { label: 'Last sync', value: lastSync ? ago(lastSync, now) : 'Never' },
        { label: 'Queued', value: String(queued) },
        { label: 'Missed', value: String(failed), bad: failed > 0 },
    ];

    return (
        <div className="flex flex-col gap-4">
            <header className="pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Browser extension</h1>
            </header>

            <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="ext-h" data-tour="extension-status">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 id="ext-h" className="flex items-center gap-3 font-display text-[24px] font-bold tracking-tight">
                        <span className={cn('h-3 w-3 rounded-full', s.dot)} aria-hidden />{s.title}
                    </h2>
                    <div className="flex gap-2">
                        <button type="button" onClick={onCheck} disabled={checking}
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-canvas)] px-4 text-[14px] font-semibold hover:bg-[var(--color-surface-2)] disabled:opacity-50">
                            <RefreshCw size={15} className={cn(checking && 'animate-spin')} aria-hidden /> Check again
                        </button>
                        {(state === 'missing' || state === 'signed-out') && (
                            <a href="/cashly-extension.zip" download className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 text-[14px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-hover)]">
                                <Download size={15} aria-hidden /> Download
                            </a>
                        )}
                    </div>
                </div>
                {state === 'connected' || state === 'elsewhere' ? (
                    <dl className="mt-5 grid grid-cols-3 gap-4">
                        {facts.map((f) => (
                            <div key={f.label}>
                                <dt className="text-[14px] text-[var(--color-ink-secondary)]">{f.label}</dt>
                                <dd className={cn('mt-1 font-display text-[18px] font-semibold tabular-nums sm:text-[22px]', f.bad && 'text-[var(--color-danger)]')}>{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <ol className="mt-5 flex flex-col gap-3">
                        {STEPS.map((t, i) => (
                            <li key={t} className="flex gap-3 text-[15px] leading-relaxed">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[13px] font-semibold tabular-nums">{i + 1}</span>{t}
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
                <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="sites-h">
                    <h2 id="sites-h" className="mb-2 font-display text-[17px] font-semibold">Sites it has seen</h2>
                    {sites.length === 0 ? <p className="text-[15px] text-[var(--color-ink-secondary)]">None yet. Shop online and checkouts show up here.</p> : (
                        <ul>
                            {sites.slice(0, 8).map((x) => (
                                <li key={x.hostname} className="flex items-center justify-between gap-3 border-t border-[var(--color-surface-2)] py-3 first:border-t-0">
                                    <span className="min-w-0">
                                        <span className="block truncate text-[15px] font-medium">{x.name || x.hostname}</span>
                                        <span className="block text-[13px] text-[var(--color-muted)]">{ago(x.lastSeen, now)}</span>
                                    </span>
                                    <span className="shrink-0 text-[14px] tabular-nums text-[var(--color-ink-secondary)]">{x.caught === 1 ? '1 checkout' : `${x.caught} checkouts`}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby="ev-h">
                    <h2 id="ev-h" className="mb-2 font-display text-[17px] font-semibold">Recent activity</h2>
                    {events.length === 0 ? <p className="text-[15px] text-[var(--color-ink-secondary)]">Nothing has happened yet.</p> : (
                        <ul>
                            {events.slice(0, 8).map((e) => (
                                <li key={e.id} className="flex items-center justify-between gap-3 border-t border-[var(--color-surface-2)] py-3 first:border-t-0">
                                    <span className="min-w-0">
                                        <span className={cn('block truncate text-[15px] font-medium', e.status === 'error' && 'text-[var(--color-danger)]')}>{e.message || e.type.replace(/_/g, ' ')}</span>
                                        <span className="block text-[13px] text-[var(--color-muted)]">{[e.site, ago(e.at, now)].filter(Boolean).join(' · ')}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
