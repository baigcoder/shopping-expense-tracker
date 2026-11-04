import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[15px] text-[var(--color-ink)] transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-medium placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:border-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
