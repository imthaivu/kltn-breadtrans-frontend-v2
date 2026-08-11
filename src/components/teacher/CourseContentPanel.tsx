"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Loading";
import { Input, Select } from "@/components/ui/Input";
import { courseApi, uploadApi } from "@/lib/api/services";
import type { Course, Lesson, Material } from "@/lib/api/types";
import { extractUploadKey, getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiFileText, FiPlus, FiRefreshCw, FiUploadCloud } from "react-icons/fi";

/**
 * Soạn nội dung lớp học: chọn Khoá học → Lớp → Bài học bằng dropdown (không nhập ID tay),
 * rồi thêm tài liệu bằng cách chọn file — hệ thống tự upload lên R2 và gắn URL, giáo viên
 * không cần copy/paste link thủ công.
 */
export function CourseContentPanel({ courses }: { courses: Course[] }) {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<number | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [lessonId, setLessonId] = useState<number | "">("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");

  const selectedCourse = courses.find((c) => c.id === courseId);
  const classes = selectedCourse?.classes ?? [];

  const classQ = useQuery({
    queryKey: ["courses", "classes", classId],
    queryFn: () => courseApi.getClass(Number(classId)),
    enabled: classId !== "",
  });

  const lessons: Lesson[] = classQ.data?.lessons ?? [];
  const selectedLesson = lessons.find((l) => l.id === lessonId);

  function handleCourseChange(value: string) {
    setCourseId(value ? Number(value) : "");
    setClassId("");
    setLessonId("");
  }

  function handleClassChange(value: string) {
    setClassId(value ? Number(value) : "");
    setLessonId("");
  }

  const createLesson = useMutation({
    mutationFn: () =>
      courseApi.createLesson(Number(classId), {
        title: lessonTitle,
        order: lessons.length + 1,
      }),
    onSuccess: () => {
      toast.success("Đã tạo bài học");
      setLessonTitle("");
      void qc.invalidateQueries({ queryKey: ["courses", "classes", classId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const uploadAndAddMaterial = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadApi.uploadSmart(file);
      return courseApi.addMaterial(Number(lessonId), {
        title: materialTitle.trim() || file.name,
        fileUrl: uploaded.url,
        fileType: file.type || "application/octet-stream",
      });
    },
    onSuccess: () => {
      toast.success("Đã tải lên và thêm tài liệu");
      setMaterialTitle("");
      void qc.invalidateQueries({ queryKey: ["courses", "classes", classId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  /** Thay file: upload mới → gắn material mới → xóa object R2 cũ (best-effort). */
  const replaceMaterial = useMutation({
    mutationFn: async ({
      material,
      file,
    }: {
      material: Material;
      file: File;
    }) => {
      const uploaded = await uploadApi.uploadSmart(file);
      await courseApi.addMaterial(Number(lessonId), {
        title: material.title,
        fileUrl: uploaded.url,
        fileType: file.type || material.fileType || "application/octet-stream",
      });
      const oldKey = extractUploadKey(material.fileUrl);
      if (oldKey) {
        try {
          await uploadApi.remove(oldKey);
        } catch {
          /* ignore */
        }
      }
    },
    onSuccess: () => {
      toast.success("Đã thay file (bản cũ trên cloud đã xóa)");
      void qc.invalidateQueries({ queryKey: ["courses", "classes", classId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <CardTitle>Chọn lớp học để soạn nội dung</CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Khoá học"
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
          >
            <option value="">Chọn khoá học...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <Select
            label="Lớp"
            value={classId}
            disabled={!selectedCourse}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">{selectedCourse ? "Chọn lớp..." : "Chọn khoá học trước"}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Bài học"
            value={lessonId}
            disabled={!classId}
            onChange={(e) => setLessonId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{classId ? "Chọn bài học..." : "Chọn lớp trước"}</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {classId ? (
        <Card className="space-y-3">
          <CardTitle className="text-base">Tạo bài học mới trong lớp này</CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              className="min-w-64 flex-1"
              label="Tên bài học"
              placeholder="VD: Unit 3 — Business Emails"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
            <Button
              loading={createLesson.isPending}
              disabled={!lessonTitle.trim()}
              onClick={() => createLesson.mutate()}
            >
              <FiPlus className="h-4 w-4" /> Tạo bài học
            </Button>
          </div>
        </Card>
      ) : null}

      {lessonId && selectedLesson ? (
        <Card className="space-y-3">
          <CardTitle className="text-base">
            Tài liệu — {selectedLesson.title}
          </CardTitle>
          {selectedLesson.materials && selectedLesson.materials.length > 0 ? (
            <ul className="space-y-1.5">
              {selectedLesson.materials.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] bg-surface px-3 py-2"
                >
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FiFileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{m.title}</span>
                  </a>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--radius-control)] border border-border px-2 py-1 text-xs text-muted hover:border-primary hover:text-primary">
                    <FiRefreshCw className="h-3.5 w-3.5" />
                    {replaceMaterial.isPending ? "Đang thay..." : "Thay file"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={replaceMaterial.isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) replaceMaterial.mutate({ material: m, file: f });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Chưa có tài liệu" description="Thêm tài liệu đầu tiên cho bài học này." />
          )}
          {selectedLesson.materials && selectedLesson.materials.length > 0 ? (
            <p className="text-xs text-muted">
              “Thay file” thêm bản mới và xóa file cũ trên cloud; bản ghi cũ vẫn còn trong danh
              sách (BE chưa có API xóa material).
            </p>
          ) : null}

          <div className="space-y-2 border-t border-border pt-3">
            <Input
              label="Tên tài liệu (tuỳ chọn — mặc định lấy tên file)"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-primary hover:text-primary">
              <FiUploadCloud className="h-4 w-4" />
              {uploadAndAddMaterial.isPending ? "Đang tải lên..." : "Chọn file (PDF, ảnh, audio, video)"}
              <input
                type="file"
                className="hidden"
                disabled={uploadAndAddMaterial.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAndAddMaterial.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </Card>
      ) : null}

      {!courseId ? (
        <CardDescription>
          Chọn khoá học rồi lớp để xem/soạn bài học — không cần nhớ hoặc gõ ID.
        </CardDescription>
      ) : null}
    </div>
  );
}
