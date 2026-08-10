"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { userApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const q = useQuery({
    queryKey: ["users", "profile"],
    queryFn: () => userApi.profile(),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  const p = q.data!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ</h1>
        <p className="text-sm text-muted">Thông tin tài khoản BreadTrans</p>
      </div>
      <Card className="space-y-3">
        <CardTitle>{p.profile?.fullName || "Học viên"}</CardTitle>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{p.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Vai trò</dt>
            <dd className="font-medium">{p.role}</dd>
          </div>
          <div>
            <dt className="text-muted">Streak</dt>
            <dd className="font-medium">{Number(p.streakCount ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-muted">Bánh rắn</dt>
            <dd className="font-medium text-primary">
              {Number(p.totalBanhRan ?? 0)}
            </dd>
          </div>
        </dl>
        {p.profile?.bio ? (
          <p className="text-sm text-muted">{p.profile.bio}</p>
        ) : null}
      </Card>
    </div>
  );
}
