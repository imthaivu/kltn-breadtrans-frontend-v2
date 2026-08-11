"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { Tag } from "@/components/ui/Tag";
import { readingApi } from "@/lib/api/services";
import type { QuizSummary } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft, FiBookOpen, FiFileText, FiPlay } from "react-icons/fi";

export default function ReadingTopicPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [theoryContent, setTheoryContent] = useState<string | null>(null);
  const [theoryError, setTheoryError] = useState<string | null>(null);
  const [theoryOpenFor, setTheoryOpenFor] = useState<number | null>(null);
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
    setTheoryOpenFor(quizId);
    setTheoryContent(null);
    setTheoryError(null);
    try {
      const data = await readingApi.theory(quizId);
      const content =
        data && typeof data === "object" && "theoryContent" in data
          ? (data as { theoryContent?: string | null }).theoryContent
          : null;
      setTheoryContent(content?.trim() ? content : "");
    } catch (err) {
      setTheoryError(getErrorMessage(err));
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
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Tag variant="primary">{quiz.type || "Quiz"}</Tag>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={theoryLoading}
                  onClick={() => void loadTheory(quiz.id)}
                >
                  <FiBookOpen className="h-4 w-4" /> Lý thuyết
                </Button>
                <Link href={`/quizzes/${quiz.id}`}>
                  <Button size="sm" variant="outline">
                    Luyện tập
                  </Button>
                </Link>
                <Link href={`/quizzes/${quiz.id}/exam`}>
                  <Button size="sm">
                    <FiPlay className="h-4 w-4" /> Thi thử
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {theoryOpenFor != null ? (
        <Card className="space-y-3 bg-surface/60">
          <CardTitle className="flex items-center gap-2 text-base">
            <FiFileText className="h-4 w-4 text-primary" /> Nội dung lý thuyết
          </CardTitle>
          {theoryLoading ? (
            <PageLoading label="Đang tải lý thuyết..." />
          ) : theoryError ? (
            <ErrorState message={theoryError} />
          ) : theoryContent ? (
            <div className="max-w-none rounded-[var(--radius-control)] border border-border bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {theoryContent}
            </div>
          ) : (
            <EmptyState title="Chưa có nội dung lý thuyết cho bài này" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
