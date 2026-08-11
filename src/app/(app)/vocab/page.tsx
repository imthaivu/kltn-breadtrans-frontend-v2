"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { vocabApi } from "@/lib/api/services";
import type { VocabTopic, VocabTopicsResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

function normalizeTopics(
  data: VocabTopicsResponse | VocabTopic[] | undefined,
): VocabTopic[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.topics)) return data.topics;
  if (Array.isArray(data.categories)) {
    return data.categories.flatMap((c) => c.topics ?? []);
  }
  return [];
}

export default function VocabPage() {
  const q = useQuery({
    queryKey: ["vocab", "topics"],
    queryFn: () => vocabApi.topics(),
  });

  const topics = useMemo(() => normalizeTopics(q.data), [q.data]);

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Từ vựng"
        description="Chọn chủ đề — flashcard, ôn tập SRS, đánh dấu từ khó."
      />
      {topics.length === 0 ? (
        <EmptyState
          title="Chưa có chủ đề từ vựng"
          description="Hãy seed dữ liệu vocab trên backend."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link key={t.id} href={`/vocab/${t.id}`} className="block">
              <Card className="h-full transition hover:border-primary hover:shadow-md">
                <CardTitle>{t.title || t.name || `Topic #${t.id}`}</CardTitle>
                <CardDescription>
                  {[
                    t.categoryName,
                    t.totalWords != null
                      ? `${t.totalWords} từ`
                      : t.wordCount != null
                        ? `${t.wordCount} từ`
                        : null,
                    t.learnedCount != null
                      ? `${t.learnedCount} đã học`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Xem danh sách từ"}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
