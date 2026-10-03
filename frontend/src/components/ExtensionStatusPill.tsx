import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Chrome, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import { useAuthStore } from '../store/useStore';
import { supabase } from '../config/supabase';

export function ExtensionStatusPill() {
    const { extensionStatus, checking, checkExtension, syncSession } = useExtensionSync();
    const user = useAuthStore((s) => s.user);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const isInstalled = extensionStatus.installed;
    const isSynced = isInstalled && extensionStatus.loggedIn && (!extensionStatus.userEmail || extensionStatus.userEmail.toLowerCase() === (user?.email || '').toLowerCase());

    const handleManualSync = async () => {
        setSyncing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await syncSession(session, session.user);
            }
            await checkExtension();
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setPopoverOpen(!popoverOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isSynced
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                        : isInstalled
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                        : 'bg-[var(--cashly-bg-subtle)] text-[var(--cashly-text-muted)] border border-[var(--cashly-border)] hover:text-[var(--cashly-text-primary)] hover:border-[var(--cashly-border-strong)]'
                }`}
                aria-expanded={popoverOpen}
                aria-label="Extension Status"
            >
                <Chrome className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                    {checking ? 'Checking...' : isSynced ? 'Companion Synced' : isInstalled ? 'Sync Extension' : 'Extension Companion'}
                </span>
                <span
                    className={`w-2 h-2 rounded-full ${
                        isSynced ? 'bg-emerald-500 animate-pulse' : isInstalled ? 'bg-amber-500' : 'bg-stone-400'
                    }`}
                />
            </button>

            {popoverOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setPopoverOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl bg-white dark:bg-stone-900 border border-[var(--cashly-border)] shadow-xl z-50 animate-fade-in text-left">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--cashly-border)]">
                            <div className="flex items-center gap-2">
                                <Chrome className="w-4 h-4 text-[var(--cashly-brand)]" />
                                <span className="font-medium text-sm text-[var(--cashly-text-primary)]">
                                    Browser Companion
                                </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isSynced ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            }`}>
                                {isSynced ? 'Active' : isInstalled ? 'Disconnected' : 'Not Detected'}
                            </span>
                        </div>

                        <div className="py-3 text-xs text-[var(--cashly-text-secondary)] space-y-2">
                            {isSynced ? (
                                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Background purchase detection is active for supported checkouts.</span>
                                </div>
                            ) : isInstalled ? (
                                <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Extension is installed but needs session sync with your account.</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-stone-600 dark:text-stone-400">
                                    <Chrome className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Install the Cashly Chrome Companion to automatically capture expenses at checkout.</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-[var(--cashly-border)] flex items-center justify-between gap-2">
                            {isInstalled ? (
                                <button
                                    type="button"
                                    onClick={handleManualSync}
                                    disabled={syncing}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cashly-brand)] text-white hover:bg-[var(--cashly-brand-hover)] disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            ) : (
                                <Link
                                    to="/extension-health"
                                    onClick={() => setPopoverOpen(false)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cashly-brand)] text-white hover:bg-[var(--cashly-brand-hover)]"
                                >
                                    Install Guide
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            )}

                            <Link
                                to="/extension-health"
                                onClick={() => setPopoverOpen(false)}
                                className="text-xs text-[var(--cashly-brand)] hover:underline ml-auto"
                            >
                                Companion Health
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ExtensionStatusPill;
