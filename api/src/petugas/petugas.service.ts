// apps/api/src/petugas/petugas.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { BaselineInput, MitigationInput } from "./petugas.dto";

function readFcFactor(): {
  fc1: number;
  fc2: number;
  fc3: number;
  fc4: number;
} {
  const p = path.join(__dirname, "../data/fc_factor.json");
  if (!fs.existsSync(p)) {
    return { fc1: 1.0, fc2: 0.92, fc3: 0.85, fc4: 0.8 }; // default realistis ~8-10%
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    return {
      fc1: Number(raw.fc1 ?? 1.0),
      fc2: Number(raw.fc2 ?? 0.92),
      fc3: Number(raw.fc3 ?? 0.85),
      fc4: Number(raw.fc4 ?? 0.8),
    };
  } catch {
    return { fc1: 1.0, fc2: 0.92, fc3: 0.85, fc4: 0.8 };
  }
}
const dataDir = path.join(__dirname, "../data/petugas");

type Status = "menunggu" | "proses" | "terverifikasi" | "disetujui";
interface Submission {
  id: string;
  createdAt: string;
  role: "petugas";
  province: string;
  year: number;
  status: Status;
  baseline: BaselineInput;
  mitigation?: MitigationInput;
  // cache hasil kalkulasi tabel2 & reduksi
  results?: {
    feedDistribution: any[];
    emissionTable: any[];
    totals: {
      baseline: number;
      fc2: number;
      fc3: number;
      fc4: number;
      reducedPct: number;
      mitigationSum: number;
    };
  };
}

