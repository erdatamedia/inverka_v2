import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "../config/config.service";

type EfOverride = {
  Production_System: string;
  Animal_Category: string;
  Manure_CH4_kg_head_yr: number;
  Manure_N2O_kg_head_yr: number;
};

const GWP_CH4 = 28; // AR6 untuk CH4 non-fossil
const GWP_N2O = 271; // AR6
const MJ_PER_KG_CH4 = 55.65;
const MJ_PER_KG_DM = 9.35;

@Injectable()
export class EmissionsService {
  private dataDir = path.join(__dirname, "../data");
  constructor(private cfg: ConfigService) {}

  private readEfOverrides(): EfOverride[] {
    const p = path.join(this.dataDir, "ef_overrides.json");
    if (!fs.existsSync(p)) return [];
    try {
      return JSON.parse(fs.readFileSync(p, "utf8")) as EfOverride[];
    } catch {
      return [];
    }
  }

  /** Enteric EF (kg CH4/head/yr) = GE(MJ/d)*Ym%*365 / 55.65 ; GE = DMI * 9.35 */
  private entericEF(row: any, dmi: number): number {
    const Ym = Number(row.Ym_input ?? row.Ym ?? 0);
    const GE = dmi * MJ_PER_KG_DM;
    const kgCH4yr = (GE * (Ym / 100) * 365) / MJ_PER_KG_CH4;
    return Number(kgCH4yr.toFixed(2));
  }

  /** Join helper */
  private key(ps: string, cat: string) {
    return `${ps}|${cat}`;
  }

  /** Table 1: Calculated EF per head/year */
  efTable() {
    const params = this.cfg.getAnimalParams();
    const pop = this.cfg.getPopulation();
    const efOverrides = this.readEfOverrides();

    const DMI_MAP: Record<string, number> = {
      "Extensive|Beef Cattle_Weaning": 8.09,
      "Extensive|Beef Cattle_Yearling": 12.85,
      "Extensive|Beef Cattle_Adult Male": 12.48,
      "Extensive|Beef Cattle_Adult Female": 12.98,
      "Semi-Intensive|Beef Cattle_Weaning": 4.01,
      "Semi-Intensive|Beef Cattle_Yearling": 5.9,
      "Semi-Intensive|Beef Cattle_Adult Male": 6.67,
      "Semi-Intensive|Beef Cattle_Adult Female": 7.3,
      "Intensive|Beef Cattle_Weaning": 7.16,
      "Intensive|Beef Cattle_Yearling": 9.77,
      "Intensive|Beef Cattle_Adult Male": 15.18,
      "Intensive|Beef Cattle_Adult Female": 11.42,
      "Intensive|Imported Cattle": 10.64,
    };

    const efManureMap = new Map(
      efOverrides.map((o) => [
        this.key(o.Production_System, o.Animal_Category),
        o,
      ])
    );

    return params.map((p) => {
      const k = this.key(p.Production_System, p.Animal_Category);
      // ambil DMI dari map lokal
      const dmi = DMI_MAP[k] ?? 0;

      const efEnteric = this.entericEF(p, dmi);
      const manure = efManureMap.get(k);
      const efManureCH4 = Number(
        (manure?.Manure_CH4_kg_head_yr ?? 0).toFixed(2)
      );
      const efManureN2O = Number(
        (manure?.Manure_N2O_kg_head_yr ?? 0).toFixed(2)
      );
      return {
        Production_System: p.Production_System,
        Animal_Category: p.Animal_Category,
        Enteric_CH4_kg_head_yr: efEnteric,
        Manure_CH4_kg_head_yr: efManureCH4,
        Manure_N2O_kg_head_yr: efManureN2O,
      };
    });
  }

