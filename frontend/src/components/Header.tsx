import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Settings, Menu, Sun, Moon, Plus, Search } from 'lucide-react';
import { useAuthStore, useUIStore, useModalStore } from '../store/useStore';
import { useNotificationStore } from '../services/notificationService';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import NotificationsPanel from './NotificationsPanel';
import SyncStatus from './SyncStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const Header = () => {
    const navigate   = useNavigate();
    const { user }   = useAuthStore();
    const { toggleSidebar, openQuickAdd } = useUIStore() as any;
    const { openQuickAdd: openModalQuickAdd } = useModalStore() as any;
    const unreadCount = useNotificationStore(s => s.notifications.filter(n => !n.read).length);
    const [showNotifs, setShowNotifs]   = useState(false);
    const [isDark, setIsDark]           = useState(() => document.documentElement.classList.contains('dark'));
    const { connectionStatus, reconnect } = useRealtimeSync();

    const toggleTheme = () => {
        const html = document.documentElement;
        const next = !isDark;
        html.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setIsDark(next);
    };

    const avatarUrl = user?.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&font-size=0.45&bold=true`;

    return (
        <header
            className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 px-4 sm:px-6"
            style={{
                background: '#FFFFFF',
                borderBottom: '4px solid #000000',
            }}
        >
            {/* Left — burger + brand on mobile */}
            <div className="flex items-center gap-3">
                <button
                    aria-label="Toggle sidebar"
                    onClick={toggleSidebar}
                    className="flex h-10 w-10 items-center justify-center border-3 border-black transition-all lg:hidden bg-white hover:bg-black hover:text-white"
                >
                    <Menu className="h-6 w-6" strokeWidth={3} />
                </button>

                {/* Page title / breadcrumb slot — intentionally minimal */}
                <span className="hidden text-sm font-bold sm:block" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
                {/* Realtime sync chip */}
                <div className="hidden sm:block">
                    <SyncStatus status={connectionStatus} onReconnect={reconnect} />
                </div>

                {/* Quick Add */}
                <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={openModalQuickAdd || openQuickAdd}
                    aria-label="Add transaction"
                    className="flex items-center gap-2 border-3 border-black bg-black px-4 py-2 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#E11D48] transition-all"
                    whileHover={{ translateX: -2, translateY: -2, boxShadow: '6px 6px 0px #E11D48' }}
                >
                    <Plus className="h-4 w-4" strokeWidth={4} />
                    <span className="hidden sm:inline">Add</span>
                </motion.button>

                {/* Theme toggle */}
                <button
                    aria-label="Toggle theme"
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={isDark ? 'sun' : 'moon'}
                            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                            animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                            exit={{   opacity: 0, rotate:  30,  scale: 0.7 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                        </motion.span>
                    </AnimatePresence>
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        aria-label="Notifications"
                        onClick={() => setShowNotifs(v => !v)}
                        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <Bell className="h-[18px] w-[18px]" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
                                  style={{ background: 'var(--danger)' }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <NotificationsPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
                </div>

                {/* Settings */}
                <button
                    aria-label="Settings"
                    onClick={() => navigate('/settings')}
                    className="hidden h-9 w-9 items-center justify-center rounded-xl transition-all sm:flex"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    <Settings className="h-[18px] w-[18px]" />
                </button>

                {/* Avatar */}
                <button
                    aria-label="Profile"
                    onClick={() => navigate('/profile')}
                    className="ml-2 h-10 w-10 overflow-hidden border-3 border-black shadow-[3px_3px_0px_#000000] transition-all hover:scale-105"
                >
                    <img src={avatarUrl} alt={user?.name || 'Profile'} className="h-full w-full object-cover" />
                </button>
            </div>
        </header>
    );
};

export default Header;
