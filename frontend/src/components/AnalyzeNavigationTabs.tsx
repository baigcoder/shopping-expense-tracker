import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyzeNavigationTabsProps {
    badges?: {
        trends?: number;
        twin?: number;
        reports?: number;
    };
    className?: string;
}

export const AnalyzeNavigationTabs: React.FC<AnalyzeNavigationTabsProps> = ({ badges, className }) => {
    const location = useLocation();

    const tabs = [
        {
            path: '/analytics',
            label: 'Spending Patterns',
            icon: BarChart3,
            badge: badges?.trends,
            active: location.pathname === '/analytics' || location.pathname === '/analyze',
        },
        {
            path: '/money-twin',
            label: 'Money Twin & Forecast',
            icon: Sparkles,
            badge: badges?.twin,
            active: location.pathname === '/money-twin',
        },
        {
            path: '/reports',
            label: 'Reports & Exports',
            icon: FileText,
            badge: badges?.reports,
            active: location.pathname === '/reports',
        },
    ];

    return (
        <nav
            aria-label="Analytics Sections"
            className={cn(
                'flex items-center gap-1.5 p-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-x-auto no-scrollbar',
                className
            )}
        >
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-tight transition-all duration-200 whitespace-nowrap select-none shrink-0',
                            tab.active
                                ? 'bg-[var(--color-ink)] text-white shadow-xs font-bold'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-white/60'
                        )}
                    >
                        <Icon className={cn('h-3.5 w-3.5 transition-colors', tab.active ? 'text-[var(--color-orange)]' : 'text-[var(--color-muted)]')} />
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span
                                className={cn(
                                    'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums font-mono',
                                    tab.active
                                        ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                                        : 'bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
                                )}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
};
