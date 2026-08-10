"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { quizApi } from "@/lib/api/services";
import type { Question } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { parseQuestionContent } from "@/lib/quiz-utils";

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [analytics, setAnalytics] = useState<unknown>(null);

  const q = useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => quizApi.get(id),
    enabled: Number.isFinite(id),
  });

  const questions: Question[] = useMemo(
    () => q.data?.questions ?? [],
    [q.data],
  );

  const submit = useMutation({
    mutationFn: () =>
      quizApi.submit(
        id,
        questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? "",
        })),
      ),
    onSuccess: async (data) => {
      setResult(data);
      toast.success("Đã nộp bài");
      const submissionId =
        data &&
        typeof data === "object" &&
        ("id" in data || "submissionId" in data)
          ? Number(
              (data as { id?: number; submissionId?: number }).submissionId ??
                (data as { id?: number }).id,
            )
          : NaN;
      if (Number.isFinite(submissionId)) {
        try {
          setAnalytics(await quizApi.analytics(submissionId));
        } catch {
          // route-order quirk may fail; ignore
        }
      }
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
        <h1 className="text-2xl font-bold">{q.data?.title}</h1>
        <p className="text-sm text-muted">{q.data?.type}</p>
      </div>

      <div className="space-y-4">
        {questions.map((question, idx) => {
          const { prompt, options } = parseQuestionContent(question);
          return (
            <Card key={question.id} className="space-y-3">
              <CardTitle className="text-base">
                Câu {idx + 1}. {prompt}
              </CardTitle>
              {question.audioUrl ? (
                <audio controls src={String(question.audioUrl)} className="w-full" />
              ) : null}
              {question.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(question.imageUrl)}
                  alt=""
                  className="max-h-48 rounded-md object-contain"
                />
              ) : null}
              {options.length > 0 ? (
                <div className="space-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={answers[question.id] === opt}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [question.id]: opt }))
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  className="w-full rounded-md border-2 border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Nhập đáp án..."
                  value={answers[question.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [question.id]: e.target.value,
                    }))
                  }
                />
              )}
            </Card>
          );
        })}
      </div>

      <Button
        loading={submit.isPending}
        onClick={() => submit.mutate()}
        disabled={questions.length === 0}
      >
        Nộp bài
      </Button>

      {result ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardTitle className="text-base">Kết quả</CardTitle>
          <pre className="mt-2 overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}

      {analytics ? (
        <Card>
          <CardTitle className="text-base">Analytics</CardTitle>
          <pre className="mt-2 overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(analytics, null, 2)}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
