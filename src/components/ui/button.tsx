import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-glow hover:bg-accent/90 hover:shadow-glow-cyan/50",
        secondary:
          "bg-surface-raised text-foreground hover:bg-surface-raised/80 hover:text-white border border-border",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-raised hover:border-accent/40",
        ghost:
          "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
        danger:
          "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger",
        success:
          "bg-success text-curia-bg font-semibold hover:bg-success/90",
        glow:
          "bg-gradient-to-r from-accent to-accent-glow text-white shadow-glow hover:opacity-95",
        upvote:
          "text-muted-foreground hover:text-vote-up hover:bg-vote-up/10",
        upvoted:
          "text-vote-up bg-vote-up/15 font-bold",
        downvote:
          "text-muted-foreground hover:text-vote-down hover:bg-vote-down/10",
        downvoted:
          "text-vote-down bg-vote-down/15 font-bold",
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
