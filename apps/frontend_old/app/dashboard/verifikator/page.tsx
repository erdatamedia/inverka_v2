"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

function extractMsg(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      friendlyMessage?: string;
      message?: string;
      response?: { data?: unknown };
    };
    const respMsg =
      typeof e.response?.data === "string"
        ? e.response?.data
        : (e.response?.data as { message?: string } | undefined)?.message;
    return e.friendlyMessage || respMsg || e.message || "Request gagal";
  }
  return "Request gagal";
}

type QueueRow = {
  id: string;
  province: string;
  year: number;
  status: "menunggu" | "proses" | "terverifikasi" | "disetujui";
  createdAt?: string;
  hasResults?: boolean;
};

function nextAllowedStatuses(
  current: QueueRow["status"]
): Array<QueueRow["status"]> {
  switch (current) {
    case "menunggu":
      return ["proses"];
    case "proses":
      return ["terverifikasi"];
    case "terverifikasi":
      return ["disetujui"];
    case "disetujui":
    default:
      return [];
  }
}

export default function VerifikatorPage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const load = () =>
    api.get("/verifikasi/queue").then((res) => setRows(res.data));
  useEffect(() => {
    load();
  }, []);
  const patch = async (
    id: string,
    province: string,
    year: number,
    status: "proses" | "terverifikasi" | "disetujui",
    current: QueueRow["status"]
  ) => {
    const allowed = nextAllowedStatuses(current);
    if (!allowed.includes(status)) {
      alert(`Perubahan status tidak valid: ${current} → ${status}`);
      return;
    }
    try {
      setLoadingId(id);
      await api.patch(
        "/verifikasi/status",
        { id, province, year: Number(year), status },
        { headers: { "Content-Type": "application/json" } }
      );
      await load();
    } catch (err) {
      const msg = extractMsg(err);
      alert("Gagal memperbarui status: " + msg);
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <RoleGuard allow={["verifikator", "superadmin"]}>
      <AppShell role="verifikator">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Provinsi</th>
                <th className="p-2 border">Tahun</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: QueueRow) => (
                <tr key={r.id}>
                  <td className="border p-2">{r.id}</td>
                  <td className="border p-2">{r.province}</td>
                  <td className="border p-2">{r.year}</td>
                  <td className="border p-2">{r.status}</td>
                  <td className="border p-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        loadingId === r.id ||
                        !nextAllowedStatuses(r.status).includes("proses")
                      }
                      onClick={() =>
                        patch(r.id, r.province, r.year, "proses", r.status)
                      }
                    >
                      Proses
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        loadingId === r.id ||
                        !nextAllowedStatuses(r.status).includes("terverifikasi")
                      }
                      onClick={() =>
                        patch(
                          r.id,
                          r.province,
                          r.year,
                          "terverifikasi",
                          r.status
                        )
                      }
                    >
                      Verifikasi
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={
                        loadingId === r.id ||
                        !nextAllowedStatuses(r.status).includes("disetujui")
                      }
                      onClick={() =>
                        patch(r.id, r.province, r.year, "disetujui", r.status)
                      }
                    >
                      Setujui
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppShell>
    </RoleGuard>
  );
}
