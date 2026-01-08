"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/user-api";

const copyToClipboard = async (value: string) => {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    }
  } catch (error) {
    console.error("Failed to copy", error);
  }
};

export function userColumns(): ColumnDef<User>[] {
  return [
    {
      header: "Provinsi",
      accessorKey: "province",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.province}</div>
          {row.original.provinceCode ? (
            <span className="text-xs text-muted-foreground">
              {row.original.provinceCode}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{row.original.email}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(row.original.email)}
          >
            Salin
          </Button>
        </div>
      ),
    },
    {
      header: "Password",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {row.original.password ?? "-"}
          </span>
          {row.original.password ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(row.original.password!)}
            >
              Salin
            </Button>
          ) : null}
        </div>
      ),
    },
    {
      header: "Link Dashboard",
      cell: ({ row }) => (
        <Button size="sm" variant="link" asChild>
          <Link
            href={row.original.loginUrl ?? "/dashboard/petugas"}
            target="_blank"
            rel="noreferrer"
          >
            Buka Dashboard Petugas
          </Link>
        </Button>
      ),
    },
  ];
}
