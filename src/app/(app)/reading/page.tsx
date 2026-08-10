"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
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
      <div>
        <h1 className="text-2xl font-bold">Reading</h1>
        <p className="text-sm text-muted">
          Chủ đề ngữ pháp, mock test và đọc song ngữ.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c.value || "all"}
            size="sm"
            variant={category === c.value ? "primary" : "outline"}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {progressQ.data ? (
        <Card className="bg-surface">
          <CardTitle className="text-base">Tiến độ bilingual</CardTitle>
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
              <pre className="max-h-32 overflow-auto text-xs text-muted">
                {JSON.stringify(progressQ.data, null, 2)}
              </pre>
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
        <div className="grid gap-4 sm:grid-cols-2">
          {q.data.map((t) => (
            <Link key={t.id} href={`/reading/${t.id}`}>
              <Card className="h-full transition hover:border-primary">
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
