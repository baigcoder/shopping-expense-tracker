import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--r-md)] text-sm font-semibold tracking-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#E11D48] text-white shadow-[var(--shadow-sm)] hover:bg-[#BE123C]",
        destructive:
          "bg-[#E11D48] text-white hover:bg-[#BE123C]",
        outline:
          "border border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#F4F0EB]",
        secondary:
          "bg-[#F4F0EB] text-[#1C1917] hover:bg-[#E7E5E4]",
        ghost: "text-[#1C1917] hover:bg-[#F4F0EB]",
        link: "text-[#E11D48] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
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
