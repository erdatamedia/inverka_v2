"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { userColumns } from "@/components/users-columns";
import {
  getUsers,
  User,
} from "@/lib/user-api";

export default function Page() {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await getUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => userColumns(), []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing)*72)",
          "--header-height": "calc(var(--spacing)*12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Kelola Petugas</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={load} disabled={loading}>
                Reload
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Gunakan kredensial berikut untuk mengakses dashboard petugas di
            setiap provinsi. Klik tombol salin untuk menyalin email atau
            password.
          </p>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <DataTable data={rows} columns={columns} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
