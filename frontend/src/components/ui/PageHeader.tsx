import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
    return (
        <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0 space-y-1.5">
                {eyebrow && (
                    <p className="text-xs font-medium text-[var(--text-muted)]">{eyebrow}</p>
                )}
                <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-[0.95rem]">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}

export default PageHeader;
