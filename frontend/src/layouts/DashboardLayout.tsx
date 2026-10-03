import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CommandPalette from '../components/CommandPalette';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileHelpButton from '../components/MobileHelpButton';
import AddCardModal from '../components/AddCardModal';
import TransactionModal from '../components/TransactionModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useUIStore, useModalStore } from '../store/useStore';
import styles from './DashboardLayout.module.css';

const AIChatbot = lazy(() => import('../components/AIChatbot'));

const DashboardLayout = () => {
    const { sidebarOpen, sidebarHovered, setSidebarOpen } = useUIStore();
    const isAddCardOpen = useModalStore((s) => s.isAddCardOpen);
    const isAddTransactionOpen = useModalStore((s) => s.isAddTransactionOpen);
    const [assistantReady, setAssistantReady] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    useRealtimeSync();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarOpen]);

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
            {/* Desktop & Mobile Responsive Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Universal Top Header Bar */}
                <TopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

                {/* Main Content Area */}
                <main className={`${styles.contentWrapper} flex-1 pb-24 lg:pb-8`}>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>

            {/* Universal Command Palette (⌘K) */}
            <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
            />

            {/* Mobile Bottom Navigation (5 Canonical Pillars + Quick Action) */}
            <MobileBottomNav />

            {/* Modal Portals */}
            {isAddCardOpen && <AddCardModal />}
            {isAddTransactionOpen && <TransactionModal />}
            <MobileHelpButton />

            {/* Embedded AI Assistant */}
            {assistantReady && (
                <Suspense fallback={null}>
                    <AIChatbot />
                </Suspense>
            )}
        </div>
    );
};

export default DashboardLayout;
