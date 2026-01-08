"use client";
import { ReactNode } from "react";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role: string;
}) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("access_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <h2 className="font-bold">Inverka</h2>
        <nav className="flex flex-col gap-2 text-sm">
          {role === "superadmin" && (
            <>
              <Link href="/dashboard/superadmin">Data Master</Link>
            </>
          )}
          {role === "petugas" && (
            <>
              <Link href="/dashboard/petugas">Baseline & Mitigasi</Link>
            </>
          )}
          {role === "verifikator" && (
            <>
              <Link href="/dashboard/verifikator">Antrian Ajuan</Link>
            </>
          )}
          {role === "viewer" && (
            <>
              <Link href="/dashboard/viewer">Ringkasan</Link>
            </>
          )}
        </nav>
      </aside>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">Dashboard {role}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
