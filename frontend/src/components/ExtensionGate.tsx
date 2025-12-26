// Extension Gate - Wraps protected routes
import { ReactNode, useEffect, useState } from 'react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import ExtensionRequiredModal from './ExtensionRequiredModal';
import LoadingScreen from './LoadingScreen';

// Check localStorage sync flag directly (fast synchronous check)
const EXTENSION_SYNCED_KEY = 'cashly_extension_synced';

const isPreviouslySynced = (): boolean => {
    try {
        const syncedData = localStorage.getItem(EXTENSION_SYNCED_KEY);
        if (syncedData) {
            const data = JSON.parse(syncedData);
            return data.synced === true && !!data.email;
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

    // Initial sync flag (for faster first paint)
    const [wasPreviouslySynced] = useState(() => isPreviouslySynced());

    // Listen for extension sync event - hide modal immediately when synced
    useEffect(() => {
        const handleExtensionSynced = () => {
            setShowModal(false);
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

        // Give a short grace period for extension to initialize, then show modal
        const timer = setTimeout(() => {
            setVerificationComplete(true);
            if (!extensionStatus.installed || !extensionStatus.loggedIn) {
                setShowModal(true);
            }
        }, 1500); // 1.5 second grace period

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

    // FAST PATH: If previously synced AND extension is currently detected, skip loading
    if (wasPreviouslySynced && extensionStatus.installed && extensionStatus.loggedIn) {
        return <>{children}</>;
    }

    // Show loading while checking (but only briefly)
    if (checking || !verificationComplete) {
        return <LoadingScreen />;
    }

    // Show modal if extension not detected after verification
    if (showModal) {
        return <ExtensionRequiredModal />;
    }

    // Extension installed AND logged in, render children
    return <>{children}</>;
};

export default ExtensionGate;
