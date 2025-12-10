import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import NotificationsPanel from './NotificationsPanel';
import styles from './Header.module.css';

// Custom Logo Component - Vibe Tracker
const BrandLogo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img
            src="/logo.png"
            alt="Vibe Tracker"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
        />
        <span style={{
            fontWeight: 800,
            fontSize: '1.1rem',
            color: '#000',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.5px'
        }}>
            Vibe Tracker
        </span>
    </div>
);



const navItems = [
    { path: '/dashboard', label: 'Home' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/goals', label: 'Goals' },
    { path: '/subscriptions', label: 'Subs' },
    { path: '/insights', label: 'Insights' },
    { path: '/reports', label: 'Reports' },
];

const Header = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <Link to="/dashboard" className={styles.logo}>
                    <BrandLogo />
                </Link>

                <nav className={styles.nav}>
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
            </div>

            <div className={styles.right}>
                <button
                    className={styles.iconButton}
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
                        <span className={styles.notificationBadge}>3</span>
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
                </div>
            )}
        </header>
    );
};

export default Header;
