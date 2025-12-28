
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileHelpButton from '../components/MobileHelpButton';
import AddCardModal from '../components/AddCardModal';
import TransactionModal from '../components/TransactionModal';
import AIChatbot from '../components/AIChatbot';
import ExtensionAlert from '../components/ExtensionAlert';
import QuickAddFAB from '../components/QuickAddFAB';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuthStore, useUIStore } from '../store/useStore';
import { supabaseTransactionService } from '../services/supabaseTransactionService';
import { fetchAiTipInBackground } from '../services/aiTipCacheService';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
    const { user } = useAuthStore();
    const { sidebarOpen, sidebarHovered } = useUIStore();

    // Background AI tip fetching when transactions update
    useEffect(() => {
        if (!user?.id) return;

        const fetchSpendingAndTriggerAI = async () => {
            try {
                const transactions = await supabaseTransactionService.getAll(user.id);
                const expenses = transactions.filter(t => t.type === 'expense');
                const monthlyTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

                const categoryTotals: Record<string, number> = {};
                expenses.forEach(t => {
                    const cat = t.category || 'Other';
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
                });
                const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

                // Trigger background AI fetch
                fetchAiTipInBackground(user.id, {
                    monthlyTotal,
                    topCategory: topCat?.[0] || 'Various',
                    categoryAmount: topCat?.[1] || 0
                });
            } catch (error) {
                console.log('Background AI fetch skipped:', error);
            }
        };

        // Fetch on login/mount
        fetchSpendingAndTriggerAI();

        // Listen for transaction updates
        const handleUpdate = () => fetchSpendingAndTriggerAI();
        window.addEventListener('new-transaction', handleUpdate);
        window.addEventListener('transactions-synced', handleUpdate);

        return () => {
            window.removeEventListener('new-transaction', handleUpdate);
            window.removeEventListener('transactions-synced', handleUpdate);
        };
    }, [user?.id]);

    return (
        <div className={`${styles.appContainer} ${styles.withSidebar} ${sidebarOpen || sidebarHovered ? styles.sidebarExpanded : ''}`}>
            <Sidebar />
            <ExtensionAlert />

            <main className={`${styles.contentWrapper} pb-20 lg:pb-0`}>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            <AddCardModal />
            <TransactionModal />
            <QuickAddFAB />
            <MobileHelpButton />
            <AIChatbot />
        </div>
    );
};


export default DashboardLayout;