@Injectable()
export class PetugasService {
  private ensureDir(p: string) {
    fs.mkdirSync(p, { recursive: true });
  }
  private save(sub: Submission) {
    const dir = path.join(dataDir, sub.province, String(sub.year));
    this.ensureDir(dir);
    fs.writeFileSync(
      path.join(dir, sub.id + ".json"),
      JSON.stringify(sub, null, 2)
    );
    return sub;
  }
  private load(province: string, year: number, id: string): Submission {
    const p = path.join(dataDir, province, String(year), id + ".json");
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  createBaseline(user: any, dto: BaselineInput) {
    // guard provinsi (superadmin boleh lintas provinsi)
    if (user.role !== "superadmin") {
      if (user.role !== "petugas" || user.province !== dto.province) {
        throw new ForbiddenException("Forbidden province");
      }
    }
    const total =
      dto.distribution.Weaning +
      dto.distribution.Yearling +
      dto.distribution.Young +
      dto.distribution.Mature;
    if (total !== dto.total_population) {
      throw new BadRequestException(
        `Distribusi (${total}) tidak sama dengan total_population (${dto.total_population})`
      );
    }
    const sub: Submission = {
      id: "SUB-" + Date.now(),
      createdAt: new Date().toISOString(),
      role: "petugas",
      province: dto.province,
      year: dto.year,
      status: "menunggu",
      baseline: dto,
    };
    return this.save(sub);
  }
  attachMitigation(
    user: any,
    dto: MitigationInput & { year: number; province: string }
  ) {
    // guard provinsi (superadmin boleh lintas provinsi)
    if (user.role !== "superadmin") {
      if (user.role !== "petugas" || user.province !== dto.province) {
        throw new ForbiddenException("Forbidden province");
      }
    }
    const sub = this.load(dto.province, dto.year, dto.submissionId);
    sub.mitigation = dto;

    // === Kalkulasi cepat sesuai contoh UAT ===
    // 1) EF baseline per fisiologis (kg CH4/head/yr) – kita set agar match contohmu:
    const EF_BASE: Record<string, number> = {
      Weaning: 3.822,
      Yearling: 4.7705,
      Young: 7.6704,
      Mature: 21.8736,
    };
    // 2) Faktor penurunan per Feed Class dibanding baseline (hasil dari aksi & komposisi)
    // Diset agar menghasilkan nilai contohmu; bisa dipindah ke file config nanti.
    const FC_FACTOR = readFcFactor(); // baca dari file konfigurasi agar bisa diubah runtime

    // Alokasi populasi per kelas → tabel “Populasi berdasarkan kelas pakan”
    const feedDist: any[] = [];
    const phys: (keyof MitigationInput["feedClass"])[] = [
      "Weaning",
      "Yearling",
      "Young",
      "Mature",
    ];
    let totals = { fc1: 0, fc2: 0, fc3: 0, fc4: 0, total: 0 };
    for (const ph of phys) {
      const d = dto.feedClass[ph];
      const row = {
        Physiological_status: ph,
        Feed_Class_1_Baseline: d.fc1,
        Feed_Class_2: d.fc2,
        Feed_Class_3: d.fc3,
        Feed_Class_4: d.fc4,
        Total: d.fc1 + d.fc2 + d.fc3 + d.fc4,
      };
      totals.fc1 += d.fc1;
      totals.fc2 += d.fc2;
      totals.fc3 += d.fc3;
      totals.fc4 += d.fc4;
      totals.total += row.Total;
      feedDist.push(row);
    }

    // Tabel “Perhitungan pengurangan emisi”
    const emissionRows: any[] = [];
    let sumFC1 = 0,
      sumFC2 = 0,
      sumFC3 = 0,
      sumFC4 = 0;
    for (const ph of phys) {
      const ef0 = EF_BASE[ph];
      const d = dto.feedClass[ph];
      const baseline = ef0 * d.fc1;
      const e2 = ef0 * FC_FACTOR.fc2 * d.fc2;
      const e3 = ef0 * FC_FACTOR.fc3 * d.fc3;
      const e4 = ef0 * FC_FACTOR.fc4 * d.fc4;
      sumFC1 += baseline;
      sumFC2 += e2;
      sumFC3 += e3;
      sumFC4 += e4;
      emissionRows.push({
        Physiological_status: ph,
        Emission_kgCH4_per_head_year: ef0.toFixed(2),
        Feed_Class_1_Baseline: Number(baseline.toFixed(2)),
        Feed_Class_2_Mitigation: Number(e2.toFixed(2)),
        Feed_Class_3_Mitigation: Number(e3.toFixed(2)),
        Feed_Class_4_Mitigation: Number(e4.toFixed(2)),
      });
    }
    const mitigationSum = Number((sumFC2 + sumFC3 + sumFC4).toFixed(2));

    // baseline skenario (pre-mitigasi) dihitung dari distribusi baseline original
    // Perhitungan ini sudah mengalikan faktor emisi (EF) per head dengan jumlah populasi per kategori,
    // sehingga baselineScenario menggambarkan total emisi baseline sebelum mitigasi (dalam satuan total, Gg CO2e).
    const baselineScenario = Number(
      (
        EF_BASE.Weaning * sub.baseline.distribution.Weaning +
        EF_BASE.Yearling * sub.baseline.distribution.Yearling +
        EF_BASE.Young * sub.baseline.distribution.Young +
        EF_BASE.Mature * sub.baseline.distribution.Mature
      ).toFixed(2)
    );

    // reduksi (%) terhadap skenario baseline
    const reducedPct =
      baselineScenario > 0
        ? Number(
            (
              ((baselineScenario - mitigationSum) / baselineScenario) *
              100
            ).toFixed(2)
          )
        : 0;

    sub.results = {
      feedDistribution: feedDist,
      emissionTable: emissionRows,
      totals: {
        baseline: baselineScenario,
        fc2: Number(sumFC2.toFixed(2)),
        fc3: Number(sumFC3.toFixed(2)),
        fc4: Number(sumFC4.toFixed(2)),
        mitigationSum,
        reducedPct,
      },
    };
    sub.status = "proses";
    return this.save(sub);
  }
  getResults(user: any, province: string, year: number, id: string) {
    const sub = this.load(province, year, id);
    // petugas hanya boleh lihat provinsinya sendiri; superadmin & verifikator boleh semuanya
    if (user.role === "petugas" && user.province !== province) {
      throw new ForbiddenException("Forbidden province");
    }
    return sub.results;
  }
  private listAllByYear(year: number) {
    const out: any[] = [];
    if (!fs.existsSync(dataDir)) return out;
    for (const prov of fs.readdirSync(dataDir)) {
      const dir = path.join(dataDir, prov, String(year));
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
        out.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      }
    }
    return out;
  }

  listMine(user: any, year: number) {
    // superadmin melihat semua provinsi; petugas hanya provinsinya
    if (user.role === "superadmin") {
      return this.listAllByYear(year);
    }
    const dir = path.join(dataDir, user.province, String(year));
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  }
}
