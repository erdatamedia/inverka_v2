"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type { SubmissionRecord } from "@/lib/types"
import type { ColumnDef } from "@tanstack/react-table"

import data from "./data.json"

type DashboardRow = (typeof data)[number]

const columns: ColumnDef<DashboardRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "header", header: "Header" },
  { accessorKey: "type", header: "Jenis" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Target" },
  { accessorKey: "limit", header: "Limit" },
  { accessorKey: "reviewer", header: "Reviewer" },
]

const EMPTY_SUBMISSIONS: SubmissionRecord[] = []

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards items={EMPTY_SUBMISSIONS} loading={false} error={null} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} columns={columns} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
