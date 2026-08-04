import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "btn-3d bg-banking-gradient text-primary-foreground hover:brightness-110",
        premium:
          "btn-3d bg-banking-gradient text-primary-foreground hover:brightness-110",
        emerald:
          "btn-3d bg-success-gradient text-accent-foreground shadow-glow-emerald hover:brightness-110",
        destructive:
          "border-t border-white/20 bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:-translate-y-0.5 hover:bg-destructive/90 active:scale-95",
        outline:
          "border border-white/15 bg-white/5 text-foreground backdrop-blur-md hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground active:scale-95",
        secondary:
          "border border-white/10 bg-secondary/70 text-secondary-foreground backdrop-blur-md hover:-translate-y-0.5 hover:bg-secondary active:scale-95",
        ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
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
