"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { courseApi } from "@/lib/api/services";
import type { Course } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function CoursesPage() {
  const q = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.list(),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  const courses: Course[] = Array.isArray(q.data) ? q.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Khóa học</h1>
        <p className="text-sm text-muted">
          Danh sách khóa học và lớp học trên BreadTrans.
        </p>
      </div>
      {courses.length === 0 ? (
        <EmptyState title="Chưa có khóa học" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="h-full transition hover:border-primary">
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>
                  {c.description ||
                    (c.price != null ? `${c.price} VND` : "Xem chi tiết")}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
