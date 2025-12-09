// Sidebar Component
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    Plus,
    RefreshCw,
    Landmark,
    Target,
    CreditCard,
    Repeat
} from 'lucide-react';
import { useUIStore, useModalStore, useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import styles from './Sidebar.module.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/subscriptions', icon: Repeat, label: 'Subscriptions' },
    { path: '/recurring', icon: RefreshCw, label: 'Recurring' },
    { path: '/accounts', icon: Landmark, label: 'Accounts' },
    { path: '/cards', icon: CreditCard, label: 'Cards' },
];

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { openAddTransaction } = useModalStore();
    const { logout: storeLogout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await supabaseLogout();
            storeLogout();
            // Clear ALL localStorage to prevent zombie sessions
            localStorage.clear();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            storeLogout();
            localStorage.clear();
            navigate('/login');
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                        onClick={toggleSidebar}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}
                initial={false}
                animate={{ width: sidebarOpen ? 280 : 80 }}
                transition={{ duration: 0.3 }}
            >
                {/* Logo */}
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <ShoppingCart size={24} />
                    </div>
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={styles.logoText}
                            >
                                ExpenseTracker
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Add Transaction Button */}
                <button
                    className={`${styles.addButton} ${!sidebarOpen ? styles.addButtonCollapsed : ''}`}
                    onClick={openAddTransaction}
                >
                    <Plus size={20} />
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                Add Transaction
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <AnimatePresence>
                                {sidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className={styles.bottom}>
                    <button className={styles.navItem}>
                        <Settings size={20} />
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <button className={`${styles.navItem} ${styles.logout}`} onClick={handleLogout}>
                        <LogOut size={20} />
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Toggle Button */}
                <button className={styles.toggle} onClick={toggleSidebar}>
                    {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
            </motion.aside>
        </>
    );
};

export default Sidebar;
