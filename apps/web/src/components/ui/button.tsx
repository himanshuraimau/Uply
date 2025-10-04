import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive font-sans",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background border-2 border-border hover:bg-primary hover:text-primary-foreground hover-glow rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 rounded-md",
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground hover-glow rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-border hover:bg-primary hover:text-primary-foreground hover-glow rounded-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 border-2 border-transparent hover:border-primary rounded-md",
        link: "text-primary underline-offset-4 hover:underline border-none",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-8 has-[>svg]:px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
