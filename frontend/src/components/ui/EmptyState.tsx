import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from './Surface';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
    return (
        <Surface className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
            {icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    {icon}
                </div>
            )}
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            {description && (
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </Surface>
    );
}

export default EmptyState;
