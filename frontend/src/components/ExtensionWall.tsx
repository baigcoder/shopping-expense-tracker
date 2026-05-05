import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import { logout, supabase } from '../config/supabase';
import { useAuthStore } from '../store/useStore';
import styles from './ExtensionWall.module.css';

const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua) || window.innerWidth <= 768;
};

const sameEmail = (a?: string | null, b?: string | null) => {
    const expected = (b || '').trim().toLowerCase();
    if (!expected) return true;
    return (a || '').trim().toLowerCase() === expected;
};

/**
 * Desktop-only: blocks dashboard until Cashly extension is present and session-synced.
 * Mobile/tablet: no wall (extensions not used the same way).
 */
const ExtensionWall = () => {
    const navigate = useNavigate();
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);
    const { extensionStatus, checking, checkExtension, syncSession } = useExtensionSync();
    const [busy, setBusy] = useState(false);
    const [isMobile] = useState(() => isMobileDevice());
    const [syncedNow, setSyncedNow] = useState(false);

    useEffect(() => {
        setSyncedNow(extensionStatus.installed && extensionStatus.loggedIn && sameEmail(extensionStatus.userEmail, user?.email));
    }, [extensionStatus.installed, extensionStatus.loggedIn, extensionStatus.userEmail, user?.email]);

    useEffect(() => {
        const handleSynced = (event: Event) => {
            const detail = (event as CustomEvent<{ email?: string }>).detail;
            if (sameEmail(detail?.email, user?.email)) {
                setSyncedNow(true);
            }
        };

        const handleRemoved = () => setSyncedNow(false);

        window.addEventListener('extension-synced', handleSynced);
        window.addEventListener('extension-removed', handleRemoved);
        return () => {
            window.removeEventListener('extension-synced', handleSynced);
            window.removeEventListener('extension-removed', handleRemoved);
        };
    }, [user?.email]);

    const allowed = isMobile || syncedNow || (
        !checking
        && extensionStatus.installed
        && extensionStatus.loggedIn
        && sameEmail(extensionStatus.userEmail, user?.email)
    );

    const handleRecheck = useCallback(async () => {
        setBusy(true);
        try {
            // Get current session and push it to the extension
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // syncSession sends SYNC_SESSION message AND waits for EXTENSION_STATUS response
                await syncSession(session, session.user);
            }
            // Also send CHECK_STATUS for good measure
            window.postMessage({ type: 'WEBSITE_TO_EXTENSION', action: 'CHECK_STATUS' }, '*');
            await new Promise((r) => setTimeout(r, 500));
            await checkExtension();
        } finally {
            setBusy(false);
        }
    }, [checkExtension, syncSession]);

    const handleSignOut = useCallback(async () => {
        setBusy(true);
        try {
            await logout();
            setUser(null);
            navigate('/login', { replace: true });
        } catch {
            setUser(null);
            navigate('/login', { replace: true });
        } finally {
            setBusy(false);
        }
    }, [navigate, setUser]);

    if (allowed) return null;

    const needsInstall = !extensionStatus.installed;
    const needsSync = extensionStatus.installed && !extensionStatus.loggedIn;

    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="extension-wall-title">
            <div className={styles.panel}>
                {checking ? (
                    <>
                        <div className={styles.spinner} aria-hidden />
                        <p className={styles.loadingLabel}>Checking extension…</p>
                    </>
                ) : (
                    <>
                        <p className={styles.title}>Cashly · Desktop</p>
                        <h1 id="extension-wall-title" className={styles.headline}>
                            {needsInstall ? 'Install the extension' : 'Connect your session'}
                        </h1>
                        <p className={styles.copy}>
                            {needsInstall
                                ? 'On desktop, Cashly requires the browser extension for secure checkout detection and inbox sync. Download and load the unpacked extension, then return here.'
                                : 'The extension is installed but not logged in with this account. Open the Cashly extension popup and tap “Sync from Website”, or use recheck below after syncing.'}
                        </p>
                        <div className={styles.actions}>
                            {needsInstall ? (
                                <a className={styles.primary} href="/cashly-extension.zip" download="cashly-extension.zip">
                                    <Download size={16} strokeWidth={2.5} />
                                    Download extension
                                </a>
                            ) : null}
                            <button type="button" className={styles.secondary} onClick={handleRecheck} disabled={busy}>
                                <RefreshCw size={16} className={busy ? 'animate-spin' : ''} strokeWidth={2.5} />
                                {busy ? 'Working…' : needsSync ? 'I synced — recheck' : 'Recheck extension'}
                            </button>
                        </div>
                        <p className={styles.hint}>
                            After installing: Chrome → Extensions → Developer mode → Load unpacked → select the folder. Then refresh this page or use Recheck.
                        </p>
                        <button type="button" className={styles.ghost} onClick={handleSignOut} disabled={busy}>
                            Sign out and use another account
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExtensionWall;
