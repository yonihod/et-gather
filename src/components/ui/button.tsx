"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button btn-crosshair inline-flex shrink-0 items-center justify-center border border-transparent text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary/60 hover:bg-primary/90 hover:border-primary hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]",
        outline:
          "border-border bg-transparent text-foreground hover:bg-secondary hover:border-muted-foreground/40",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 hover:border-muted-foreground/30",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25 hover:border-destructive/50",
        link: "text-primary underline-offset-4 hover:underline tracking-normal font-medium normal-case",
      },
      size: {
        default: "h-9 gap-2 px-4",
        xs: "h-6 gap-1 px-2 text-[10px]",
        sm: "h-7 gap-1 px-3 text-xs",
        lg: "h-11 gap-2 px-6 text-sm",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-11",
      },
      tactical: {
        true: "clip-tactical",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      tactical: true,
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  tactical = true,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { tactical?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, tactical, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
