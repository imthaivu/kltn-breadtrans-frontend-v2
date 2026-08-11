import { cn } from "@/lib/utils";

export function ScoreGauge({
  value,
  max = 990,
  label,
  sublabel,
  colorVar = "var(--color-primary)",
  size = 168,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  colorVar?: string;
  size?: number;
  className?: string;
}) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const dash = circumference * pct;
  const center = size / 2;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={12}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colorVar}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {Math.round(value)}
          </span>
          {label ? <span className="text-xs font-medium text-muted">{label}</span> : null}
        </div>
      </div>
      {sublabel ? <span className="text-xs text-muted">{sublabel}</span> : null}
    </div>
  );
}
