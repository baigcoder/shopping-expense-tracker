import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, Menu, X, MessageSquare, Plus } from 'lucide-react';
import { useAuthStore, useUIStore, useModalStore } from '../store/useStore';
import { useNotificationStore } from '../services/notificationService';
import NotificationsPanel from './NotificationsPanel';
import styles from './Header.module.css';

// Custom Logo Component - Finzen
// Custom Logo Component - Finzen
const BrandLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', // Premium Indigo gradient
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <img
                src="/logo.svg"
                alt="Finzen"
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
        </div>
        <span style={{
            fontWeight: 800,
            fontSize: '1.5rem',
            color: '#0F172A',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.5px',
        }}>
            Finzen
        </span>
    </div>
);




const navItems = [
    { path: '/dashboard', label: 'Home' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/bills', label: 'Bills' },
    { path: '/goals', label: 'Goals' },
    { path: '/subscriptions', label: 'Subs' },
    { path: '/insights', label: 'Insights' },
    { path: '/reports', label: 'Reports' },
];

const Header = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { toggleChat } = useUIStore();
    const { openQuickAdd } = useModalStore();
    const unreadCount = useNotificationStore(state => state.notifications.filter(n => !n.read).length);
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.logoSection}>
                <Link to="/dashboard" className={styles.logoLink}>
                    <BrandLogo />
                </Link>
            </div>

            <nav className={styles.navSection}>
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.actionsSection}>
                <button
                    className={`${styles.iconButton} ${styles.settingsBtn}`}
                    aria-label="Settings"
                    onClick={() => navigate('/settings')}
                >
                    <Settings size={22} strokeWidth={2.5} />
                </button>

                <div className={styles.notificationWrapper}>
                    <button
                        className={styles.iconButton}
                        aria-label="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={22} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className={styles.notificationBadge}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <NotificationsPanel
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                    />
                </div>

                <div
                    className={styles.profileAvatar}
                    onClick={() => navigate('/profile')}
                >
                    <img
                        src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=FFD93D&color=000&font-size=0.5&bold=true`}
                        alt="Profile"
                    />
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={styles.mobileNavLink}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <div style={{ borderTop: '2px dashed #CBD5E1', margin: '1rem 1.5rem 0.5rem' }}></div>
                    <button
                        className={styles.mobileNavLink}
                        onClick={() => {
                            setMobileMenuOpen(false);
                            toggleChat();
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={18} />
                            AI Chat
                        </div>
                    </button>
                    <button
                        className={styles.mobileNavLink}
                        onClick={() => {
                            setMobileMenuOpen(false);
                            openQuickAdd();
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Plus size={18} />
                            Add Expense
                        </div>
                    </button>
                    <NavLink
                        to="/settings"
                        className={styles.mobileNavLink}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Settings size={18} />
                            Settings
                        </div>
                    </NavLink>
                </div>
            )}
        </header>
    );
};

export default Header;
