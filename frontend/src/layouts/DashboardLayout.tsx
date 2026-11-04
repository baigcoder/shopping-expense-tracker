import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/app/AppShell';
import CommandPalette from '../components/CommandPalette';
import AddCardModal from '../components/AddCardModal';
import TransactionModal from '../components/TransactionModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useAuthStore, useModalStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import { transactionInboxApi } from '../services/featureExpansionApi';
import { ExtensionRequired, useExtensionLink } from '../features/extension/ExtensionRequired';

const AIChatbot = lazy(() => import('../components/AIChatbot'));

const DashboardLayout = () => {
    const navigate = useNavigate();
    const { user, logout: storeLogout } = useAuthStore();
    const isAddCardOpen = useModalStore((s) => s.isAddCardOpen);
    const isAddTransactionOpen = useModalStore((s) => s.isAddTransactionOpen);
    const [assistantReady, setAssistantReady] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [inboxCount, setInboxCount] = useState(0);

    useRealtimeSync();
    // The dashboard opens only when the extension is installed here and signed in to this same account.
    const link = useExtensionLink({ id: user?.id, email: user?.email });

    useEffect(() => {
        let alive = true;
        const refresh = () => transactionInboxApi.list({ status: 'pending', limit: 1 })
            .then((r) => alive && setInboxCount(r?.pagination?.total || r?.data?.length || 0))
            .catch(() => undefined);
        refresh();
        const id = window.setInterval(refresh, 60000);
        return () => { alive = false; window.clearInterval(id); };
    }, []);

    useEffect(() => {
        // Load the assistant after the page settles so it never delays the first paint.
        const id = window.setTimeout(() => setAssistantReady(true), 900);
        return () => window.clearTimeout(id);
    }, []);

    const signOut = async () => {
        try { await supabaseLogout(); } finally {
            storeLogout();
            localStorage.clear();
            navigate('/login');
        }
    };

    if (link.state !== 'linked') {
        return <ExtensionRequired state={link.state} email={user?.email} extensionEmail={link.extensionEmail} onCheck={link.check} onSignOut={() => void signOut()} />;
    }

    return (
        <AppShell
            userName={user?.name || user?.email?.split('@')[0] || 'You'}
            userDetail={user?.email || ''}
            inboxCount={inboxCount}
            onSignOut={() => void signOut()}
        >
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>

            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
            {isAddCardOpen && <AddCardModal />}
            {isAddTransactionOpen && <TransactionModal />}
            {assistantReady && (
                <Suspense fallback={null}>
                    <AIChatbot />
                </Suspense>
            )}
        </AppShell>
    );
};

export default DashboardLayout;
