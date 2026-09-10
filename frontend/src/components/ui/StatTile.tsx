import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Surface } from './Surface';

interface StatTileProps {
    label: string;
    value: ReactNode;
    hint?: string;
    icon?: ReactNode;
    className?: string;
}

export function StatTile({ label, value, hint, icon, className }: StatTileProps) {
    return (
        <Surface className={cn('flex items-start justify-between gap-3', className)}>
            <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
                <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
                    {value}
                </p>
                {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
            </div>
            {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand-muted)] text-[var(--brand)]">
                    {icon}
                </div>
            )}
        </Surface>
    );
}

export default StatTile;
