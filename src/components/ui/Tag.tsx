import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const variants: Record<Variant, string> = {
  default: "bg-surface text-muted border border-border",
  primary: "bg-primary/10 text-primary border border-primary/20",
  secondary: "bg-secondary/20 text-secondary-foreground border border-secondary/30",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/25",
  danger: "bg-accent/10 text-accent border border-accent/20",
  outline: "bg-white text-foreground border border-border",
};

export function Tag({
  variant = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
