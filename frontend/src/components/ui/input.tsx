import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[var(--r-md)] border border-[#E7E5E4] bg-white px-3 py-2 text-sm text-[#1C1917] shadow-[var(--shadow-sm)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A8A29E] focus-visible:outline-none focus-visible:border-[#E11D48] focus-visible:ring-2 focus-visible:ring-[#E11D48]/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
