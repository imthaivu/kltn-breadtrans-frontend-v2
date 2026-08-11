import { cn } from "@/lib/utils";

export function BarStat({
  label,
  correct,
  total,
  accuracyPercent,
  className,
}: {
  label: string;
  correct: number;
  total: number;
  accuracyPercent?: number;
  className?: string;
}) {
  const pct =
    accuracyPercent ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
  const colorClass =
    pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-accent";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-muted">
          {correct}/{total} · <strong className="text-foreground">{pct}%</strong>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
