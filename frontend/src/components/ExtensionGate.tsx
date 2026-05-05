import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Chrome, X } from 'lucide-react';
import { useExtensionSync } from '../hooks/useExtensionSync';

const DISMISS_KEY = 'cashly_extension_guidance_dismissed';

const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(userAgent) || window.innerWidth <= 768;
};

interface ExtensionGateProps {
    children: ReactNode;
}

const ExtensionGate = ({ children }: ExtensionGateProps) => {
    const { extensionStatus, checking } = useExtensionSync();
    const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
    const [isMobile] = useState(() => isMobileDevice());

    useEffect(() => {
        const handleExtensionSynced = () => setDismissed(true);
        const handleExtensionRemoved = () => {
            localStorage.removeItem(DISMISS_KEY);
            setDismissed(false);
        };

        window.addEventListener('extension-synced', handleExtensionSynced);
        window.addEventListener('extension-removed', handleExtensionRemoved);
        return () => {
            window.removeEventListener('extension-synced', handleExtensionSynced);
            window.removeEventListener('extension-removed', handleExtensionRemoved);
        };
    }, []);

    // Desktop uses ExtensionWall (hard gate). Mobile: optional nudge only.
    const shouldShowGuidance = isMobile
        && !checking
        && !dismissed
        && (!extensionStatus.installed || !extensionStatus.loggedIn);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, 'true');
        setDismissed(true);
    };

    return (
        <>
            {children}
            {shouldShowGuidance && (
                <div className="fixed bottom-5 right-5 z-[80] w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                            <Chrome className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-black text-slate-950">Extension on mobile</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                        Install Cashly on desktop Chrome for auto-tracking. On mobile you can use the app without the extension.
                                    </p>
                                </div>
                                <button onClick={dismiss} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss extension guidance">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link to="/extension-health" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                                    <Activity className="h-3.5 w-3.5" />
                                    Open health
                                </Link>
                                <a href="/cashly-extension.zip" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExtensionGate;
