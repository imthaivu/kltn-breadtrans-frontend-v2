"use client";

import { AnswerSheet } from "@/components/exam/AnswerSheet";
import { ListeningAudioBlock } from "@/components/exam/ListeningAudioBlock";
import { PartTabs } from "@/components/exam/PartTabs";
import { ReadingPassagePane } from "@/components/exam/ReadingPassagePane";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CountdownTimer } from "@/components/ui/Timer";
import { quizApi } from "@/lib/api/services";
import type { Question } from "@/lib/api/types";
import { cacheSubmission } from "@/lib/submission-cache";
import {
  groupListeningAudioBlocks,
  groupQuestionsByPart,
  groupQuestionsByPassage,
} from "@/lib/toeic";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiChevronLeft, FiChevronRight, FiGrid, FiLogOut } from "react-icons/fi";

const DEFAULT_TIME_LIMIT_MINUTES = 60;

export default function QuizExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pendingScrollIdRef = useRef<number | null>(null);

  const q = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => quizApi.get(id),
    enabled: Number.isFinite(id),
  });

  const questions: Question[] = useMemo(() => q.data?.questions ?? [], [q.data]);
  const groups = useMemo(() => groupQuestionsByPart(questions), [questions]);
  const flatQuestions = useMemo(() => groups.flatMap((g) => g.questions), [groups]);
  const numberMap = useMemo(() => {
    const map = new Map<number, number>();
    flatQuestions.forEach((question, i) => map.set(question.id, i + 1));
    return map;
  }, [flatQuestions]);
  const numberOf = useCallback((question: Question) => numberMap.get(question.id) ?? 0, [numberMap]);

  const activeGroup = groups[activeIndex];
  const answeredCount = Object.keys(answers).length;
  const flaggedIds = useMemo(
    () => Object.entries(flagged).filter(([, v]) => v).map(([qId]) => Number(qId)),
    [flagged],
  );

  const submit = useMutation({
    mutationFn: () =>
      quizApi.submit(
        id,
        flatQuestions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "",
        })),
      ),
    onSuccess: (data) => {
      cacheSubmission({
        quizId: id,
        quizTitle: q.data?.title,
        submission: data,
        questions: flatQuestions,
        flaggedQuestionIds: flaggedIds,
      });
      toast.success("Đã nộp bài thi!");
      router.push(`/quizzes/${id}/results/${data.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleExpire = useCallback(() => {
    if (submit.isPending || submit.isSuccess) return;
    toast.error("Hết giờ! Đang tự động nộp bài...");
    submit.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit.isPending, submit.isSuccess]);

  useEffect(() => {
    const targetId = pendingScrollIdRef.current;
    if (targetId == null) return;
    const el = document.getElementById(`question-${targetId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingScrollIdRef.current = null;
  }, [activeIndex]);

  function jumpToQuestion(question: Question) {
    const groupIdx = groups.findIndex((g) => g.questions.some((qq) => qq.id === question.id));
    if (groupIdx === -1) return;
    if (groupIdx === activeIndex) {
      document
        .getElementById(`question-${question.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    pendingScrollIdRef.current = question.id;
    setActiveIndex(groupIdx);
  }

  function handleExit() {
    if (window.confirm("Bạn có chắc muốn thoát? Bài làm hiện tại sẽ không được lưu.")) {
      router.push(`/quizzes/${id}`);
    }
  }

  if (q.isLoading) return <PageLoading label="Đang tải đề thi..." />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;
  if (flatQuestions.length === 0)
    return (
      <EmptyState
        title="Đề thi chưa có câu hỏi"
        description="Quiz này chưa được thêm câu hỏi nào để thi thử."
      />
    );

  const timeLimitMinutes = Number(q.data?.timeLimit) || DEFAULT_TIME_LIMIT_MINUTES;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-30 -mt-1 space-y-3 border-b border-border/60 bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleExit}
              className="mb-1 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <FiLogOut className="h-3.5 w-3.5" /> Thoát
            </button>
            <h1 className="truncate text-lg font-bold">{q.data?.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer
              durationSeconds={timeLimitMinutes * 60}
              onExpire={handleExpire}
              paused={submit.isPending || submit.isSuccess}
            />
            <Button onClick={() => setConfirmOpen(true)} disabled={submit.isPending}>
              <FiCheck className="h-4 w-4" /> Nộp bài
            </Button>
          </div>
        </div>
        <ProgressBar
          value={answeredCount}
          max={flatQuestions.length}
          label={`${answeredCount}/${flatQuestions.length} câu`}
        />
        <PartTabs
          groups={groups}
          activeIndex={activeIndex}
          onChange={setActiveIndex}
          answeredCountOf={(group) =>
            group.questions.filter((question) => answers[question.id] !== undefined).length
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {activeGroup?.meta ? (
            <p className="text-sm text-muted">{activeGroup.meta.description}</p>
          ) : null}

          {activeGroup?.skill === "reading"
            ? groupQuestionsByPassage(activeGroup.questions).map((block, i) => (
                <ReadingPassagePane
                  key={i}
                  block={block}
                  numberOf={numberOf}
                  selectedOf={(question) => answers[question.id]}
                  onSelect={(question, value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: value }))
                  }
                  flaggedOf={(question) => Boolean(flagged[question.id])}
                  onToggleFlag={(question) =>
                    setFlagged((prev) => ({ ...prev, [question.id]: !prev[question.id] }))
                  }
                />
              ))
            : groupListeningAudioBlocks(activeGroup?.questions ?? []).map((block, i) => (
                <ListeningAudioBlock
                  key={i}
                  block={block}
                  numberOf={numberOf}
                  selectedOf={(question) => answers[question.id]}
                  onSelect={(question, value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: value }))
                  }
                  flaggedOf={(question) => Boolean(flagged[question.id])}
                  onToggleFlag={(question) =>
                    setFlagged((prev) => ({ ...prev, [question.id]: !prev[question.id] }))
                  }
                />
              ))}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            >
              <FiChevronLeft className="h-4 w-4" /> Part trước
            </Button>
            {activeIndex < groups.length - 1 ? (
              <Button onClick={() => setActiveIndex((i) => Math.min(groups.length - 1, i + 1))}>
                Part tiếp <FiChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setConfirmOpen(true)} disabled={submit.isPending}>
                <FiCheck className="h-4 w-4" /> Nộp bài
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-[var(--radius-card)] border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold">Bảng câu hỏi</p>
            <AnswerSheet
              questions={flatQuestions}
              numberOf={numberOf}
              isAnswered={(question) => answers[question.id] !== undefined}
              isFlagged={(question) => Boolean(flagged[question.id])}
              onJump={jumpToQuestion}
            />
          </div>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed right-4 bottom-24 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg lg:hidden"
        aria-label="Bảng câu hỏi"
      >
        <FiGrid className="h-5 w-5" />
      </button>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Bảng câu hỏi"
      >
        <AnswerSheet
          questions={flatQuestions}
          numberOf={numberOf}
          isAnswered={(question) => answers[question.id] !== undefined}
          isFlagged={(question) => Boolean(flagged[question.id])}
          onJump={(question) => {
            jumpToQuestion(question);
            setSheetOpen(false);
          }}
        />
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận nộp bài"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Tiếp tục làm bài
            </Button>
            <Button
              loading={submit.isPending}
              onClick={() => {
                setConfirmOpen(false);
                submit.mutate();
              }}
            >
              Nộp bài ngay
            </Button>
          </>
        }
      >
        <p>
          Bạn đã trả lời <strong>{answeredCount}</strong>/{flatQuestions.length} câu.
        </p>
        {answeredCount < flatQuestions.length ? (
          <p className="mt-2 text-accent">
            Còn {flatQuestions.length - answeredCount} câu chưa trả lời — các câu này sẽ bị tính sai.
          </p>
        ) : null}
        {flaggedIds.length > 0 ? (
          <p className="mt-2 text-muted">Bạn đã đánh dấu {flaggedIds.length} câu để xem lại.</p>
        ) : null}
      </Modal>
    </div>
  );
}
