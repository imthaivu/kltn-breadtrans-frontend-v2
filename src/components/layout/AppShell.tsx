"use client";

import { PageMotion } from "@/components/ui/PageMotion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/api";
import type { Role } from "@/lib/api/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCpu,
  FiEdit3,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMic,
  FiMoreHorizontal,
  FiUser,
  FiHeadphones,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { MdOutlineMenuBook } from "react-icons/md";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const STUDENT_NAV: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: FiHome, exact: true },
  { href: "/vocab", label: "Từ vựng", icon: MdOutlineMenuBook },
  { href: "/reading", label: "Reading", icon: FiBookOpen },
  { href: "/writing", label: "Writing", icon: FiEdit3 },
  { href: "/speaking", label: "Speaking", icon: FiMic },
  { href: "/quizzes", label: "Luyện thi TOEIC", icon: FiHeadphones },
  { href: "/courses", label: "Khóa học", icon: FiLayers },
  { href: "/ai", label: "Trợ lý AI", icon: FiCpu },
  { href: "/leaderboard", label: "BXH", icon: FiAward },
  { href: "/profile", label: "Hồ sơ", icon: FiUser },
];

const TEACHER_NAV: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: FiHome, exact: true },
  { href: "/teacher", label: "Giảng dạy", icon: FiVideo },
  { href: "/courses", label: "Khóa học", icon: FiLayers },
  { href: "/ai", label: "Trợ lý AI", icon: FiCpu },
  { href: "/quizzes", label: "Quizzes", icon: FiHeadphones },
  { href: "/speaking", label: "Speaking", icon: FiMic },
  { href: "/leaderboard", label: "BXH", icon: FiAward },
  { href: "/profile", label: "Hồ sơ", icon: FiUser },
];

/** 4 mục chính trên mobile + "Thêm" */
const STUDENT_MOBILE_PRIMARY = ["/", "/vocab", "/reading", "/courses"];
const TEACHER_MOBILE_PRIMARY = ["/", "/teacher", "/courses", "/ai"];

function navForRole(role?: Role | null): NavItem[] {
  if (role === "TEACHER" || role === "ADMIN") return TEACHER_NAV;
  return STUDENT_NAV;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabelOf(role?: Role | null) {
  if (role === "TEACHER") return "Giáo viên";
  if (role === "ADMIN") return "Admin";
  if (role === "STUDENT") return "Học viên";
  return null;
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, hydrate, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const items = useMemo(() => navForRole(user?.role), [user?.role]);
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const primaryHrefs = isTeacher
    ? TEACHER_MOBILE_PRIMARY
    : STUDENT_MOBILE_PRIMARY;

  const mobilePrimary = items.filter((i) => primaryHrefs.includes(i.href));
  const mobileMore = items.filter((i) => !primaryHrefs.includes(i.href));
  const moreActive = mobileMore.some((i) =>
    isActive(pathname, i.href, i.exact),
  );
  const roleLabel = roleLabelOf(user?.role);

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-white/95 backdrop-blur md:flex">
        <div className="border-b border-border px-5 py-5">
          <Link href="/" className="block">
            <div className="text-xl font-bold tracking-tight text-primary">
              BreadTrans
            </div>
            <p className="mt-0.5 text-xs leading-snug text-muted">
              {isTeacher
                ? "Quản lý lớp & nội dung TOEIC"
                : "Luyện thi TOEIC & luyện tập chung"}
            </p>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-surface hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          {user ? (
            <div className="space-y-2">
              <div className="truncate px-2 text-xs text-muted">
                {user.email}
                {roleLabel ? (
                  <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
                    {roleLabel}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
              >
                <FiLogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-white"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile more sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Đóng"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Thêm</p>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-surface"
                onClick={() => setMoreOpen(false)}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mobileMore.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => void onLogout()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted"
              >
                <FiLogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Mobile bottom nav — 5 ô đều */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {mobilePrimary.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium",
              moreActive || moreOpen ? "text-primary" : "text-muted",
            )}
          >
            <FiMoreHorizontal className="h-5 w-5" />
            Thêm
          </button>
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="app-main">
        <div className="app-main-inner">
          <PageMotion>{children}</PageMotion>
        </div>
      </main>
    </div>
  );
}
