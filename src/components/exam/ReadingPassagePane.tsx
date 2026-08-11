"use client";

import { Card } from "@/components/ui/Card";
import { QuestionCard, type QuestionReviewInfo } from "@/components/exam/QuestionCard";
import type { Question } from "@/lib/api/types";
import type { PassageBlock } from "@/lib/toeic";
import { FiFileText } from "react-icons/fi";

/**
 * Split view: đoạn văn (passage) bên trái/trên, các câu hỏi liên quan bên
 * phải/dưới — dùng cho Part 6 (Text Completion) / Part 7 (Reading Comprehension).
 */
export function ReadingPassagePane({
  block,
  numberOf,
  selectedOf,
  onSelect,
  flaggedOf,
  onToggleFlag,
  readOnly,
  reviewOf,
}: {
  block: PassageBlock;
  numberOf: (question: Question) => number;
  selectedOf?: (question: Question) => string | undefined;
  onSelect?: (question: Question, value: string) => void;
  flaggedOf?: (question: Question) => boolean;
  onToggleFlag?: (question: Question) => void;
  readOnly?: boolean;
  reviewOf?: (question: Question) => QuestionReviewInfo | undefined;
}) {
  const questionList = (
    <div className="space-y-3">
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
        />
      ))}
    </div>
  );

  if (!block.passage) return questionList;

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="space-y-2 bg-surface/60 lg:sticky lg:top-20">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <FiFileText className="h-4 w-4" /> Đoạn văn
        </p>
        <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {block.passage}
        </div>
      </Card>
      {questionList}
    </div>
  );
}
