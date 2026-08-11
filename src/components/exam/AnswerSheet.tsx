"use client";

import { cn } from "@/lib/utils";
import type { Question } from "@/lib/api/types";

export function AnswerSheet({
  questions,
  numberOf,
  currentQuestionId,
  isAnswered,
  isFlagged,
  onJump,
  className,
}: {
  questions: Question[];
  numberOf: (question: Question) => number;
  currentQuestionId?: number;
  isAnswered: (question: Question) => boolean;
  isFlagged: (question: Question) => boolean;
  onJump: (question: Question) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
        {questions.map((q) => {
          const answered = isAnswered(q);
          const flagged = isFlagged(q);
          const current = currentQuestionId === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(q)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                current && "ring-2 ring-primary ring-offset-1",
                flagged
                  ? "border-secondary bg-secondary/25 text-secondary-foreground"
                  : answered
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted hover:bg-surface",
              )}
              title={`Câu ${numberOf(q)}${flagged ? " · đã đánh dấu" : ""}${answered ? " · đã trả lời" : " · chưa làm"}`}
            >
              {numberOf(q)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-primary bg-primary" /> Đã trả lời
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-secondary bg-secondary/25" /> Đã đánh dấu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-border bg-white" /> Chưa làm
        </span>
      </div>
    </div>
  );
}
