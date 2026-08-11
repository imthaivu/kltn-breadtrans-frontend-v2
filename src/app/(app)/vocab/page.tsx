"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
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
          {topics.map((t) => {
            const total = t.totalWords ?? t.wordCount ?? 0;
            const learned = t.learnedCount ?? 0;
            return (
              <Link key={t.id} href={`/vocab/${t.id}`} className="block">
                <Card className="h-full space-y-2 transition hover:border-primary hover:shadow-md">
                  <CardTitle>{t.title || t.name || `Topic #${t.id}`}</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {t.categoryName ? <Tag variant="primary">{t.categoryName}</Tag> : null}
                    {t.isPro ? <Tag variant="secondary">PRO</Tag> : null}
                    <Tag variant="outline">{total} từ</Tag>
                  </div>
                  {total > 0 ? (
                    <ProgressBar value={learned} max={total} label={`${learned}/${total}`} />
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
