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
    LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useUIStore, useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '@/lib/sounds';
import { cn } from '@/lib/utils';

const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/cards', icon: CreditCard, label: 'Cards' },
];

const menuItems = [
    { path: '/insights', icon: Brain, label: 'AI Insights' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/goals', icon: PiggyBank, label: 'Goals' },
    { path: '/subscriptions', icon: Repeat, label: 'Subscriptions' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

const MobileBottomNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout: storeLogout } = useAuthStore();

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
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
                    {mainNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
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
                                        "transition-all duration-200"
                                    )}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all duration-300",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                            : "text-slate-400"
                                    )}>
                                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-semibold tracking-tight",
                                        isActive ? "text-blue-600" : "text-slate-400"
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
                            "p-1.5 rounded-xl transition-all duration-300",
                            isMenuOpen || isMenuItemActive
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                : "text-slate-400"
                        )}>
                            {isMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2} />}
                        </div>
                        <span className={cn(
                            "text-[10px] font-semibold tracking-tight",
                            isMenuOpen || isMenuItemActive ? "text-blue-600" : "text-slate-400"
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
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[99]"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="lg:hidden fixed bottom-16 left-0 right-0 z-[99] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 bg-slate-200 rounded-full" />
                            </div>

                            {/* Menu Items */}
                            <div className="grid grid-cols-3 gap-2 px-4 pb-6">
                                {menuItems.map((item, index) => {
                                    const isActive = location.pathname === item.path;
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
                                                    "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200",
                                                    isActive
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                )}
                                            >
                                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-xs font-semibold">{item.label}</span>
                                            </NavLink>
                                        </motion.div>
                                    );
                                })}

                                {/* Logout Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: menuItems.length * 0.05 }}
                                >
                                    <button
                                        onClick={() => {
                                            handleNavClick();
                                            handleLogout();
                                        }}
                                        className="w-full flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                                    >
                                        <LogOut size={24} strokeWidth={2} />
                                        <span className="text-xs font-semibold">Logout</span>
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom padding spacer for content */}
            <div className="lg:hidden h-16" />
        </>
    );
};

export default MobileBottomNav;
