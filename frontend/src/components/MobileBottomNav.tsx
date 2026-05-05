// Mobile Bottom Navigation - Premium iOS-style Tab Bar
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    CreditCard,
    Menu,
    X,
    Target,
    Repeat,
    Settings,
    PiggyBank,
    Brain,
    Bell,
    FileText,
    LogOut,
    Inbox,
    CalendarDays,
    Activity
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import { featureExpansionApi, transactionInboxApi } from '../services/featureExpansionApi';

type BadgeKey = 'inbox' | 'coach' | 'extension';
type MobileNavItem = {
    path: string;
    icon: LucideIcon;
    label: string;
    badgeKey?: BadgeKey;
};

const mainNavItems: MobileNavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/cards', icon: CreditCard, label: 'Cards' },
];

const menuItems: MobileNavItem[] = [
    { path: '/insights', icon: Brain, label: 'AI Insights', badgeKey: 'coach' },
    { path: '/transaction-inbox', icon: Inbox, label: 'Inbox', badgeKey: 'inbox' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/cashflow-calendar', icon: CalendarDays, label: 'Calendar' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/goals', icon: PiggyBank, label: 'Goals' },
    { path: '/subscriptions', icon: Repeat, label: 'Subscriptions' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/extension-health', icon: Activity, label: 'Extension Health', badgeKey: 'extension' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

const formatBadge = (value: number) => value > 99 ? '99+' : String(value);

const MobileBottomNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [badges, setBadges] = useState<Record<BadgeKey, number>>({
        inbox: 0,
        coach: 0,
        extension: 0,
    });
    const location = useLocation();
    const navigate = useNavigate();
    const { logout: storeLogout } = useAuthStore();

    useEffect(() => {
        let mounted = true;

        const loadBadges = async () => {
            try {
                const [inbox, extensionHealth, coach] = await Promise.all([
                    transactionInboxApi.list({ status: 'pending', limit: 1 }),
                    featureExpansionApi.extensionHealth().catch(() => null),
                    featureExpansionApi.currentCoach().catch(() => null),
                ]);

                if (!mounted) return;

                setBadges({
                    inbox: inbox?.pagination?.total || 0,
                    extension: extensionHealth?.failedDetections || extensionHealth?.queuedSyncs || 0,
                    coach: Array.isArray(coach?.actions)
                        ? coach.actions.filter((action: any) => action.status !== 'done').length
                        : 0,
                });
            } catch {
                if (mounted) {
                    setBadges({ inbox: 0, coach: 0, extension: 0 });
                }
            }
        };

        loadBadges();
        const timer = window.setInterval(loadBadges, 60000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

    const handleNavClick = () => {
        soundManager.play('click');
        setIsMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            await supabaseLogout();
            storeLogout();
            localStorage.clear();
            soundManager.play('whoosh');
            navigate('/login');
        } catch (error) {
            storeLogout();
            localStorage.clear();
            navigate('/login');
        }
    };

    // Check if current path is in menu items
    const isMenuItemActive = menuItems.some(item => location.pathname === item.path);

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-4 border-black">
                <div className="flex items-center justify-around h-16 px-1 safe-area-pb">
                    {mainNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className="flex flex-col items-center justify-center flex-1 h-full"
                            >
                                <motion.div
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-0.5",
                                        "transition-all duration-200 w-full"
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className={cn(
                                        "p-1.5 transition-all duration-300 relative border-2",
                                        isActive
                                            ? "bg-black text-white border-black shadow-[2px_2px_0px_#E11D48] -translate-y-1"
                                            : "bg-transparent text-black border-transparent"
                                    )}>
                                        <item.icon size={22} strokeWidth={isActive ? 3 : 2.5} />
                                        {badge > 0 && (
                                            <span className="absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-none border-2 border-black bg-[#E11D48] px-1 text-[10px] font-black text-white shadow-[2px_2px_0px_#000000]">
                                                {formatBadge(badge)}
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest mt-1",
                                        isActive ? "text-[#E11D48]" : "text-black"
                                    )}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            </NavLink>
                        );
                    })}

                    {/* Menu Button */}
                    <motion.button
                        onClick={() => {
                            soundManager.play('click');
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="flex flex-col items-center justify-center flex-1 h-full"
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className={cn(
                            "p-1.5 transition-all duration-300 relative border-2",
                            isMenuOpen || isMenuItemActive
                                ? "bg-black text-white border-black shadow-[2px_2px_0px_#E11D48] -translate-y-1"
                                : "bg-transparent text-black border-transparent"
                        )}>
                            {isMenuOpen ? <X size={22} strokeWidth={3} /> : <Menu size={22} strokeWidth={2.5} />}
                        </div>
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest mt-1",
                            isMenuOpen || isMenuItemActive ? "text-[#E11D48]" : "text-black"
                        )}>
                            More
                        </span>
                    </motion.button>
                </div>
            </nav>

            {/* Slide-up Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-white/80 backdrop-blur-sm z-[99]"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="lg:hidden fixed bottom-16 left-0 right-0 z-[99] bg-white border-t-4 border-black overflow-hidden max-h-[80vh] overflow-y-auto"
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-4 pb-2 border-b-4 border-black mb-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-black">Menu</div>
                            </div>

                            {/* Menu Items */}
                            <div className="grid grid-cols-3 gap-3 px-4 pb-8">
                                {menuItems.map((item, index) => {
                                    const isActive = location.pathname === item.path;
                                    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                                    return (
                                        <motion.div
                                            key={item.path}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <NavLink
                                                to={item.path}
                                                onClick={handleNavClick}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center gap-2 p-4 h-24 border-4 transition-all duration-200",
                                                    isActive
                                                        ? "bg-[#E11D48] border-black text-white shadow-[4px_4px_0px_#000000] -translate-y-1 -translate-x-1"
                                                        : "bg-white border-black text-black shadow-[4px_4px_0px_#000000] active:translate-x-0 active:translate-y-0 active:shadow-none"
                                                )}
                                            >
                                                {badge > 0 && (
                                                    <span className="absolute -right-2 -top-2 flex min-w-[24px] h-6 items-center justify-center border-2 border-black bg-[#E11D48] text-[12px] font-black text-white shadow-[2px_2px_0px_#000000]">
                                                        {formatBadge(badge)}
                                                    </span>
                                                )}
                                                <item.icon size={24} strokeWidth={isActive ? 3 : 2.5} />
                                                <span className={cn(
                                                    "text-[11px] font-black uppercase tracking-widest text-center",
                                                    isActive ? "text-[#E11D48]" : "text-black"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </NavLink>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileBottomNav;
