"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { courseApi } from "@/lib/api/services";
import type { ClassSummary } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const q = useQuery({
    queryKey: ["courses", id],
    queryFn: () => courseApi.get(id),
    enabled: Number.isFinite(id),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) return <ErrorState message={getErrorMessage(q.error)} />;

  const course = q.data!;
  const classes: ClassSummary[] = course.classes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/courses"
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <FiArrowLeft /> Khóa học
        </Link>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-muted">{course.description}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Lớp học</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-muted">Chưa có lớp.</p>
        ) : (
          classes.map((cls) => (
            <Link key={cls.id} href={`/courses/classes/${cls.id}`}>
              <Card className="mb-3 transition hover:border-primary">
                <CardTitle className="text-base">{cls.name}</CardTitle>
                <CardDescription>{cls.description}</CardDescription>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
