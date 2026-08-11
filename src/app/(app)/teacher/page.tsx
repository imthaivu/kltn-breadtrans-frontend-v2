"use client";

import { CourseContentPanel } from "@/components/teacher/CourseContentPanel";
import { QuizBuilderPanel } from "@/components/teacher/QuizBuilderPanel";
import { RequireRole } from "@/components/layout/RequireAuth";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/api";
import { courseApi, speakingApi } from "@/lib/api/services";
import { cn, getErrorMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiTrash2 } from "react-icons/fi";

type TeacherTab = "class" | "content" | "quiz" | "speaking";

const TABS: { id: TeacherTab; label: string }[] = [
  { id: "class", label: "Khóa & lớp online" },
  { id: "content", label: "Bài học" },
  { id: "quiz", label: "Soạn đề" },
  { id: "speaking", label: "Speaking" },
];

export default function TeacherPage() {
  return (
    <RequireRole roles={["TEACHER", "ADMIN"]}>
      <TeacherPanels />
    </RequireRole>
  );
}

function TeacherPanels() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const coursesQ = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.list(),
  });

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: 0,
  });
  const [classForm, setClassForm] = useState({
    courseId: 0,
    name: "",
    meetingLink: "",
    startDate: "",
    endDate: "",
  });
  const [speakingForm, setSpeakingForm] = useState({
    title: "",
    targetText: "",
    category: "TOEIC",
    difficulty: "MEDIUM",
  });
  const [tab, setTab] = useState<TeacherTab>("class");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createCourse = useMutation({
    mutationFn: () =>
      courseApi.create({
        title: courseForm.title,
        description: courseForm.description || undefined,
        price: courseForm.price || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã tạo khóa học");
      setCourseForm({ title: "", description: "", price: 0 });
      void qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeCourse = useMutation({
    mutationFn: (id: number) => courseApi.remove(id),
    onSuccess: () => {
      toast.success("Đã xóa khóa học");
      setDeletingId(null);
      void qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e) => {
      setDeletingId(null);
      toast.error(getErrorMessage(e));
    },
  });

  const createClass = useMutation({
    mutationFn: () =>
      courseApi.createClass(classForm.courseId, {
        name: classForm.name,
        meetingLink: classForm.meetingLink.trim() || undefined,
        startDate: classForm.startDate
          ? new Date(classForm.startDate).toISOString()
          : undefined,
        endDate: classForm.endDate
          ? new Date(classForm.endDate).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      toast.success("Đã mở lớp online");
      setClassForm((s) => ({
        ...s,
        name: "",
        meetingLink: "",
        startDate: "",
        endDate: "",
      }));
      void qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const createSpeaking = useMutation({
    mutationFn: () => speakingApi.create(speakingForm),
    onSuccess: () => {
      toast.success("Đã tạo speaking exercise");
      setSpeakingForm({ title: "", targetText: "", category: "TOEIC", difficulty: "MEDIUM" });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const courses = Array.isArray(coursesQ.data) ? coursesQ.data : [];

  function handleDeleteCourse(id: number, title: string) {
    if (
      !window.confirm(
        `Xóa khóa học "${title}"? Thao tác này không hoàn tác được.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    removeCourse.mutate(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khu vực giảng dạy"
        description="Tạo khóa học, mở lớp online (Meet/Zoom), bài học, quiz TOEIC / luyện tập chung."
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-white"
                : "border border-border bg-white text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "class" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <CardTitle>Tạo khóa học</CardTitle>
            <Input
              label="Tiêu đề"
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, title: e.target.value }))
              }
            />
            <Textarea
              label="Mô tả"
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, description: e.target.value }))
              }
            />
            <Input
              label="Giá"
              type="number"
              value={courseForm.price}
              onChange={(e) =>
                setCourseForm((s) => ({ ...s, price: Number(e.target.value) }))
              }
            />
            <Button
              loading={createCourse.isPending}
              disabled={!courseForm.title.trim()}
              onClick={() => createCourse.mutate()}
            >
              Tạo
            </Button>
          </Card>

          <Card className="space-y-3 border-primary/30">
            <CardTitle>Mở lớp online</CardTitle>
            <p className="text-xs text-muted">
              Gán link Google Meet / Zoom để học viên vào học trực tuyến.
            </p>
            <Select
              label="Khóa học"
              value={classForm.courseId || ""}
              onChange={(e) =>
                setClassForm((s) => ({
                  ...s,
                  courseId: Number(e.target.value),
                }))
              }
            >
              <option value="">Chọn...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Input
              label="Tên lớp"
              placeholder="TOEIC Intensive — K01"
              value={classForm.name}
              onChange={(e) =>
                setClassForm((s) => ({ ...s, name: e.target.value }))
              }
            />
            <Input
              label="Link học online (Meet / Zoom)"
              placeholder="https://meet.google.com/..."
              value={classForm.meetingLink}
              onChange={(e) =>
                setClassForm((s) => ({ ...s, meetingLink: e.target.value }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Ngày bắt đầu"
                type="datetime-local"
                value={classForm.startDate}
                onChange={(e) =>
                  setClassForm((s) => ({ ...s, startDate: e.target.value }))
                }
              />
              <Input
                label="Ngày kết thúc"
                type="datetime-local"
                value={classForm.endDate}
                onChange={(e) =>
                  setClassForm((s) => ({ ...s, endDate: e.target.value }))
                }
              />
            </div>
            <Button
              loading={createClass.isPending}
              disabled={!classForm.courseId || !classForm.name.trim()}
              onClick={() => createClass.mutate()}
            >
              Mở lớp
            </Button>
          </Card>

          {courses.length > 0 ? (
            <Card className="space-y-3 lg:col-span-2">
              <CardTitle>Danh sách khóa học</CardTitle>
              <ul className="divide-y divide-border">
                {courses.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted">
                        {c.classes?.length
                          ? `${c.classes.length} lớp`
                          : "Chưa có lớp"}
                        {c.price != null ? ` · ${c.price} VND` : ""}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === c.id && removeCourse.isPending}
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                      >
                        <FiTrash2 className="h-4 w-4" /> Xóa
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {!isAdmin ? (
                <p className="text-xs text-muted">
                  Chỉ Admin mới được xóa khóa học.
                </p>
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "content" ? <CourseContentPanel courses={courses} /> : null}

      {tab === "quiz" ? <QuizBuilderPanel courses={courses} /> : null}

      {tab === "speaking" ? (
        <Card className="mx-auto max-w-3xl space-y-3">
          <CardTitle>Tạo Speaking exercise</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              value={speakingForm.title}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, title: e.target.value }))
              }
            />
            <Select
              label="Category"
              value={speakingForm.category}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, category: e.target.value }))
              }
            >
              <option value="TOEIC">TOEIC</option>
              <option value="GENERAL">Luyện tập chung</option>
            </Select>
            <Select
              label="Difficulty"
              value={speakingForm.difficulty}
              onChange={(e) =>
                setSpeakingForm((s) => ({ ...s, difficulty: e.target.value }))
              }
            >
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </Select>
          </div>
          <Textarea
            label="Target text (câu cần đọc)"
            value={speakingForm.targetText}
            onChange={(e) =>
              setSpeakingForm((s) => ({ ...s, targetText: e.target.value }))
            }
          />
          <Button
            loading={createSpeaking.isPending}
            disabled={
              !speakingForm.title.trim() || !speakingForm.targetText.trim()
            }
            onClick={() => createSpeaking.mutate()}
          >
            Tạo exercise
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
