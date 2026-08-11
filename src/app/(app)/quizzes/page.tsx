"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tag } from "@/components/ui/Tag";
import { quizApi } from "@/lib/api/services";
import type { QuizSummary } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiEdit3, FiPlay } from "react-icons/fi";

export default function QuizzesPage() {
  const q = useQuery({
    queryKey: ["quizzes", "listening-practice"],
    queryFn: () => quizApi.listeningPractice(),
  });

  const quizzes: QuizSummary[] = Array.isArray(q.data) ? q.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Luyện thi TOEIC"
        description="Luyện nghe theo đề và thi thử mô phòng đầy đủ Part 1–7."
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Đề luyện & thi thử</h2>
        {q.isLoading ? (
          <PageLoading />
        ) : q.isError ? (
          <ErrorState message={getErrorMessage(q.error)} />
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="Chưa có đề nào"
            description="Dùng AI Generate Dictation hoặc import ETS PDF trong trang AI để tạo đề."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => {
              const questionCount = quiz._count?.questions;
              return (
                <Card key={quiz.id} className="flex h-full flex-col gap-3">
                  <div>
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Tag variant="primary">{quiz.type || "LISTENING_PRACTICE"}</Tag>
                      {questionCount != null ? (
                        <Tag variant="outline">{questionCount} câu</Tag>
                      ) : null}
                      {quiz.timeLimit ? (
                        <Tag variant="outline">{quiz.timeLimit} phút</Tag>
                      ) : null}
                    </div>
                    {quiz.description ? (
                      <CardDescription>{quiz.description}</CardDescription>
                    ) : null}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link href={`/quizzes/${quiz.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FiEdit3 className="h-4 w-4" /> Luyện tập
                      </Button>
                    </Link>
                    <Link href={`/quizzes/${quiz.id}/exam`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <FiPlay className="h-4 w-4" /> Thi thử
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
