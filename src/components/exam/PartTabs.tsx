"use client";

import { cn } from "@/lib/utils";
import type { PartGroup } from "@/lib/toeic";
import { FiHeadphones, FiBookOpen } from "react-icons/fi";

export function PartTabs({
  groups,
  activeIndex,
  onChange,
  answeredCountOf,
}: {
  groups: PartGroup[];
  activeIndex: number;
  onChange: (index: number) => void;
  answeredCountOf?: (group: PartGroup) => number;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
      {groups.map((group, i) => {
        const active = i === activeIndex;
        const answered = answeredCountOf?.(group) ?? 0;
        const total = group.questions.length;
        const Icon = group.skill === "listening" ? FiHeadphones : FiBookOpen;
        return (
          <button
            key={`${group.part ?? "unknown"}-${i}`}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "flex shrink-0 flex-col items-start gap-0.5 rounded-[var(--radius-control)] border px-3.5 py-2 text-left transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-white text-foreground hover:bg-surface",
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {group.skill ? <Icon className="h-3.5 w-3.5 opacity-70" /> : null}
              {group.label}
            </span>
            <span className="text-xs text-muted">
              {answered}/{total} câu
            </span>
          </button>
        );
      })}
    </div>
  );
}
