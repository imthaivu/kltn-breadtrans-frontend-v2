"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader
        title="Khóa học"
        description="TOEIC / luyện tập chung — vào lớp online qua Meet hoặc Zoom."
      />
      {courses.length === 0 ? (
        <EmptyState title="Chưa có khóa học" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="block">
              <Card className="h-full transition hover:border-primary hover:shadow-md">
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
