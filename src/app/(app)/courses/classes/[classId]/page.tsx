"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { courseApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";

export default function ClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = Number(params.classId);

  const q = useQuery({
    queryKey: ["courses", "classes", classId],
    queryFn: () => courseApi.getClass(classId),
    enabled: Number.isFinite(classId),
  });

  if (q.isLoading) return <PageLoading />;
  if (q.isError) {
    return (
      <div className="space-y-3">
        <ErrorState message={getErrorMessage(q.error)} />
        <p className="text-xs text-muted">
          Lưu ý: nếu backend trả 400 vì route-order, thử lấy class từ chi tiết
          course.
        </p>
      </div>
    );
  }

  const cls = q.data!;
  const lessons = cls.lessons ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/courses"
          className="mb-1 inline-flex items-center gap-1 text-sm text-primary"
        >
          <FiArrowLeft /> Khóa học
        </Link>
        <h1 className="text-2xl font-bold">{cls.name}</h1>
        <p className="text-sm text-muted">{cls.description}</p>
      </div>

      <div className="space-y-4">
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">Chưa có bài học.</p>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} className="space-y-2">
              <CardTitle className="text-base">
                {lesson.order != null ? `${lesson.order}. ` : ""}
                {lesson.title}
              </CardTitle>
              <ul className="space-y-1 text-sm">
                {(lesson.materials ?? []).map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {m.title} <FiExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
