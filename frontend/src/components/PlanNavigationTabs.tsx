import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Target, Repeat, PiggyBank, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanNavigationTabsProps {
    badges?: {
        budgets?: number;
        commitments?: number;
        goals?: number;
        calendar?: number;
    };
    className?: string;
}

export const PlanNavigationTabs: React.FC<PlanNavigationTabsProps> = ({ badges, className }) => {
    const location = useLocation();

    const tabs = [
        {
            path: '/budgets',
            label: 'Budgets & Limits',
            icon: Target,
            badge: badges?.budgets,
            active: location.pathname === '/budgets' || location.pathname === '/plan/budgets' || location.pathname === '/plan',
        },
        {
            path: '/subscriptions',
            label: 'Commitments & Bills',
            icon: Repeat,
            badge: badges?.commitments,
            active: location.pathname === '/subscriptions' || location.pathname === '/bills' || location.pathname === '/reminders' || location.pathname === '/plan/commitments',
        },
        {
            path: '/goals',
            label: 'Savings Goals',
            icon: PiggyBank,
            badge: badges?.goals,
            active: location.pathname === '/goals' || location.pathname === '/plan/goals',
        },
        {
            path: '/cashflow-calendar',
            label: 'Cashflow Timeline',
            icon: CalendarDays,
            badge: badges?.calendar,
            active: location.pathname === '/cashflow-calendar' || location.pathname === '/plan/calendar',
        },
    ];

    return (
        <nav
            aria-label="Planning Sections"
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
