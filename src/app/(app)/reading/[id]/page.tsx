"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { readingApi } from "@/lib/api/services";
import type { QuizSummary } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function ReadingTopicPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [theory, setTheory] = useState<unknown>(null);
  const [theoryLoading, setTheoryLoading] = useState(false);

  const q = useQuery({
    queryKey: ["reading", "topic", id],
    queryFn: () => readingApi.topic(id),
    enabled: Number.isFinite(id),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  const topic = q.data;
  const quizzes: QuizSummary[] = topic?.quizzes ?? [];

  async function loadTheory(quizId: number) {
    setTheoryLoading(true);
    try {
      setTheory(await readingApi.theory(quizId));
    } catch (err) {
      setTheory({ error: getErrorMessage(err) });
    } finally {
      setTheoryLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reading"
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <FiArrowLeft /> Reading
        </Link>
        <h1 className="text-2xl font-bold">
          {topic?.name || topic?.title}
        </h1>
        <p className="text-sm text-muted">{topic?.description}</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Bài tập / Quiz</h2>
        {quizzes.length === 0 ? (
          <p className="text-sm text-muted">Chưa gắn quiz.</p>
        ) : (
          quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                <CardDescription>{quiz.type || "Quiz"}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={theoryLoading}
                  onClick={() => void loadTheory(quiz.id)}
                >
                  Lý thuyết
                </Button>
                <Link href={`/quizzes/${quiz.id}`}>
                  <Button size="sm">Làm bài</Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {theory ? (
        <Card>
          <CardTitle className="text-base">Nội dung lý thuyết</CardTitle>
          <div className="prose mt-3 max-w-none whitespace-pre-wrap text-sm">
            {typeof theory === "string"
              ? theory
              : typeof theory === "object" &&
                  theory &&
                  "theoryContent" in (theory as object)
                ? String(
                    (theory as { theoryContent?: string }).theoryContent ??
                      JSON.stringify(theory, null, 2),
                  )
                : JSON.stringify(theory, null, 2)}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
