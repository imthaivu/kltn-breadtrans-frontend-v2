"use client";

import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { gamificationApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function LeaderboardPage() {
  const boardQ = useQuery({
    queryKey: ["gamification", "leaderboard"],
    queryFn: () => gamificationApi.leaderboard(),
  });
  const badgesQ = useQuery({
    queryKey: ["gamification", "badges"],
    queryFn: () => gamificationApi.myBadges(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bảng xếp hạng</h1>
        <p className="text-sm text-muted">Top 10 bánh rắn & huy hiệu của bạn.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top 10</h2>
        {boardQ.isLoading ? (
          <PageLoading />
        ) : boardQ.isError ? (
          <ErrorState message={getErrorMessage(boardQ.error)} />
        ) : !Array.isArray(boardQ.data) || boardQ.data.length === 0 ? (
          <EmptyState title="Chưa có xếp hạng" />
        ) : (
          <Card className="divide-y divide-border/60 overflow-hidden p-0">
            {boardQ.data.map((row, i) => (
              <div
                key={row.userId ?? row.user?.id ?? i}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {row.rank ?? i + 1}
                  </span>
                  <div>
                    <div className="font-medium">
                      {row.user?.profile?.fullName ||
                        row.user?.email ||
                        `User #${row.userId ?? row.user?.id}`}
                    </div>
                  </div>
                </div>
                <div className="font-semibold text-primary">
                  {row.totalPoints ?? row.totalBanhRan ?? 0}
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Huy hiệu của tôi</h2>
        {badgesQ.isLoading ? (
          <PageLoading />
        ) : badgesQ.isError ? (
          <ErrorState message={getErrorMessage(badgesQ.error)} />
        ) : !Array.isArray(badgesQ.data) || badgesQ.data.length === 0 ? (
          <EmptyState title="Chưa có huy hiệu" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badgesQ.data.map((row, i) => {
              const badge =
                row && typeof row === "object" && "badge" in row
                  ? (row as { badge?: { id?: number; name?: string; description?: string | null } })
                      .badge
                  : (row as {
                      id?: number;
                      name?: string;
                      description?: string | null;
                    });
              const key =
                badge?.id ??
                (row as { id?: number }).id ??
                i;
              return (
                <Card key={key}>
                  <div className="font-semibold">
                    {badge?.name || "Badge"}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {badge?.description}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
