"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { activityColumns } from "@/components/activity-columns";
import ActivityDetailDialog from "@/components/activity-detail-dialog";
import ActivityEditDialog from "@/components/activity-edit-dialog";
import {
  getActivityData,
  putActivityData,
  removeActivity,
  upsertActivity,
} from "@/lib/activity-api";
import type { ActivityData, ActivityDataRow } from "@/lib/types";

export default function Page() {
  const [rows, setRows] = useState<ActivityData>([]);
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<ActivityDataRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<ActivityDataRow | undefined>(
    undefined
  );

  async function load() {
    setLoading(true);
    try {
      setRows(await getActivityData());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveAll(next: ActivityData) {
    setLoading(true);
    try {
      await putActivityData(next);
      setRows(next);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
    () =>
      activityColumns({
        onDetail: (r) => setDetail(r),
        onEdit: (r) => {
          setEditInitial(r);
          setEditOpen(true);
        },
        onDelete: async (r) => {
          const next = removeActivity(rows, r.provinceCode);
          await saveAll(next);
        },
      }),
    [rows]
  );

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
            <h1 className="text-xl font-semibold">Activity Data</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={load} disabled={loading}>
                Reload
              </Button>
              <Button
                onClick={() => {
                  setEditInitial(undefined);
                  setEditOpen(true);
                }}
              >
                Tambah Provinsi
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <DataTable data={rows} columns={columns} />
          )}

          <ActivityDetailDialog
            open={!!detail}
            onOpenChange={(v) => !v && setDetail(null)}
            row={detail}
          />

          <ActivityEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            initial={editInitial}
            onSubmit={async (row) => {
              const next = upsertActivity(rows, row);
              await saveAll(next);
              setEditOpen(false);
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
