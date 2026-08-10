"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ErrorState, PageLoading } from "@/components/ui/Loading";
import { gamificationApi, userApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  FiAward,
  FiBookOpen,
  FiEdit3,
  FiHeadphones,
  FiMic,
} from "react-icons/fi";
import { MdOutlineMenuBook } from "react-icons/md";

const SKILLS = [
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
    desc: "Luyện nghe & đề",
    icon: FiHeadphones,
  },
  {
    href: "/leaderboard",
    title: "Bảng xếp hạng",
    desc: "Bánh rắn & badge",
    icon: FiAward,
  },
];

export default function DashboardPage() {
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-foreground">
          Xin chào, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-1 text-muted">
          Chọn kỹ năng để luyện hôm nay — BreadTrans TOEIC.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg border-2 border-border bg-white px-4 py-2 text-sm">
            Streak:{" "}
            <strong className="text-warning">
              {Number(profile?.streakCount ?? 0)} ngày
            </strong>
          </div>
          <div className="rounded-lg border-2 border-border bg-white px-4 py-2 text-sm">
            Bánh rắn:{" "}
            <strong className="text-primary">
              {Number(profile?.totalBanhRan ?? 0)}
            </strong>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="h-full transition hover:border-primary hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{s.title}</CardTitle>
                    <CardDescription>{s.desc}</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top bảng xếp hạng</h2>
          <Link href="/leaderboard" className="text-sm text-primary">
            Xem tất cả
          </Link>
        </div>
        {boardQ.isError ? (
          <ErrorState message={getErrorMessage(boardQ.error)} />
        ) : (
          <Card className="divide-y divide-border/60 p-0 overflow-hidden">
            {top.length === 0 ? (
              <p className="p-4 text-sm text-muted">Chưa có dữ liệu.</p>
            ) : (
              top.map((row, i) => (
                <div
                  key={row.userId ?? row.user?.id ?? i}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {row.rank ?? i + 1}
                    </span>
                    <span>
                      {row.user?.profile?.fullName ||
                        row.user?.email ||
                        `User #${row.userId ?? row.user?.id}`}
                    </span>
                  </div>
                  <span className="font-semibold text-primary">
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
