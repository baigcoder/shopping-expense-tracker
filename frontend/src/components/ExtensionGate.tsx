// Extension Gate - Wraps protected routes
import { ReactNode, useEffect, useState } from 'react';
import { useExtensionSync } from '../hooks/useExtensionSync';
import ExtensionRequiredModal from './ExtensionRequiredModal';
import LoadingScreen from './LoadingScreen';

// Check localStorage sync flag directly (fast synchronous check)
const EXTENSION_SYNCED_KEY = 'finzen_extension_synced';

const isPreviouslySynced = (): boolean => {
    try {
        const syncedData = localStorage.getItem(EXTENSION_SYNCED_KEY);
        if (syncedData) {
            const data = JSON.parse(syncedData);
            return data.synced === true && !!data.email;
        }
    } catch (e) {
        console.error('Error checking sync status:', e);
    }
    return false;
};

interface ExtensionGateProps {
    children: ReactNode;
}

const ExtensionGate = ({ children }: ExtensionGateProps) => {
    const { extensionStatus, checking } = useExtensionSync();
    const [showModal, setShowModal] = useState(false);
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);

    // FAST PATH: Check persistent sync flag immediately on mount
    // This is synchronous and runs before any async checks
    const [wasPreviouslySynced] = useState(() => isPreviouslySynced());

    // Listen for extension sync event - hide modal immediately when synced
    useEffect(() => {
        const handleExtensionSynced = () => {
            console.log('ExtensionGate: Extension synced, hiding modal');
            setShowModal(false);
        };

        window.addEventListener('extension-synced', handleExtensionSynced);
        return () => window.removeEventListener('extension-synced', handleExtensionSynced);
    }, []);

    // Wait a bit after initial check to give extension time to sync
    // BUT skip this entirely if we were previously synced
    useEffect(() => {
        // Skip all waiting if previously synced
        if (wasPreviouslySynced) {
            setInitialCheckComplete(true);
            return;
        }

        if (!checking && !initialCheckComplete) {
            // Give extension 2 seconds to sync before deciding to show modal
            const timer = setTimeout(() => {
                setInitialCheckComplete(true);
                // Only show modal if extension is still not detected
                if (!extensionStatus.installed || !extensionStatus.loggedIn) {
                    console.log('ExtensionGate: Extension not detected after 2s, showing modal');
                    setShowModal(true);
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [checking, initialCheckComplete, extensionStatus.installed, extensionStatus.loggedIn, wasPreviouslySynced]);

    // Hide modal when extension becomes detected
    useEffect(() => {
        if (extensionStatus.installed && extensionStatus.loggedIn) {
            setShowModal(false);
        }
    }, [extensionStatus.installed, extensionStatus.loggedIn]);

    // FAST PATH: If previously synced, render children immediately (no loading, no modal, no waiting)
    // This is the key optimization - trust the localStorage flag and skip ALL async checks
    if (wasPreviouslySynced) {
        return <>{children}</>;
    }

    // Show loading while initial checking (only for new users who never synced)
    if (checking || !initialCheckComplete) {
        return <LoadingScreen />;
    }

    // Show modal only if extension not detected after waiting
    if (showModal && (!extensionStatus.installed || !extensionStatus.loggedIn)) {
        return <ExtensionRequiredModal />;
    }

    // Extension installed AND logged in, render children
    return <>{children}</>;
};

export default ExtensionGate;
