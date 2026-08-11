"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { readingApi } from "@/lib/api/services";
import type { TopicCategory } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

const CATEGORIES: { value: TopicCategory | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "GRAMMAR_TOPIC", label: "Grammar Topic" },
  { value: "GRAMMAR_LEVEL", label: "Grammar Level" },
  { value: "GRAMMAR_MOCK_TEST", label: "Mock Test" },
  { value: "BILINGUAL_LEVEL", label: "Bilingual" },
];

export default function ReadingPage() {
  const [category, setCategory] = useState<TopicCategory | "">("");
  const q = useQuery({
    queryKey: ["reading", "topics", category],
    queryFn: () =>
      readingApi.topics(category ? (category as TopicCategory) : undefined),
  });
  const progressQ = useQuery({
    queryKey: ["reading", "bilingual-progress"],
    queryFn: () => readingApi.bilingualProgress(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reading"
        description="Chủ đề ngữ pháp, mock test và đọc song ngữ."
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <Button
            key={c.value || "all"}
            size="sm"
            variant={category === c.value ? "primary" : "outline"}
            className="shrink-0"
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {progressQ.data ? (
        <Card className="bg-surface/80">
          <CardTitle>Tiến độ bilingual</CardTitle>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {"completedArticles" in (progressQ.data as object) ? (
              <>
                <div>
                  Bài hoàn thành:{" "}
                  <strong>
                    {
                      (progressQ.data as { completedArticles?: number })
                        .completedArticles
                    }
                  </strong>
                </div>
                <div>
                  Độ chính xác:{" "}
                  <strong>
                    {(progressQ.data as { accuracy?: number }).accuracy ?? "—"}
                  </strong>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted sm:col-span-2">
                Đã tải tiến độ bilingual.
              </p>
            )}
          </div>
        </Card>
      ) : null}

      {q.isLoading ? (
        <PageLoading />
      ) : q.isError ? (
        <ErrorState message={getErrorMessage(q.error)} />
      ) : !Array.isArray(q.data) || q.data.length === 0 ? (
        <EmptyState title="Chưa có chủ đề reading" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((t) => (
            <Link key={t.id} href={`/reading/${t.id}`} className="block">
              <Card className="h-full transition hover:border-primary hover:shadow-md">
                <CardTitle>
                  {t.name || t.title || `Topic #${t.id}`}
                </CardTitle>
                <CardDescription>
                  {t.vietnameseName ||
                    t.description ||
                    t.category ||
                    "Xem chi tiết"}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
