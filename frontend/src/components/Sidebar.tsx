// Cashly Sidebar Component - Enhanced Smooth Animations & Interaction Logic
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    Plus,
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

const smoothTransition = {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1]
};

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
    const location = useLocation();

    const isExpanded = sidebarOpen || sidebarHovered;

    // Track mouse interaction state to prevent expansion on page load
    const hasUserInteractedRef = useRef(false);
    const mouseMovementCountRef = useRef(0);
    const isMouseInsideRef = useRef(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset all hover state on route change
    useEffect(() => {
        setSidebarHovered(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    }, [location.pathname, setSidebarHovered]);

    // Track mouse movement to confirm intentional interaction
    const handleMouseMove = useCallback(() => {
        if (!hasUserInteractedRef.current) {
            mouseMovementCountRef.current += 1;
            if (mouseMovementCountRef.current >= 3) {
                hasUserInteractedRef.current = true;
            }
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isMouseInsideRef.current = true;

        if (collapseTimeoutRef.current) {
            clearTimeout(collapseTimeoutRef.current);
            collapseTimeoutRef.current = null;
        }

        // Only expand if user has moved the mouse deliberately
        if (!hasUserInteractedRef.current) return;

        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            if (isMouseInsideRef.current) {
                setSidebarHovered(true);
            }
        }, 300); // 300ms delay for premium feel
    }, [setSidebarHovered]);

    const handleMouseLeave = useCallback(() => {
        isMouseInsideRef.current = false;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        collapseTimeoutRef.current = setTimeout(() => {
            setSidebarHovered(false);
        }, 200);
    }, [setSidebarHovered]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
        };
    }, []);

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
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
                        onClick={() => toggleSidebar()}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed top-0 left-0 h-screen z-50",
                    "bg-white border-r border-slate-200/60",
                    "flex flex-col",
                    "shadow-[10px_0_40px_rgba(0,0,0,0.04)]",
                    "max-lg:translate-x-[-100%]",
                    sidebarOpen && "max-lg:translate-x-0"
                )}
                initial={false}
                animate={{ width: isExpanded ? 240 : 80 }}
                transition={{ type: "spring", stiffness: 350, damping: 35, mass: 1 }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Logo Section */}
                <div className="h-18 flex items-center px-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white font-bold text-xl drop-shadow-sm">C</span>
                        </motion.div>
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={smoothTransition}
                                    className="flex flex-col overflow-hidden"
                                >
                                    <span className="font-display font-bold text-xl text-[#0F172A] leading-tight">
                                        {BRAND.name}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-[#1d4ed8] font-bold opacity-80">
                                        Premium Finance
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


                {/* Navigation Links */}
                <nav className="flex-1 px-3 space-y-1 overflow-hidden pt-2">
                    {navItems.map((item, index) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                cn(
                                    "group relative flex items-center gap-3 rounded-lg transition-all duration-300",
                                    "font-semibold text-[14px]",
                                    isExpanded ? "px-4 py-2.5" : "px-0 py-2.5 justify-center",
                                    isActive
                                        ? "text-white shadow-md shadow-blue-500/10"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]"
                                )
                            }
                            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' } : {}}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn("flex items-center justify-center flex-shrink-0 transition-all duration-300", isActive ? "text-white scale-110" : "text-slate-400 group-hover:text-[#1d4ed8]")}>
                                        <item.icon className={cn("h-[20px] w-[20px]", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {isExpanded && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -8 }}
                                                transition={{ ...smoothTransition, delay: index * 0.01 }}
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

                <div className="p-3 border-t border-slate-100 space-y-1">
                    <NavLink
                        to="/settings"
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-lg transition-all duration-300",
                                "font-semibold text-[14px]",
                                isExpanded ? "px-4 py-2.5" : "px-0 py-2.5 justify-center",
                                isActive
                                    ? "text-white shadow-md shadow-blue-500/10"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]"
                            )
                        }
                        style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' } : {}}
                    >
                        {({ isActive }) => (
                            <>
                                <Settings className={cn("h-[20px] w-[20px]", isActive ? "text-white scale-110 stroke-[2.5px]" : "text-slate-400 group-hover:text-[#1d4ed8]")} />
                                <AnimatePresence mode="wait">
                                    {isExpanded && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Settings</motion.span>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </NavLink>
                    <button
                        className={cn(
                            "w-full flex items-center gap-3 rounded-lg transition-all duration-300",
                            "font-semibold text-[14px]",
                            isExpanded ? "px-4 py-2.5" : "px-0 py-2.5 justify-center",
                            "text-rose-600 hover:bg-rose-50"
                        )}
                        onClick={() => { handleNavClick(); handleLogout(); }}
                    >
                        <LogOut className="h-[20px] w-[20px] text-current" />
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Logout</motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
