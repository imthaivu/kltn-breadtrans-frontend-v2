"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { aiApi } from "@/lib/api/services";
import { cn, getErrorMessage } from "@/lib/utils";
import {
  getQuestionAudioUrl,
  getQuestionImageUrl,
} from "@/lib/toeic";
import { parseQuestionContent } from "@/lib/quiz-utils";
import type { Question } from "@/lib/api/types";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { FiBookmark, FiCheck, FiCpu, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export type QuestionReviewInfo = {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer?: string;
  explanation?: string;
};

export function QuestionCard({
  question,
  number,
  selected,
  onSelect,
  flagged,
  onToggleFlag,
  readOnly,
  review,
  hideMedia,
  className,
}: {
  question: Question;
  number: number;
  selected?: string;
  onSelect?: (value: string) => void;
  flagged?: boolean;
  onToggleFlag?: () => void;
  readOnly?: boolean;
  review?: QuestionReviewInfo;
  hideMedia?: boolean;
  className?: string;
}) {
  const { prompt, options } = parseQuestionContent(question);
  const audioUrl = getQuestionAudioUrl(question);
  const imageUrl = getQuestionImageUrl(question);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const explainAi = useMutation({
    mutationFn: () =>
      aiApi.explainError(question.id, {
        questionContent: question.content,
        userAnswer: review?.userAnswer ?? "",
        correctAnswer: review?.correctAnswer ?? "",
      }),
    onSuccess: (data) => setAiExplanation(data.explanation),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Card className={cn("space-y-3", className)} id={`question-${question.id}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
            {number}
          </span>
          {prompt}
        </p>
        {review ? (
          <Tag variant={review.isCorrect ? "success" : "danger"} className="shrink-0">
            {review.isCorrect ? <FiCheck className="h-3 w-3" /> : <FiX className="h-3 w-3" />}
            {review.isCorrect ? "Đúng" : "Sai"}
          </Tag>
        ) : onToggleFlag ? (
          <button
            type="button"
            onClick={onToggleFlag}
            className={cn(
              "shrink-0 rounded-lg p-1.5 transition-colors",
              flagged ? "text-secondary" : "text-muted hover:bg-surface hover:text-foreground",
            )}
            aria-label="Đánh dấu câu hỏi"
            title="Đánh dấu để xem lại"
          >
            <FiBookmark className={cn("h-4 w-4", flagged && "fill-current")} />
          </button>
        ) : null}
      </div>

      {!hideMedia && audioUrl ? (
        <audio controls src={audioUrl} className="w-full" />
      ) : null}
      {!hideMedia && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="max-h-56 rounded-[var(--radius-control)] border border-border object-contain"
        />
      ) : null}

      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((opt, i) => {
            const letter = LETTERS[i] ?? String(i + 1);
            const isSelected = selected === opt;
            const isCorrectOpt = review?.correctAnswer === opt;
            const isWrongSelected = review && isSelected && !review.isCorrect;

            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm transition-colors",
                  readOnly ? "cursor-default" : "hover:bg-surface",
                  isSelected && !review && "border-primary bg-primary/5",
                  !isSelected && !review && "border-border",
                  review && isCorrectOpt && "border-success bg-success/10",
                  review && isWrongSelected && "border-accent bg-accent/10",
                  review && !isCorrectOpt && !isWrongSelected && "border-border opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    isSelected && !review && "border-primary bg-primary text-white",
                    !isSelected && !review && "border-border text-muted",
                    review && isCorrectOpt && "border-success bg-success text-white",
                    review && isWrongSelected && "border-accent bg-accent text-white",
                    review && !isCorrectOpt && !isWrongSelected && "border-border text-muted",
                  )}
                >
                  {letter}
                </span>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={isSelected}
                  disabled={readOnly}
                  onChange={() => onSelect?.(opt)}
                  className="sr-only"
                />
                <span className="min-w-0 flex-1">{opt}</span>
                {review && isCorrectOpt ? <FiCheck className="h-4 w-4 shrink-0 text-success" /> : null}
                {review && isWrongSelected ? <FiX className="h-4 w-4 shrink-0 text-accent" /> : null}
              </label>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            className="w-full rounded-[var(--radius-control)] border-2 border-border px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-surface"
            placeholder="Nhập đáp án..."
            value={readOnly ? review?.userAnswer ?? "" : selected ?? ""}
            disabled={readOnly}
            onChange={(e) => onSelect?.(e.target.value)}
          />
          {review && review.correctAnswer ? (
            <p className="text-xs text-muted">
              Đáp án đúng: <strong className="text-success">{review.correctAnswer}</strong>
            </p>
          ) : null}
        </div>
      )}

      {review?.explanation ? (
        <div className="rounded-[var(--radius-control)] bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
          <strong className="text-foreground">Giải thích: </strong>
          {review.explanation}
        </div>
      ) : null}

      {review && !review.isCorrect ? (
        <div className="space-y-2">
          {aiExplanation ? (
            <div className="rounded-[var(--radius-control)] border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
              <strong className="mb-1 flex items-center gap-1.5 text-primary">
                <FiCpu className="h-3.5 w-3.5" /> Giải thích của AI
              </strong>
              {aiExplanation}
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={explainAi.isPending}
              onClick={() => explainAi.mutate()}
            >
              <FiCpu className="h-3.5 w-3.5" /> Giải thích với AI
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
