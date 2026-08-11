"use client";

import { QuestionCard } from "@/components/exam/QuestionCard";
import { Button } from "@/components/ui/Button";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { quizApi } from "@/lib/api/services";
import type { Question } from "@/lib/api/types";
import { cacheSubmission } from "@/lib/submission-cache";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPlay } from "react-icons/fi";

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const q = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => quizApi.get(id),
    enabled: Number.isFinite(id),
  });

  const questions: Question[] = useMemo(() => q.data?.questions ?? [], [q.data]);
  const answeredCount = Object.keys(answers).length;

  const submit = useMutation({
    mutationFn: () =>
      quizApi.submit(
        id,
        questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "",
        })),
      ),
    onSuccess: (data) => {
      cacheSubmission({
        quizId: id,
        quizTitle: q.data?.title,
        submission: data,
        questions,
      });
      toast.success("Đã nộp bài");
      router.push(`/quizzes/${id}/results/${data.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/quizzes"
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <FiArrowLeft /> Quizzes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{q.data?.title}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Tag variant="primary">{q.data?.type}</Tag>
              <Tag variant="outline">{questions.length} câu</Tag>
            </div>
          </div>
          <Link href={`/quizzes/${id}/exam`}>
            <Button variant="outline">
              <FiPlay className="h-4 w-4" /> Thi thử mô phòng
            </Button>
          </Link>
        </div>
      </div>

      {questions.length > 0 ? (
        <ProgressBar
          value={answeredCount}
          max={questions.length}
          label={`${answeredCount}/${questions.length} câu`}
        />
      ) : null}

      <div className="space-y-4">
        {questions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            number={idx + 1}
            selected={answers[question.id]}
            onSelect={(value) =>
              setAnswers((a) => ({ ...a, [question.id]: value }))
            }
          />
        ))}
      </div>

      <Button
        loading={submit.isPending}
        onClick={() => submit.mutate()}
        disabled={questions.length === 0}
      >
        Nộp bài
      </Button>
    </div>
  );
}
