import { ReactNode } from 'react';
import Header from '../components/Header';
import styles from './DashboardLayout.module.css';
import { Outlet } from 'react-router-dom';
import AddCardModal from '../components/AddCardModal';
import AIChatbot from '../components/AIChatbot';
import ExtensionAlert from '../components/ExtensionAlert';
import QuickAddFAB from '../components/QuickAddFAB';

const DashboardLayout = () => {
    return (
        <div className={styles.appContainer}>
            <Header />
            <ExtensionAlert />
            <main className={styles.contentWrapper}>
                <Outlet />
            </main>
            <AddCardModal />
            <QuickAddFAB />
            <AIChatbot />
        </div>
    );
};

export default DashboardLayout;
