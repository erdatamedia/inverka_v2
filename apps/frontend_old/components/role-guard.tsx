"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export type AppRole = "superadmin" | "petugas" | "verifikator" | "viewer";

interface RoleGuardProps {
  allow: AppRole[];
  children: ReactNode;
}

/**
 * Lightweight RoleGuard to block pages when the user doesn't have access.
 * - Redirects to /login if no user.
 * - Redirects to / if role is not allowed.
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allow && !allow.includes(user.role as AppRole)) {
      router.replace("/");
    }
  }, [router, allow]);

  return <>{children}</>;
}
