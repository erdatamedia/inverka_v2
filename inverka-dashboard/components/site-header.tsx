"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";
import { ThemeSelector } from "./theme-selector";

const ROLE_TITLES: Record<string, string> = {
  superadmin: "Panel Superadmin",
  petugas: "Panel Petugas",
  verifikator: "Panel Verifikator",
};

const DEFAULT_TITLE = "Inverka Dashboard";

export function SiteHeader() {
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);

  useEffect(() => {
    try {
      const role = Cookies.get("role");
      if (!role) {
        setTitle(DEFAULT_TITLE);
        return;
      }
      setTitle(ROLE_TITLES[role] ?? `Panel ${role}`);
    } catch {
      setTitle(DEFAULT_TITLE);
    }
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
