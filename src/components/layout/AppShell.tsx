"use client";

import { PageMotion } from "@/components/ui/PageMotion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiAward,
  FiBookOpen,
  FiCpu,
  FiEdit3,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMic,
  FiUpload,
  FiUser,
  FiHeadphones,
} from "react-icons/fi";
import { MdOutlineMenuBook } from "react-icons/md";

const NAV: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}[] = [
  { href: "/", label: "Trang chủ", icon: FiHome, exact: true },
  { href: "/vocab", label: "Từ vựng", icon: MdOutlineMenuBook },
  { href: "/reading", label: "Reading", icon: FiBookOpen },
  { href: "/writing", label: "Writing", icon: FiEdit3 },
  { href: "/speaking", label: "Speaking", icon: FiMic },
  { href: "/quizzes", label: "Quizzes", icon: FiHeadphones },
  { href: "/courses", label: "Khóa học", icon: FiLayers },
  { href: "/ai", label: "AI", icon: FiCpu },
  { href: "/leaderboard", label: "BXH", icon: FiAward },
  { href: "/profile", label: "Hồ sơ", icon: FiUser },
];

const TEACHER_NAV: typeof NAV = [
  { href: "/teacher", label: "Giảng dạy", icon: FiLayers },
  { href: "/upload", label: "Upload", icon: FiUpload },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, hydrate, logout } = useAuth();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const teacher =
    user?.role === "TEACHER" || user?.role === "ADMIN"
      ? TEACHER_NAV
      : [];

  const items = [...NAV, ...teacher];

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r-2 border-border bg-white/95 backdrop-blur md:flex">
        <div className="border-b-2 border-border px-5 py-5">
          <Link href="/" className="block">
            <div className="text-xl font-bold tracking-tight text-primary">
              BreadTrans
            </div>
            <p className="text-xs text-muted">Luyện thi TOEIC 4 kỹ năng</p>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-surface",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-2 border-border p-3">
          {user ? (
            <div className="space-y-2">
              <div className="truncate px-2 text-xs text-muted">
                {user.email}
                <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void onLogout()}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
              >
                <FiLogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-white"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-white/95 backdrop-blur md:hidden">
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {[...NAV.slice(0, 7), ...teacher.slice(0, 1)].map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="main-with-sidebar pb-nav-safe mx-auto w-full max-w-6xl px-4 py-6">
        <PageMotion>{children}</PageMotion>
      </main>
    </div>
  );
}
