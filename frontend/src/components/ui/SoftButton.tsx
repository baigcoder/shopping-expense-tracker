import { Button, type ButtonProps } from './button';
import { cn } from '@/lib/utils';

export function SoftButton({ className, variant = 'default', ...props }: ButtonProps) {
    return (
        <Button
            variant={variant}
            className={cn('rounded-[var(--r-md)] font-semibold normal-case tracking-normal', className)}
            {...props}
        />
    );
}

export default SoftButton;
