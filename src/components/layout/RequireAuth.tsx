"use client";

import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { useAuth } from "@/lib/api";
import type { Role } from "@/lib/api/types";
import Link from "next/link";
import { useEffect } from "react";
import { FiLock } from "react-icons/fi";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, hydrated, hydrate } = useAuth();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated) return <PageLoading label="Đang kiểm tra phiên..." />;

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <FiLock className="h-12 w-12 text-muted" />
        <h2 className="text-xl font-semibold">Bạn cần đăng nhập</h2>
        <p className="max-w-md text-sm text-muted">
          Đăng nhập bằng tài khoản BreadTrans để tiếp tục học.
        </p>
        <Link href="/login">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireRole({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: Role[];
}) {
  const { user, hydrated, hydrate } = useAuth();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated) return <PageLoading />;

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="rounded-xl border-2 border-secondary/40 bg-secondary/10 p-4 text-sm">
        Cần vai trò: {roles.join(" / ")}. Hiện tại:{" "}
        {user?.role ?? "chưa đăng nhập"}.
      </div>
    );
  }

  return <>{children}</>;
}
