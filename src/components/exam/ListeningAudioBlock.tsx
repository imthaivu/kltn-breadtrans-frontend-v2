"use client";

import { Card } from "@/components/ui/Card";
import { QuestionCard, type QuestionReviewInfo } from "@/components/exam/QuestionCard";
import type { Question } from "@/lib/api/types";
import type { AudioBlock } from "@/lib/toeic";
import { FiHeadphones } from "react-icons/fi";

/**
 * 1 block = 1 audio clip + các câu hỏi gắn với clip đó (Part 1/2: 1 câu,
 * Part 3/4: thường 2-3 câu) — tránh hiển thị player lặp lại cho mỗi câu.
 */
export function ListeningAudioBlock({
  block,
  numberOf,
  selectedOf,
  onSelect,
  flaggedOf,
  onToggleFlag,
  readOnly,
  reviewOf,
}: {
  block: AudioBlock;
  numberOf: (question: Question) => number;
  selectedOf?: (question: Question) => string | undefined;
  onSelect?: (question: Question, value: string) => void;
  flaggedOf?: (question: Question) => boolean;
  onToggleFlag?: (question: Question) => void;
  readOnly?: boolean;
  reviewOf?: (question: Question) => QuestionReviewInfo | undefined;
}) {
  const nums = block.questions.map(numberOf);
  const rangeLabel =
    nums.length > 1 ? `Câu ${Math.min(...nums)}–${Math.max(...nums)}` : `Câu ${nums[0]}`;

  return (
    <div className="space-y-3">
      {block.audioUrl ? (
        <Card className="space-y-2 bg-surface/60">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <FiHeadphones className="h-4 w-4" /> {rangeLabel} — nghe đoạn audio
          </p>
          <audio controls src={block.audioUrl} className="w-full" />
        </Card>
      ) : null}
      {block.questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          number={numberOf(q)}
          selected={selectedOf?.(q)}
          onSelect={(v) => onSelect?.(q, v)}
          flagged={flaggedOf?.(q)}
          onToggleFlag={onToggleFlag ? () => onToggleFlag(q) : undefined}
          readOnly={readOnly}
          review={reviewOf?.(q)}
          hideMedia
        />
      ))}
    </div>
  );
}
