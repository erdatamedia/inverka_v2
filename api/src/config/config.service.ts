import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

type PopulationRow = {
  Production_System: string; // Extensive | Semi-Intensive | Intensive
  Animal_Category: string; // Beef Cattle_Weaning | ... | Imported Cattle
  Population_Head: number;
};

type AnimalParamsRow = {
  Production_System: string;
  Animal_Category: string;
  LW: number;
  Mature_Weight_kg: number;
  ADG: number;
  Milk_kg_day: number;
  DMD_percent: number;
  CP_percent_diet: number;
  Ash_percent_diet: number;
  Fat_Content_Milk_percent: number;
  Work_Hours_day: number;
  Prop_Cows_Pregnant_percent: number;
  Ym_input: number;
};

type ManureMgmtRow = {
  Production_System: string;
  Animal_Category: string;
  Lagoon: number;
  "Liquid/Slurry": number;
  Solid_Storage: number;
  Dry_Lot: number;
  "Pasture/Range/Paddock": number;
  Daily_Spread: number;
  Composting: number;
  Burned_for_fuel: number;
  Biogas: number;
};

type MitigationRow = {
  category: string;
  factors: Record<string, Record<string, number>>;
};

@Injectable()
export class ConfigService {
  // Activity Data (JSON-backed)
  getActivityData(): unknown[] {
    return this.read<unknown>("activity-data.json");
  }

  setActivityData(rows: unknown[]): void {
    this.write("activity-data.json", rows as unknown[]);
  }
  private dataDir = path.join(__dirname, "../data");

  private read<T>(file: string): T[] {
    const p = path.join(this.dataDir, file);
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8");
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }
  private write<T>(file: string, rows: T[]) {
    const p = path.join(this.dataDir, file);
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(rows, null, 2));
  }

  // Population
  getPopulation(): PopulationRow[] {
    return this.read<PopulationRow>("population.json");
  }
  setPopulation(rows: PopulationRow[]) {
    this.write("population.json", rows);
  }

  // Animal parameters
  getAnimalParams(): AnimalParamsRow[] {
    return this.read<AnimalParamsRow>("animal_params.json");
  }
  setAnimalParams(rows: AnimalParamsRow[]) {
    this.write("animal_params.json", rows);
  }

  // Manure management
  getManureMgmt(): ManureMgmtRow[] {
    return this.read<ManureMgmtRow>("manure_mgmt.json");
  }
  setManureMgmt(rows: ManureMgmtRow[]) {
    // Validasi: total persentase harus 100 per baris (toleransi ±0.5)
    const sum = (r: ManureMgmtRow) =>
      r.Lagoon +
      r["Liquid/Slurry"] +
      r.Solid_Storage +
      r.Dry_Lot +
      r["Pasture/Range/Paddock"] +
      r.Daily_Spread +
      r.Composting +
      r.Burned_for_fuel +
      r.Biogas;

    const bad = rows.filter((r) => Math.abs(sum(r) - 100) > 0.5);
    if (bad.length) {
      throw new BadRequestException(
        "Manure distribution must sum to 100 per baris. Invalid rows: " +
          bad
            .map((b) => `${b.Production_System}|${b.Animal_Category}=${sum(b)}`)
            .join(", ")
      );
    }

    this.write("manure_mgmt.json", rows);
  }

  // Mitigation data
  getMitigationData(): MitigationRow[] {
    return this.read<MitigationRow>("mitigation-data.json");
  }
  setMitigationData(rows: MitigationRow[]) {
    this.write("mitigation-data.json", rows);
  }

  // ---- Nex formula helpers (JSON-backed) ----
  getNexFormula(): NexFormula {
    return readNexFormula(this.dataDir);
  }

  setNexFormula(patch: Partial<NexFormula>) {
    const current = readNexFormula(this.dataDir);
    const next: NexFormula = {
      N_IN_CP: Number(patch.N_IN_CP ?? current.N_IN_CP),
      RETENTION: Number(patch.RETENTION ?? current.RETENTION),
      SCALE: Number(patch.SCALE ?? current.SCALE),
    };
    const p = path.join(this.dataDir, "nex_formula.json");
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ default: next }, null, 2), "utf8");
  }

  /**
   * Flexible setter to support UAT:
   * - If payload is an object with Nex formula fields, update `nex_formula.json`.
   * - If payload is an array (manual rows), persist to `manure_nex_override.json` for debugging/inspection.
   */
  setManureNex(payload: unknown) {
    if (Array.isArray(payload)) {
      const p = path.join(this.dataDir, "manure_nex_override.json");
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(payload, null, 2), "utf8");
      return;
    }
    if (payload && typeof payload === "object") {
      const obj = payload as Partial<NexFormula>;
      const hasFormulaKey =
        "N_IN_CP" in obj || "RETENTION" in obj || "SCALE" in obj;
      if (hasFormulaKey) {
        this.setNexFormula(obj);
        return;
      }
    }
    // Fallback: do nothing if payload shape is not recognized
  }

  /**
   * Return calculated Nitrogen Excretion (Nex) table using DMI map + CP% from animal_params
   * Output columns: Production_System, Animal_Category, DMI_kg_day, CP_percent_diet, Nex_kgN_per_year
   * Rumus configurable dari apps/api/src/data/nex_formula.json:
   * { "default": { "N_IN_CP": 0.16, "RETENTION": 0.2, "SCALE": 1 } }
   */
  getManureNex(): ManureNexRow[] {
    const params = this.getAnimalParams(); // must include CP_percent_diet
    const formula = readNexFormula(this.dataDir);
    const DAYS = 365;

    return params
      .map((row: any) => {
        const key = `${row.Production_System}|${row.Animal_Category}`;
        const DMI = DMI_MAP[key];
        const CP = Number(row.CP_percent_diet);
        if (!DMI || isNaN(CP)) return null;

        const Nex =
          DMI *
          DAYS *
          (CP / 100) *
          formula.N_IN_CP *
          (1 - formula.RETENTION) *
          formula.SCALE;

        return {
          Production_System: row.Production_System,
          Animal_Category: row.Animal_Category,
          DMI_kg_day: Number(DMI.toFixed(2)),
          CP_percent_diet: Number(CP.toFixed(2)),
          Nex_kgN_per_year: Number(Nex.toFixed(2)),
        } as ManureNexRow;
      })
      .filter(Boolean) as ManureNexRow[];
  }
}

// ... import & type yang sudah ada di file-mu

type ManureNexRow = {
  Production_System: string;
  Animal_Category: string;
  DMI_kg_day: number;
  CP_percent_diet: number;
  Nex_kgN_per_year: number;
};

const DMI_MAP: Record<string, number> = {
  // key = `${Production_System}|${Animal_Category}`
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

type NexFormula = { N_IN_CP: number; RETENTION: number; SCALE: number };

function readNexFormula(dataDir: string): NexFormula {
  const p = path.join(dataDir, "nex_formula.json");
  if (!fs.existsSync(p)) return { N_IN_CP: 0.16, RETENTION: 0.2, SCALE: 1 };
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const def = raw?.default || {};
    return {
      N_IN_CP: Number(def.N_IN_CP ?? 0.16),
      RETENTION: Number(def.RETENTION ?? 0.2),
      SCALE: Number(def.SCALE ?? 1),
    };
  } catch {
    return { N_IN_CP: 0.16, RETENTION: 0.2, SCALE: 1 };
  }
}

export type {
  PopulationRow,
  AnimalParamsRow,
  ManureMgmtRow,
  ManureNexRow,
  NexFormula,
};
