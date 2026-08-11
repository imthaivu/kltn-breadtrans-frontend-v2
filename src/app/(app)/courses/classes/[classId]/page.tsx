"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { courseApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiExternalLink, FiVideo } from "react-icons/fi";

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("vi-VN");
}

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
  const start = formatWhen(cls.startDate);
  const end = formatWhen(cls.endDate);
  const teacherName =
    cls.teacher?.profile?.fullName || cls.teacher?.email || null;

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
        {teacherName ? (
          <p className="text-sm text-muted">Giáo viên: {teacherName}</p>
        ) : null}
        {(start || end) && (
          <p className="mt-1 text-sm text-muted">
            {start ? `Bắt đầu: ${start}` : null}
            {start && end ? " · " : null}
            {end ? `Kết thúc: ${end}` : null}
          </p>
        )}
      </div>

      {cls.meetingLink ? (
        <Card className="flex flex-col gap-3 border-primary/50 bg-primary/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/15 p-2 text-primary">
              <FiVideo className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Lớp học online</CardTitle>
              <p className="text-sm text-muted">
                Vào phòng Meet / Zoom khi đến giờ học.
              </p>
            </div>
          </div>
          <a
            href={cls.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
          >
            <Button type="button" className="w-full sm:w-auto">
              Vào lớp online <FiExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </a>
        </Card>
      ) : (
        <Card className="border-dashed text-sm text-muted">
          Lớp chưa có link học online. Giáo viên cần gắn Meet/Zoom khi mở lớp.
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold">Bài học & tài liệu</h2>
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
