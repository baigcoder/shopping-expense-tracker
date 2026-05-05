
import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileHelpButton from '../components/MobileHelpButton';
import AddCardModal from '../components/AddCardModal';
import TransactionModal from '../components/TransactionModal';
import ExtensionWall from '../components/ExtensionWall';
import ErrorBoundary from '../components/ErrorBoundary';
import { useUIStore } from '../store/useStore';
import styles from './DashboardLayout.module.css';

const AIChatbot = lazy(() => import('../components/AIChatbot'));

const DashboardLayout = () => {
    const { sidebarOpen, sidebarHovered } = useUIStore();
    const [assistantReady, setAssistantReady] = useState(false);

    useEffect(() => {
        const loadAssistant = () => setAssistantReady(true);
        const win = window as any;
        const idleId = typeof win.requestIdleCallback === 'function'
            ? win.requestIdleCallback(loadAssistant, { timeout: 1500 })
            : window.setTimeout(loadAssistant, 900);

        return () => {
            if (typeof win.cancelIdleCallback === 'function' && typeof idleId === 'number') {
                win.cancelIdleCallback(idleId);
            } else {
                window.clearTimeout(idleId as number);
            }
        };
    }, []);

    return (
        <div className={`${styles.appContainer} ${styles.withSidebar} ${sidebarOpen || sidebarHovered ? styles.sidebarExpanded : ''}`}>
            <Sidebar />
            <ExtensionWall />

            <main className={`${styles.contentWrapper} pb-20 lg:pb-0`}>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            <AddCardModal />
            <TransactionModal />
            <MobileHelpButton />
            {assistantReady && (
                <Suspense fallback={null}>
                    <AIChatbot />
                </Suspense>
            )}
        </div>
    );
};


export default DashboardLayout;