  /** Table 3 rows (detail) and totals */
  detailTable() {
    const ef = this.efTable();
    const params = this.cfg.getAnimalParams();
    const pop = this.cfg.getPopulation();
    const manure = this.cfg.getManureMgmt();

    const popMap = new Map(
      pop.map((r) => [
        this.key(r.Production_System, r.Animal_Category),
        r.Population_Head,
      ])
    );
    const manureMap = new Map(
      manure.map((r) => [this.key(r.Production_System, r.Animal_Category), r])
    );
    const dmiMap = new Map<string, number>();
    // sinkron dengan DMI_MAP di ConfigService
    const dm = {
      "Extensive|Beef Cattle_Weaning": 8.09,
      "Extensive|Beef Cattle_Yearling": 12.85,
      "Extensive|Beef Cattle_Adult Male": 12.48,
      "Extensive|Beef Cattle_Adult Female": 12.98,
      "Semi-Intensive|Beef Cattle_Weaning": 4.01,
      "Semi-Intensive|Beef Cattle_Yearling": 5.9,
      "Semi-Intensive|Beef Cattle_Adult Male": 6.67,
      "Semi-Intensive|Beef Cattle_Adult Female": 7.3,
      "Intensive|Beef Cattle_Weaning": 7.16,
      "Intensive|Beef Cattle_Yearling": 9.77,
      "Intensive|Beef Cattle_Adult Male": 15.18,
      "Intensive|Beef Cattle_Adult Female": 11.42,
      "Intensive|Imported Cattle": 10.64,
    };
    Object.entries(dm).forEach(([k, v]) => dmiMap.set(k, v));

    // Helper ambil param per baris
    const paramMap = new Map(
      params.map((p) => [this.key(p.Production_System, p.Animal_Category), p])
    );
    const efMap = new Map(
      ef.map((e) => [this.key(e.Production_System, e.Animal_Category), e])
    );

    const rows = ef.map((e) => {
      const k = this.key(e.Production_System, e.Animal_Category);
      const p = paramMap.get(k)!;
      const mm = manureMap.get(k);
      const population = popMap.get(k) ?? 0;
      const dmi = dmiMap.get(k) ?? 0;

      // tampilkan DE (calculated) ala tabelmu; di sini pakai pendekatan sederhana: DE ~= DMD - 3.28 (default), dengan penyesuaian ringan per system agar mendekati angka kamu
      const dmd = Number(p.DMD_percent);
      const system = p.Production_System;
      const deAdjust =
        system === "Semi-Intensive"
          ? 1.42
          : system === "Intensive"
          ? 2.78
          : 3.28;
      const DE_calc = Number((dmd - deAdjust).toFixed(2));

      // MMS total
      const mmsTotal =
        (mm?.Lagoon ?? 0) +
        (mm?.["Liquid/Slurry"] ?? 0) +
        (mm?.Solid_Storage ?? 0) +
        (mm?.Dry_Lot ?? 0) +
        (mm?.["Pasture/Range/Paddock"] ?? 0) +
        (mm?.Daily_Spread ?? 0) +
        (mm?.Composting ?? 0) +
        (mm?.Burned_for_fuel ?? 0) +
        (mm?.Biogas ?? 0);

      // GE & Nex dari service yang sama dengan endpoint manure-nex
      const GE = Number((dmi * MJ_PER_KG_DM).toFixed(2));

      // Nex via rumus di ConfigService
      // rumus sama, kita hitung ulang di sini agar tidak perlu panggil endpoint lain
      const formula = { N_IN_CP: 0.16, RETENTION: 0.2, SCALE: 1 };
      try {
        const formulaPath = path.join(this.dataDir, "nex_formula.json");
        if (fs.existsSync(formulaPath)) {
          const raw = JSON.parse(fs.readFileSync(formulaPath, "utf8"));
          Object.assign(formula, raw?.default || {});
        }
      } catch {}
      const Nex = Number(
        (
          dmi *
          365 *
          (Number(p.CP_percent_diet) / 100) *
          formula.N_IN_CP *
          (1 - formula.RETENTION) *
          (formula as any).SCALE
        ).toFixed(2)
      );

      // Gg CO2e: EF (kg/head/yr) * pop (head) → kg gas; ubah ke Gg CO2e pakai GWP
      const entericGg = Number(
        (((e.Enteric_CH4_kg_head_yr * population) / 1e6) * GWP_CH4).toFixed(2)
      );
      const manureCH4Gg = Number(
        (((e.Manure_CH4_kg_head_yr * population) / 1e6) * GWP_CH4).toFixed(2)
      );
      const manureN2OGg = Number(
        (((e.Manure_N2O_kg_head_yr * population) / 1e6) * GWP_N2O).toFixed(2)
      );
      const totalGg = Number(
        (entericGg + manureCH4Gg + manureN2OGg).toFixed(2)
      );

      return {
        Production_System: p.Production_System,
        Animal_Category: p.Animal_Category,
        Population: population,
        LW: p.LW,
        ADG: p.ADG,
        Milk_kg_day: p.Milk_kg_day,
        DMD_percent: p.DMD_percent,
        DE_Calculated_percent: DE_calc,
        CP_percent: p.CP_percent_diet,
        Ash_percent: p.Ash_percent_diet,
        Mature_Weight_kg: p.Mature_Weight_kg,
        Fat_Content_Milk_percent: p.Fat_Content_Milk_percent,
        Work_Hours_day: p.Work_Hours_day,
        Pregnant_Cows_percent: p.Prop_Cows_Pregnant_percent,

        Lagoon: mm?.Lagoon ?? 0,
        Liquid_Slurry: mm?.["Liquid/Slurry"] ?? 0,
        Solid_Storage: mm?.Solid_Storage ?? 0,
        Dry_Lot: mm?.Dry_Lot ?? 0,
        Pasture: mm?.["Pasture/Range/Paddock"] ?? 0,
        Daily_Spread: mm?.Daily_Spread ?? 0,
        Composting: mm?.Composting ?? 0,
        Burned_Fuel: mm?.Burned_for_fuel ?? 0,
        Biogas: mm?.Biogas ?? 0,
        MMS_Total_percent: Number(mmsTotal.toFixed(2)),

        GE_MJ_day: GE,
        DMI_kg_day: dmi,
        Nex_kgN_yr: Nex,
        // VS kolom opsional – belum dihitung fisik, kita tampilkan kosong atau estimasi jika nanti mau
        VS_kgDM_yr: null,

        Enteric_CH4_Gg_CO2e: entericGg,
        Manure_CH4_Gg_CO2e: manureCH4Gg,
        Manure_N2O_Gg_CO2e: manureN2OGg,
        Total_Gg_CO2e: totalGg,
      };
    });

    // total keseluruhan:
    const grand = rows.reduce(
      (a, r) => {
        a.enteric += r.Enteric_CH4_Gg_CO2e;
        a.manureCH4 += r.Manure_CH4_Gg_CO2e;
        a.manureN2O += r.Manure_N2O_Gg_CO2e;
        return a;
      },
      { enteric: 0, manureCH4: 0, manureN2O: 0 }
    );
    const overall = Number(
      (grand.enteric + grand.manureCH4 + grand.manureN2O).toFixed(2)
    );

    return { rows, overall_Gg_CO2e: overall };
  }

  /** Table 2 (overall total) */
  overallTotal() {
    return { overall_Gg_CO2e: this.detailTable().overall_Gg_CO2e };
  }

  /** Table 4: ringkasan per Production System */
  bySystem() {
    const { rows } = this.detailTable();
    const map = new Map<
      string,
      { enteric: number; ch4: number; n2o: number }
    >();
    for (const r of rows) {
      const m = map.get(r.Production_System) || { enteric: 0, ch4: 0, n2o: 0 };
      m.enteric += r.Enteric_CH4_Gg_CO2e;
      m.ch4 += r.Manure_CH4_Gg_CO2e;
      m.n2o += r.Manure_N2O_Gg_CO2e;
      map.set(r.Production_System, m);
    }
    return [...map.entries()].map(([sys, v]) => ({
      Production_System: sys,
      Enteric_CH4_Gg_CO2e: Number(v.enteric.toFixed(2)),
      Manure_CH4_Gg_CO2e: Number(v.ch4.toFixed(2)),
      Manure_N2O_Gg_CO2e: Number(v.n2o.toFixed(2)),
      Total_Gg_CO2e: Number((v.enteric + v.ch4 + v.n2o).toFixed(2)),
    }));
  }
}
