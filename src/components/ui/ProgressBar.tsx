import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  className,
  trackClassName,
  barClassName,
  label,
}: {
  value: number;
  max: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  label?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "h-2 flex-1 overflow-hidden rounded-full bg-border/60",
          trackClassName,
        )}
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <span className="shrink-0 text-xs font-medium text-muted">{label}</span>
      ) : null}
    </div>
  );
}
