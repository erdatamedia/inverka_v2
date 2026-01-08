import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as fs from "fs";
import * as path from "path";

const dataDir = path.join(__dirname, "../data/petugas");
type ApprovedRow = {
  id: string;
  province: string;
  year: number;
  status: string;
  results?: {
    totals?: { baseline: number; mitigationSum: number; reducedPct: number };
  };
};

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => {
          const v = r[h] ?? "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}

@Controller("viewer")
export class ViewerController {
  constructor(private jwt: JwtService) {}

  // semua role boleh lihat viewer (viewer/verifikator/superadmin/petugas)
  private user(auth?: string) {
    if (!auth?.startsWith("Bearer "))
      throw new BadRequestException("Missing token");
    const payload: any = this.jwt.verify(auth.split(" ")[1], {
      secret: process.env.JWT_SECRET || "devsecret",
    });
    return payload;
  }

  private listAllApprovedByYear(year: number): ApprovedRow[] {
    const rows: ApprovedRow[] = [];
    if (!fs.existsSync(dataDir)) return rows;

    for (const prov of fs.readdirSync(dataDir)) {
      if (!prov || prov.startsWith(".")) continue;
      const provPath = path.join(dataDir, prov);
      let st;
      try {
        st = fs.statSync(provPath);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;

      const yearPath = path.join(provPath, String(year));
      let stYear;
      try {
        stYear = fs.statSync(yearPath);
      } catch {
        continue;
      }
      if (!stYear.isDirectory()) continue;

      for (const f of fs.readdirSync(yearPath)) {
        if (!f || f.startsWith(".") || !f.endsWith(".json")) continue;
        const p = path.join(yearPath, f);
        try {
          const sub = JSON.parse(fs.readFileSync(p, "utf8"));
          if (sub?.status === "disetujui") {
            rows.push({
              id: sub.id,
              province: sub.province,
              year: sub.year,
              status: sub.status,
              results: sub.results ?? undefined,
            });
          }
        } catch {
          /* skip */
        }
      }
    }
    return rows;
  }

  @Get("approved")
  approved(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required (number)");
    return this.listAllApprovedByYear(year).map((s) => ({
      id: s.id,
      province: s.province,
      year: s.year,
      baseline: s.results?.totals?.baseline ?? null,
      mitigationSum: s.results?.totals?.mitigationSum ?? null,
      reducedPct: s.results?.totals?.reducedPct ?? null,
    }));
  }

  @Get("summary-by-province")
  summaryByProvince(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required (number)");
    const rows = this.listAllApprovedByYear(year);

    const byProv: Record<
      string,
      { baseline: number; mitigation: number; count: number }
    > = {};
    for (const r of rows) {
      const b = r.results?.totals?.baseline ?? 0;
      const m = r.results?.totals?.mitigationSum ?? 0;
      if (!byProv[r.province])
        byProv[r.province] = { baseline: 0, mitigation: 0, count: 0 };
      byProv[r.province].baseline += b;
      byProv[r.province].mitigation += m;
      byProv[r.province].count += 1;
    }

    return Object.entries(byProv).map(([province, v]) => {
      const reducedPct =
        v.baseline > 0
          ? Number(
              (((v.baseline - v.mitigation) / v.baseline) * 100).toFixed(2)
            )
          : 0;
      return {
        province,
        year,
        submissions: v.count,
        baseline: Number(v.baseline.toFixed(2)),
        mitigation: Number(v.mitigation.toFixed(2)),
        reducedPct,
      };
    });
  }

  @Get("timeseries")
  timeseries(
    @Headers("authorization") auth?: string,
    @Query("province") province?: string,
    @Query("from") fromQ?: string,
    @Query("to") toQ?: string
  ) {
    this.user(auth);
    const provinceCode = (province ?? "").toUpperCase();
    if (!provinceCode)
      throw new BadRequestException("province is required");
    const from = Number(fromQ ?? "2020");
    const to = Number(toQ ?? "2030");
    if (to < from) throw new BadRequestException("to must be >= from");

    const out: any[] = [];
    if (!fs.existsSync(dataDir)) return out;

    if (provinceCode === "ALL") {
      for (let year = from; year <= to; year++) {
        const rows = this.listAllApprovedByYear(year);
        if (!rows.length) continue;
        let baseline = 0;
        let mitigation = 0;
        let count = 0;
        for (const r of rows) {
          const totals = r.results?.totals;
          if (!totals) continue;
          baseline += Number(totals.baseline || 0);
          mitigation += Number(totals.mitigationSum || 0);
          count++;
        }
        if (count > 0) {
          out.push({
            province: "ALL",
            year,
            baseline: Number(baseline.toFixed(2)),
            mitigation: Number(mitigation.toFixed(2)),
            reducedPct:
              baseline > 0
                ? Number(
                    (((baseline - mitigation) / baseline) * 100).toFixed(2)
                  )
                : 0,
            submissions: count,
          });
        }
      }
      out.sort((a, b) => a.year - b.year);
      return out;
    }

    const provPath = path.join(dataDir, provinceCode);
    let stProv;
    try {
      stProv = fs.statSync(provPath);
    } catch {
      return out;
    }
    if (!stProv.isDirectory()) return out;

    for (const y of fs.readdirSync(provPath)) {
      const year = Number(y);
      if (!year || year < from || year > to) continue;
      const yearPath = path.join(provPath, y);
      let stYear;
      try {
        stYear = fs.statSync(yearPath);
      } catch {
        continue;
      }
      if (!stYear.isDirectory()) continue;

      let baseline = 0,
        mitigation = 0,
        count = 0;
      for (const f of fs.readdirSync(yearPath)) {
        if (!f.endsWith(".json")) continue;
        const p = path.join(yearPath, f);
        try {
          const sub = JSON.parse(fs.readFileSync(p, "utf8"));
          if (sub?.status === "disetujui" && sub?.results?.totals) {
            baseline += Number(sub.results.totals.baseline || 0);
            mitigation += Number(sub.results.totals.mitigationSum || 0);
            count++;
          }
        } catch {
          /* skip */
        }
      }
      if (count > 0) {
        out.push({
          province,
          year,
          baseline: Number(baseline.toFixed(2)),
          mitigation: Number(mitigation.toFixed(2)),
          reducedPct:
            baseline > 0
              ? Number((((baseline - mitigation) / baseline) * 100).toFixed(2))
              : 0,
          submissions: count,
        });
      }
    }

    // sort naik per tahun
    out.sort((a, b) => a.year - b.year);
    return out;
  }

  @Get("map")
  map(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string,
    @Query("metric") metric?: "reducedPct" | "baseline" | "mitigation"
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required (number)");
    const rows = this.summaryByProvince(auth, String(year)) as any[];

    const pick = (r: any) => {
      if (metric === "baseline") return Number(r.baseline);
      if (metric === "mitigation") return Number(r.mitigation);
      return Number(r.reducedPct); // default
    };

    return rows.map((r) => ({
      province: r.province,
      metric: pick(r),
      tooltip: {
        year: r.year,
        submissions: r.submissions,
        baseline: r.baseline,
        mitigation: r.mitigation,
        reducedPct: r.reducedPct,
      },
    }));
  }

  @Get("overall")
  overall(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required (number)");

    const rows = this.listAllApprovedByYear(year);
    let baseline = 0,
      mitigation = 0,
      count = 0;
    for (const r of rows) {
      const t = r.results?.totals;
      if (!t) continue;
      baseline += Number(t.baseline || 0);
      mitigation += Number(t.mitigationSum || 0);
      count++;
    }
    const reducedPct =
      baseline > 0
        ? Number((((baseline - mitigation) / baseline) * 100).toFixed(2))
        : 0;

    return {
      year,
      submissions: count,
      baseline: Number(baseline.toFixed(2)),
      mitigation: Number(mitigation.toFixed(2)),
      reducedPct,
    };
  }

  @Get("chart/donut")
  donut(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string,
    @Query("province") province?: string
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required");
    if (!province) throw new BadRequestException("province is required");

    const rows = this.listAllApprovedByYear(year).filter(
      (r) => r.province === province
    );
    let baseline = 0,
      mitigation = 0;
    for (const r of rows) {
      baseline += Number(r.results?.totals?.baseline || 0);
      mitigation += Number(r.results?.totals?.mitigationSum || 0);
    }
    return {
      labels: ["Baseline", "Mitigation"],
      series: [Number(baseline.toFixed(2)), Number(mitigation.toFixed(2))],
      reducedPct:
        baseline > 0
          ? Number((((baseline - mitigation) / baseline) * 100).toFixed(2))
          : 0,
    };
  }

  @Get("export/summary-by-province.csv")
  exportSummaryCsv(
    @Headers("authorization") auth?: string,
    @Query("year") yearQ?: string
  ) {
    this.user(auth);
    const year = Number(yearQ);
    if (!year) throw new BadRequestException("year is required");
    const rows = this.summaryByProvince(auth, String(year)) as any[];
    const csv = toCsv(rows);
    return csv; // FE set header 'text/csv' (di Nest bisa pakai @Res untuk set content-type, kalau mau)
  }
}
