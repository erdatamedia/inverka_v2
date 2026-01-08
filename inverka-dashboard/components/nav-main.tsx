"use client";

import {
  IconCirclePlusFilled,
  IconMail,
  type Icon,
  IconLayoutDashboard,
  IconUsers,
  IconTable,
  IconChecks,
  IconUserShield,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link"; // Mengganti Button jika tujuannya adalah navigasi

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Definisikan tipe Role yang Anda gunakan di app/dashboard/layout.tsx
export type UserRole = "superadmin" | "petugas" | "verifikator" | "viewer";

// Struktur data untuk Navigasi
interface NavItem {
  title: string;
  url: string;
  icon: Icon;
  // Menentukan role mana yang dapat melihat item menu ini
  roles: UserRole[];
}

// 1. Definisikan semua item menu dengan role yang sesuai
const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard Utama",
    url: "/dashboard/main", // Ubah sesuai rute dashboard utama Anda
    icon: IconLayoutDashboard,
    roles: ["superadmin", "petugas", "verifikator", "viewer"],
  },
  {
    title: "Data Aktivitas",
    url: "/dashboard/activity-data",
    icon: IconTable,
    roles: ["superadmin", "petugas", "verifikator"],
  },
  {
    title: "Verifikasi Data",
    url: "/dashboard/verifikator",
    icon: IconChecks,
    roles: ["superadmin", "verifikator"],
  },
  {
    title: "Manajemen Pengguna",
    url: "/dashboard/users",
    icon: IconUsers,
    roles: ["superadmin"],
  },
  {
    title: "Data Master",
    url: "/dashboard/superadmin/master",
    icon: IconUserShield,
    roles: ["superadmin"],
  },
];

export function NavMain({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();

  // 2. Filter item menu berdasarkan role pengguna
  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Create Section (Jika masih diperlukan) */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* Menggunakan Link jika "Quick Create" menuju halaman, 
                atau SidebarMenuButton jika hanya untuk trigger modal */}
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Main Navigation List */}
        <SidebarMenu>
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild // Mengizinkan Link sebagai child
                  className={isActive ? "bg-accent/50 hover:bg-accent" : ""}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
