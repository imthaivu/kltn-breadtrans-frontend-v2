"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/api";
import { gamificationApi, userApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FiAward,
  FiBookOpen,
  FiCpu,
  FiEdit3,
  FiHeadphones,
  FiLayers,
  FiMic,
  FiUpload,
  FiVideo,
} from "react-icons/fi";
import { MdOutlineMenuBook } from "react-icons/md";

const STUDENT_SKILLS = [
  {
    href: "/vocab",
    title: "Từ vựng",
    desc: "Flashcard, quiz, SRS",
    icon: MdOutlineMenuBook,
  },
  {
    href: "/reading",
    title: "Reading",
    desc: "Ngữ pháp & đọc hiểu",
    icon: FiBookOpen,
  },
  {
    href: "/writing",
    title: "Writing",
    desc: "Part 1–3 + AI chấm",
    icon: FiEdit3,
  },
  {
    href: "/speaking",
    title: "Speaking",
    desc: "Phát âm + AI grader",
    icon: FiMic,
  },
  {
    href: "/quizzes",
    title: "Listening / Quiz",
    desc: "Luyện nghe & đề TOEIC",
    icon: FiHeadphones,
  },
  {
    href: "/courses",
    title: "Khóa học",
    desc: "Lớp online Meet / Zoom",
    icon: FiLayers,
  },
];

const TEACHER_ACTIONS = [
  {
    href: "/teacher",
    title: "Mở lớp online",
    desc: "Tạo lớp + gắn link Meet/Zoom",
    icon: FiVideo,
  },
  {
    href: "/courses",
    title: "Khóa / lớp",
    desc: "Danh sách lớp đang dạy",
    icon: FiLayers,
  },
  {
    href: "/upload",
    title: "Upload tài liệu",
    desc: "PDF, audio lên R2",
    icon: FiUpload,
  },
  {
    href: "/ai",
    title: "AI cho giáo viên",
    desc: "Tạo đề TOEIC, import ETS",
    icon: FiCpu,
  },
  {
    href: "/quizzes",
    title: "Quizzes",
    desc: "Xem / quản lý đề",
    icon: FiHeadphones,
  },
  {
    href: "/leaderboard",
    title: "Bảng xếp hạng",
    desc: "Theo dõi học viên",
    icon: FiAward,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  const profileQ = useQuery({
    queryKey: ["users", "profile"],
    queryFn: () => userApi.profile(),
  });
  const boardQ = useQuery({
    queryKey: ["gamification", "leaderboard"],
    queryFn: () => gamificationApi.leaderboard(),
  });

  if (profileQ.isLoading) return <PageLoading />;

  const profile = profileQ.data;
  const name =
    profile?.profile?.fullName || profile?.email?.split("@")[0] || "bạn";
  const top = Array.isArray(boardQ.data) ? boardQ.data.slice(0, 5) : [];
  const cards = isTeacher ? TEACHER_ACTIONS : STUDENT_SKILLS;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Xin chào, ${name}`}
        description={
          isTeacher
            ? "Quản lý lớp online và nội dung TOEIC / luyện tập chung."
            : "Chọn kỹ năng để luyện hôm nay — TOEIC & luyện tập chung."
        }
        actions={
          isTeacher ? (
            <Link href="/teacher">
              <Button>
                <FiVideo className="h-4 w-4" />
                Mở lớp online
              </Button>
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              <div className="rounded-[var(--radius-control)] border border-border bg-white px-3 py-2 text-sm">
                Streak:{" "}
                <strong className="text-warning">
                  {Number(profile?.streakCount ?? 0)} ngày
                </strong>
              </div>
              <div className="rounded-[var(--radius-control)] border border-border bg-white px-3 py-2 text-sm">
                Bánh rắn:{" "}
                <strong className="text-primary">
                  {Number(profile?.totalBanhRan ?? 0)}
                </strong>
              </div>
            </div>
          )
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={`${s.href}-${s.title}`} href={s.href} className="block">
              <Card className="h-full transition hover:border-primary hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--radius-control)] bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle>{s.title}</CardTitle>
                    <CardDescription>{s.desc}</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Top bảng xếp hạng</h2>
          <Link href="/leaderboard" className="text-sm font-medium text-primary">
            Xem tất cả
          </Link>
        </div>
        {boardQ.isError ? (
          <ErrorState message={getErrorMessage(boardQ.error)} />
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {top.length === 0 ? (
              <p className="p-5 text-sm text-muted">Chưa có dữ liệu.</p>
            ) : (
              top.map((row, i) => (
                <div
                  key={row.userId ?? row.user?.id ?? i}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {row.rank ?? i + 1}
                    </span>
                    <span className="truncate">
                      {row.user?.profile?.fullName ||
                        row.user?.email ||
                        `User #${row.userId ?? row.user?.id}`}
                    </span>
                  </div>
                  <span className="shrink-0 font-semibold text-primary">
                    {row.totalPoints ?? row.totalBanhRan ?? 0}
                  </span>
                </div>
              ))
            )}
          </Card>
        )}
      </section>
    </div>
  );
}
