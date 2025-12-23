// Cashly Sidebar Component - Midnight Coral Theme
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    Target,
    CreditCard,
    Repeat,
    Brain,
    PiggyBank,
    ChevronLeft,
    ChevronRight,
    Plus,
    Wallet,
    TrendingUp,
    Lightbulb,
    FileText,
    Bell
} from 'lucide-react';
import { useUIStore, useModalStore, useAuthStore } from '../store/useStore';
import { logout as supabaseLogout } from '../config/supabase';
import genZToast from '../services/genZToast';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/sounds';
import BRAND from '@/config/branding';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/insights', icon: Brain, label: 'AI Insights' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/goals', icon: PiggyBank, label: 'Goals' },
    { path: '/subscriptions', icon: Repeat, label: 'Subscriptions' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/cards', icon: CreditCard, label: 'Cards' },
];

const Sidebar = () => {
    const {
        sidebarOpen,
        toggleSidebar,
        sidebarHovered,
        setSidebarHovered,
        setSidebarOpen
    } = useUIStore();
    const { openAddTransaction } = useModalStore();
    const { logout: storeLogout } = useAuthStore();
    const navigate = useNavigate();

    const isExpanded = sidebarOpen || sidebarHovered;

    const handleNavClick = () => {
        soundManager.play('click');
        setSidebarOpen(false);
        setSidebarHovered(false);
    };

    const handleLogout = async () => {
        try {
            await supabaseLogout();
            storeLogout();
            localStorage.clear();
            genZToast.success("See you soon! 👋");
            soundManager.play('whoosh');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => toggleSidebar()}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed top-0 left-0 h-screen z-50",
                    "bg-card border-r border-border",
                    "flex flex-col",
                    "transition-all duration-300 ease-out",
                    "shadow-xl shadow-black/5",
                    "max-lg:translate-x-[-100%]",
                    sidebarOpen && "max-lg:translate-x-0"
                )}
                initial={false}
                animate={{ width: isExpanded ? 260 : 80 }}
                transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-primary-foreground font-bold text-lg">C</span>
                        </div>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col"
                                >
                                    <span className="font-display font-bold text-lg text-foreground">
                                        {BRAND.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground -mt-0.5">{BRAND.tagline}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Add Transaction Button */}
                <div className={cn("px-3 py-4", !isExpanded && "px-4")}>
                    <button
                        className={cn(
                            "w-full flex items-center justify-center gap-2",
                            "bg-primary hover:bg-primary/90",
                            "text-primary-foreground font-medium",
                            "rounded-xl transition-all duration-200",
                            "shadow-lg shadow-primary/20",
                            "hover:shadow-primary/30 hover:scale-[1.02]",
                            "active:scale-[0.98]",
                            isExpanded ? "h-11 px-4" : "h-11 w-11 mx-auto"
                        )}
                        onClick={() => { soundManager.play('click'); openAddTransaction(); }}
                    >
                        <Plus className="h-5 w-5" />
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    Add Transaction
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                    "text-slate-600 transition-all duration-200",
                                    "hover:bg-[#3B82F6] hover:text-white",
                                    isActive && "!bg-[#3B82F6] !text-white font-medium shadow-md",
                                    !isExpanded && "justify-center px-0"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "flex items-center justify-center transition-colors duration-200",
                                        isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                                    )}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-slate-200 space-y-1">
                    <NavLink
                        to="/settings"
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                "text-slate-600 transition-all duration-200",
                                "hover:bg-[#3B82F6] hover:text-white",
                                isActive && "!bg-[#3B82F6] !text-white font-medium shadow-md",
                                !isExpanded && "justify-center px-0"
                            )
                        }
                    >
                        <Settings className="h-5 w-5" />
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>

                    <button
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                            "text-red-500 font-medium transition-all duration-200",
                            "hover:bg-red-50 hover:text-red-600",
                            !isExpanded && "justify-center px-0"
                        )}
                        onClick={() => {
                            handleNavClick();
                            handleLogout();
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
