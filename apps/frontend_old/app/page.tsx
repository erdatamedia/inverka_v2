import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b bg-background">
        <h1 className="text-base font-semibold">Inverka v2</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-2">
            Inventory & Emission Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Pilih peran untuk mulai UAT. Baseline & Mitigation oleh Petugas,
            verifikasi oleh Verifikator, data master oleh Superadmin, dan
            ringkasan grafik oleh Viewer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RoleCard
            title="Petugas"
            desc="Input baseline & mitigation, lihat hasil perhitungan"
            href="/dashboard/petugas"
          />
          <RoleCard
            title="Verifikator"
            desc="Tinjau antrean, lihat detail, set status ajuan"
            href="/dashboard/verifikator"
          />
          <RoleCard
            title="Viewer"
            desc="Lihat ringkasan, grafik dan peta per provinsi"
            href="/dashboard/viewer"
          />
          <RoleCard
            title="Superadmin"
            desc="Tabel master: Population, Animal Params, Manure"
            href="/dashboard/superadmin"
          />
        </div>

        <div className="mt-10 text-xs text-muted-foreground">
          API base:{" "}
          <code className="px-1 py-0.5 rounded bg-muted">
            {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}
          </code>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t text-xs text-muted-foreground">
        © {new Date().getFullYear()} Inverka v2 — BRIN
      </footer>
    </div>
  );
}

function RoleCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border p-4 hover:shadow-sm transition-shadow bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">/</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
      <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
        Buka →
      </div>
    </Link>
  );
}
