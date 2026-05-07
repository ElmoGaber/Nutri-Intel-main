import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary text-primary-foreground shadow-[0_12px_28px_-18px_hsl(var(--primary)/0.9)] hover:bg-primary/90 hover:shadow-[0_18px_34px_-18px_hsl(var(--primary)/0.95)] dark:border-primary/30 dark:shadow-[0_16px_34px_-20px_hsl(var(--primary)/0.65)]",
        destructive:
          "border border-destructive/20 bg-destructive text-destructive-foreground shadow-[0_12px_28px_-18px_hsl(var(--destructive)/0.9)] hover:bg-destructive/90 hover:shadow-[0_18px_34px_-18px_hsl(var(--destructive)/0.95)]",
        outline:
          "border border-border bg-background/85 text-foreground shadow-sm hover:border-primary/35 hover:bg-accent hover:text-accent-foreground dark:bg-background/60",
        secondary:
          "border border-border/70 bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary",
        ghost: "border border-transparent text-foreground hover:bg-accent/80 hover:text-accent-foreground",
        link: "rounded-none border-0 px-0 py-0 text-primary shadow-none hover:underline underline-offset-4",
      },
      size: {
        default: "min-h-10 px-4 py-2.5",
        sm: "min-h-9 rounded-lg px-3 py-2 text-sm",
        lg: "min-h-12 rounded-xl px-6 py-3 text-base",
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
