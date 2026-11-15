import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent/20 text-accent hover:bg-accent/30",
        secondary:
          "border-border bg-surface-raised text-muted-foreground hover:bg-surface-raised/80",
        outline:
          "border-border text-foreground",
        success:
          "border-success/30 bg-success/15 text-success",
        danger:
          "border-danger/30 bg-danger/15 text-danger",
        cyan:
          "border-accent-glow/30 bg-accent-glow/15 text-accent-glow",
        mod:
          "border-accent/40 bg-accent/20 text-accent font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
