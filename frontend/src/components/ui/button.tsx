import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold tracking-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-brand)] text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:bg-[var(--color-wine)]",
        outline:
          "bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]",
        secondary:
          "bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:bg-[var(--color-muted-surface)]",
        ghost: "text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]",
        link: "text-[var(--color-ink)] underline underline-offset-4 hover:text-[var(--color-ink-secondary)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[14px]",
        lg: "h-12 px-6 text-[16px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
