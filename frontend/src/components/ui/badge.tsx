import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-hover)]",
        secondary:
          "border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
        outline: "border-[var(--border)] text-[var(--text-primary)]",
        success:
          "border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300",
        warning:
          "border-amber-200/60 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300",
        info:
          "border-blue-200/60 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300",
        brand:
          "border-rose-200/60 bg-rose-50 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
