"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mitigationColumns } from "@/components/mitigation-columns";
import MitigationDetailDialog from "@/components/mitigation-detail-dialog";
import MitigationEditDialog from "@/components/mitigation-edit-dialog";

import {
  getMitigation,
  putMitigation,
  removeMitigation,
  upsertMitigation,
} from "@/lib/mitigation-api";
import type { MitigationTable, MitigationRow } from "@/lib/types";

export default function Page() {
  const [rows, setRows] = useState<MitigationTable>([]);
  const [loading, setLoading] = useState(false);

  // dialogs state
  const [detail, setDetail] = useState<MitigationRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<MitigationRow | undefined>(
    undefined
  );

  async function load() {
    setLoading(true);
    try {
      const data = await getMitigation();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveAll(next: MitigationTable) {
    setLoading(true);
    try {
      await putMitigation(next);
      setRows(next);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
    () =>
      mitigationColumns({
        onDetail: (r) => setDetail(r),
        onEdit: (r) => {
          setEditInitial(r);
          setEditOpen(true);
        },
        onDelete: async (r) => {
          const next = removeMitigation(rows, r.category);
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
            <h1 className="text-xl font-semibold">Mitigation</h1>
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
                Tambah Aktivitas Mitigasi
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <DataTable data={rows} columns={columns} />
          )}

          <MitigationDetailDialog
            open={!!detail}
            onOpenChange={(v) => !v && setDetail(null)}
            row={detail}
          />

          <MitigationEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            initial={editInitial}
            onSubmit={async (row) => {
              const next = upsertMitigation(rows, row);
              await saveAll(next);
              setEditOpen(false);
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
