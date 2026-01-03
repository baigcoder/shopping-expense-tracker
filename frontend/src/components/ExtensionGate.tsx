// Extension Gate - Wraps protected routes (OPTIMIZED for fast loading)
import { ReactNode, useEffect, useState } from 'react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import ExtensionRequiredModal from './ExtensionRequiredModal';
import { DashboardSkeleton } from './LoadingSkeleton';

// Check localStorage sync flag directly (fast synchronous check)
const EXTENSION_SYNCED_KEY = 'cashly_extension_synced';

// Mobile detection - extensions are not available on mobile browsers
const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

    // Also check screen width for tablets in mobile mode
    const isSmallScreen = window.innerWidth <= 768;

    return mobileRegex.test(userAgent) || isSmallScreen;
};

const isPreviouslySynced = (): boolean => {
    try {
        const syncedData = localStorage.getItem(EXTENSION_SYNCED_KEY);
        if (syncedData) {
            const data = JSON.parse(syncedData);
            // Allow up to 60 seconds for fast path (extension updates every 30s)
            // This provides good UX while still detecting removal within a minute
            const isRecent = data.timestamp && (Date.now() - data.timestamp < 60 * 1000);
            return data.synced === true && !!data.email && isRecent;
        }
    } catch (e) {
        // Ignore
    }
    return false;
};

const clearSyncFlag = () => {
    try {
        localStorage.removeItem(EXTENSION_SYNCED_KEY);
    } catch (e) {
        // Ignore
    }
};

interface ExtensionGateProps {
    children: ReactNode;
}

const ExtensionGate = ({ children }: ExtensionGateProps) => {
    const { extensionStatus, checking } = useExtensionSync();
    const [showModal, setShowModal] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);

    // Initial sync flag (for faster first paint) - computed ONCE
    const [wasPreviouslySynced] = useState(() => isPreviouslySynced());

    // Mobile detection - computed ONCE
    const [isMobile] = useState(() => isMobileDevice());

    // OPTIMIZATION: If previously synced, immediately mark verification complete
    // This allows children to render while we verify in background
    useEffect(() => {
        if (wasPreviouslySynced) {
            setVerificationComplete(true);
        }
    }, [wasPreviouslySynced]);

    // Listen for extension sync event - hide modal immediately when synced
    useEffect(() => {
        const handleExtensionSynced = () => {
            setShowModal(false);
            setVerificationComplete(true);
        };

        window.addEventListener('extension-synced', handleExtensionSynced);
        return () => window.removeEventListener('extension-synced', handleExtensionSynced);
    }, []);

    // Listen for extension removal event - show modal immediately
    useEffect(() => {
        const handleExtensionRemoved = () => {
            clearSyncFlag();
            setShowModal(true);
        };

        window.addEventListener('extension-removed', handleExtensionRemoved);
        return () => window.removeEventListener('extension-removed', handleExtensionRemoved);
    }, []);

    // Main verification logic - runs after async check completes
    useEffect(() => {
        if (checking) return; // Still checking, wait

        // If extension is detected and logged in, we're good
        if (extensionStatus.installed && extensionStatus.loggedIn) {
            setShowModal(false);
            setVerificationComplete(true);
            return;
        }

        // Extension NOT detected after check completed
        // If we thought we were previously synced, the extension must have been removed
        if (wasPreviouslySynced) {
            clearSyncFlag(); // Clear stale sync flag
        }

        // OPTIMIZED: Reduced grace period from 1500ms to 500ms for faster response
        const timer = setTimeout(() => {
            setVerificationComplete(true);
            if (!extensionStatus.installed || !extensionStatus.loggedIn) {
                setShowModal(true);
            }
        }, 500); // 500ms grace period (was 1500ms)

        return () => clearTimeout(timer);
    }, [checking, extensionStatus.installed, extensionStatus.loggedIn, wasPreviouslySynced]);

    // Hide modal immediately when extension becomes detected
    useEffect(() => {
        if (extensionStatus.installed && extensionStatus.loggedIn) {
            setShowModal(false);

            // Auto-redirect to dashboard if on login/signup
            const currentPath = window.location.pathname;
            if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
                window.location.href = '/dashboard';
            }
        }
    }, [extensionStatus.installed, extensionStatus.loggedIn]);

    // FAST PATH 0: Mobile devices - skip extension requirement entirely
    // Browser extensions are not available on mobile browsers
    if (isMobile) {
        return <>{children}</>;
    }

    // FAST PATH 1: If previously synced, render children immediately (don't wait for checks)
    // Background verification will show modal if extension was actually removed
    if (wasPreviouslySynced && !showModal) {
        return <>{children}</>;
    }

    // FAST PATH 2: If extension is currently detected and logged in, render immediately
    if (extensionStatus.installed && extensionStatus.loggedIn) {
        return <>{children}</>;
    }

    // Show loading while checking (but only if not previously synced)
    if ((checking || !verificationComplete) && !wasPreviouslySynced) {
        return (
            <div className="flex-1 overflow-auto bg-slate-50/50">
                <DashboardSkeleton />
            </div>
        );
    }

    // Show modal if extension not detected after verification
    if (showModal) {
        return <ExtensionRequiredModal />;
    }

    // Still waiting for verification to complete - show skeleton
    if (!verificationComplete) {
        return (
            <div className="flex-1 overflow-auto bg-slate-50/50">
                <DashboardSkeleton />
            </div>
        );
    }

    // If verification is complete but extension is STILL not detected, show modal
    // This is the fallback case - ensures we never render children without extension
    if (!extensionStatus.installed || !extensionStatus.loggedIn) {
        return <ExtensionRequiredModal />;
    }

    // Default: render children (only reachable if extension is verified)
    return <>{children}</>;
};

export default ExtensionGate;

