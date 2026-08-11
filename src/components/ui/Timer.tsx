"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { FiClock } from "react-icons/fi";

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function CountdownTimer({
  durationSeconds,
  onExpire,
  warningThresholdSeconds = 300,
  className,
  paused = false,
}: {
  durationSeconds: number;
  onExpire?: () => void;
  /** Ngưỡng (giây) để chuyển màu cảnh báo — mặc định 5 phút cuối. */
  warningThresholdSeconds?: number;
  className?: string;
  paused?: boolean;
}) {
  // Chỉ dùng giá trị durationSeconds lúc mount — nếu cần reset (đổi đề), parent
  // nên truyền `key` khác để remount thay vì đồng bộ lại qua effect.
  const [remaining, setRemaining] = useState(() => durationSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, onExpire]);

  const isWarning = remaining <= warningThresholdSeconds;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
        isWarning
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border bg-white text-foreground",
        className,
      )}
    >
      <FiClock className={cn("h-4 w-4", isWarning && "animate-pulse")} />
      {formatDuration(remaining)}
    </div>
  );
}
