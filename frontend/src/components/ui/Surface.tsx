import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    padded?: boolean;
    muted?: boolean;
}

export function Surface({ className, padded = true, muted = false, ...props }: SurfaceProps) {
    return (
        <div
            className={cn(
                'rounded-[var(--r-lg)] border border-[var(--border)] shadow-[var(--shadow-md)]',
                muted ? 'bg-[var(--bg-subtle)]' : 'bg-[var(--bg-card)]',
                padded && 'p-5 sm:p-6',
                className,
            )}
            {...props}
        />
    );
}

export default Surface;
