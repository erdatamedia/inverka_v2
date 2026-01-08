import { Injectable } from "@nestjs/common";
import {
  DistributionShares,
  SubcategoryKey,
} from "../../calc/distribute";
import { BaselineFactors } from "../../calc/baseline";
import { MitigationActionDefinition } from "../../calc/mitigation";
import { ConfigService } from "../../config/config.service";

type MitigationConfigRow = {
  category?: string;
  factors?: Record<string, Record<string, number>>;
};

const FALLBACK_DEFINITIONS: Record<string, MitigationActionDefinition> = {
  "diet-quality": {
    id: "diet-quality",
    target: "enteric",
    type: "ef",
    rate: 0.12,
  },
  "anaerobic-digester": {
    id: "anaerobic-digester",
    target: "manure",
    type: "emission",
    rate: 0.5,
  },
  "solid-separation": {
    id: "solid-separation",
    target: "manure",
    type: "emission",
    rate: 0.2,
  },
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

@Injectable()
export class MasterDataService {
  constructor(private readonly config: ConfigService) {}

  getDistributionShares(): DistributionShares {
    return {
      subcategories: {
        weaning: 0.18,
        yearling: 0.2,
        young: 0.24,
        adult_male: 0.12,
        adult_female: 0.22,
        imported: 0.04,
      },
      systems: {
        extensive: 0.25,
        semi_intensive: 0.45,
        intensive: 0.3,
      },
    };
  }

  getBaselineFactors(): BaselineFactors {
    return {
      entericEF: this.toRecord({
        weaning: 3.82,
        yearling: 4.77,
        young: 7.67,
        adult_male: 21.87,
        adult_female: 18.5,
        imported: 20.1,
      }),
      manureCH4EF: this.toRecord({
        weaning: 2.4,
        yearling: 3.1,
        young: 3.6,
        adult_male: 5.2,
        adult_female: 4.8,
        imported: 4.5,
      }),
      manureN2ODirectEF: this.toRecord({
        weaning: 0.08,
        yearling: 0.09,
        young: 0.1,
        adult_male: 0.11,
        adult_female: 0.11,
        imported: 0.1,
      }),
      manureN2OIndirectEF: this.toRecord({
        weaning: 0.03,
        yearling: 0.035,
        young: 0.036,
        adult_male: 0.04,
        adult_female: 0.04,
        imported: 0.038,
      }),
      gwpCH4: 28,
      gwpN2O: 265,
      n2oToCO2e: 44 / 28,
    };
  }

  getMitigationDefinitions(): Record<string, MitigationActionDefinition> {
    const rows = this.config.getMitigationData() as MitigationConfigRow[];
    const dynamic = this.fromMitigationConfig(rows);
    return { ...FALLBACK_DEFINITIONS, ...dynamic };
  }

  private fromMitigationConfig(
    rows: MitigationConfigRow[]
  ): Record<string, MitigationActionDefinition> {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {};
    }

    const definitions: Record<string, MitigationActionDefinition> = {};

    for (const row of rows) {
      if (!row || !row.category) continue;
      const factors = row.factors ?? {};
      for (const [feed, actions] of Object.entries(factors)) {
        if (!actions) continue;
        for (const [actionName, rawValue] of Object.entries(actions)) {
          const numeric = Number(rawValue);
          if (!Number.isFinite(numeric)) continue;
          const rate = clamp01(1 - numeric);
          const id = `mitigation-${slugify(row.category)}-${slugify(feed)}-${slugify(actionName)}`;
          definitions[id] = {
            id,
            target: "enteric",
            type: "ef",
            rate,
          };
        }
      }
    }

    return definitions;
  }

  private toRecord(values: Record<SubcategoryKey, number>) {
    return values as Record<SubcategoryKey, number>;
  }
}
