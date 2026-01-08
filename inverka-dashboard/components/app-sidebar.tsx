/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
import {
  BarChart,
  ChartCandlestick,
  Database,
  PieChart,
  ShieldCheck,
  User,
  UserCog,
} from "lucide-react";
import Cookies from "js-cookie";

export function AppSidebar({ variant }: { variant?: "inset" | "floating" }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [roleState, setRoleState] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<string | null>(null);
  const [nameState, setNameState] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const r = Cookies.get("role") || null;
      const e = Cookies.get("email") || null;
      const n = Cookies.get("name") || null;
      setRoleState(r);
      setEmailState(e);
      setNameState(n);
    } catch {
      setRoleState(null);
      setEmailState(null);
      setNameState(null);
    }
  }, []);

  const normalizePath = (value: string) => {
    if (!value) return "/";
    const normalized = value.replace(/\/+$/, "");
    return normalized.length ? normalized : "/";
  };

  const menus = !mounted
    ? []
    : roleState === "superadmin"
    ? [
        {
          label: "Dashboard",
          href: "/dashboard/superadmin",
          icon: <BarChart className="h-4 w-4" />,
        },
        {
          label: "Data Master",
          href: "/dashboard/superadmin/master",
          icon: <Database className="h-4 w-4" />,
        },
        // di nav untuk superadmin
        {
          label: "Activity Data",
          href: "/dashboard/superadmin/activity-data",
          icon: <PieChart className="h-4 w-4" />,
        },
        {
          label: "Pengajuan",
          href: "/dashboard/superadmin/pengajuan",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: "Mitigation",
          href: "/dashboard/superadmin/mitigation",
          icon: <ChartCandlestick className="h-4 w-4" />,
        },
        {
          label: "Users",
          href: "/dashboard/superadmin/users",
          icon: <User className="h-4 w-4" />,
        },
      ]
    : roleState === "petugas"
    ? [
        {
          label: "Ringkasan",
          href: "/dashboard/petugas",
          icon: <BarChart className="h-4 w-4" />,
        },
        {
          label: "Daftar Pengajuan",
          href: "/dashboard/petugas/pengajuan",
          icon: <Database className="h-4 w-4" />,
        },
        {
          label: "Perhitungan Manure",
          href: "/dashboard/petugas/perhitungan-manure",
          icon: <ChartCandlestick className="h-4 w-4" />,
        },
        {
          label: "Perhitungan GRK Enterik",
          href: "/dashboard/petugas/perhitungan-enterik",
          icon: <PieChart className="h-4 w-4" />,
        },
      ]
    : roleState === "verifikator"
    ? [
        {
          label: "Dashboard",
          href: "/dashboard/verifikator",
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: "Daftar Pengajuan",
          href: "/dashboard/verifikator/riwayat",
          icon: <Database className="h-4 w-4" />,
        },
      ]
    : roleState === "viewer"
    ? [
        {
          label: "Ringkasan",
          href: "/dashboard/viewer",
          icon: <BarChart className="h-4 w-4" />,
        },
      ]
    : [
        {
          label: "Login",
          href: "/login",
          icon: <UserCog className="h-4 w-4" />,
        },
      ];

  const normalizedPath = normalizePath(pathname);
  const enhancedMenus = menus.map((menu) => ({
    ...menu,
    normalizedHref: normalizePath(menu.href),
  }));
  const activeHref = enhancedMenus.reduce<string | null>((best, menu) => {
    const { normalizedHref } = menu;
    const matches =
      normalizedPath === normalizedHref ||
      (normalizedHref !== "/" && normalizedPath.startsWith(`${normalizedHref}/`));
    if (!matches) return best;
    if (!best || normalizedHref.length > best.length) {
      return normalizedHref;
    }
    return best;
  }, null);

  const computedEmail = emailState
    ? emailState
    : roleState
    ? `${roleState}@inverka.app`
    : "guest@inverka.app";

  const computedName = React.useMemo(() => {
    if (nameState && nameState.trim().length > 0) return nameState.trim();
    if (emailState) {
      const raw = emailState.split("@")[0] ?? "";
      if (raw) {
        return raw
          .replace(/[._-]+/g, " ")
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }
    }
    return roleState ? roleState.toUpperCase() : "Guest";
  }, [emailState, nameState, roleState]);

  const user = {
    name: computedName,
    email: computedEmail,
    avatar: "/inverka.png",
  };

  if (!mounted) {
    return (
      <Sidebar variant={variant}>
        <SidebarHeader>
          <div className="flex items-center px-3 py-2">
            <img
              src="/inverka.png"
              alt="Inverka Logo"
              className="h-6 w-6 mr-2"
            />
            <span className="text-sm font-semibold tracking-tight">
              Inverka
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {/* empty until mounted to avoid mismatch */}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: "Guest",
              email: "guest@inverka.app",
              avatar: "/inverka.png",
            }}
          />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant={variant}>
      <SidebarHeader>
        <div className="flex items-center px-3 py-2">
          <img src="/inverka.png" alt="Inverka Logo" className="h-6 w-6 mr-2" />
          <span className="text-sm font-semibold tracking-tight">Inverka</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {enhancedMenus.map((menu) => (
              <SidebarMenuItem key={menu.href}>
                <SidebarMenuButton asChild>
                  <Link
                    href={menu.href}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md",
                      menu.normalizedHref === activeHref
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {menu.icon}
                    {menu.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
