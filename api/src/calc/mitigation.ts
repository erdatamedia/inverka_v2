import { BaselineEmission } from "./baseline";

export type MitigationTarget = "enteric" | "manure";
export type MitigationType = "ef" | "emission";

export interface MitigationActionDefinition {
  id: string;
  target: MitigationTarget;
  type: MitigationType;
  rate: number; // fraction reduction (e.g. 0.12)
}

export interface MitigationInput {
  actionId: string;
  coverage: number; // 0-1
}

export interface MitigationResult extends BaselineEmission {
  reductionCO2eTon: number;
  reductionPercent: number;
}

export function applyMitigations(
  baseline: BaselineEmission,
  mitigations: MitigationInput[],
  definitions: Record<string, MitigationActionDefinition>,
  gwpCH4: number
): BaselineEmission {
  let entericCH4Ton = baseline.entericCH4Ton;
  let manureCH4Ton = baseline.manureCH4Ton;
  let manureN2ODirectCO2eTon = baseline.manureN2ODirectCO2eTon;
  let manureN2OIndirectCO2eTon = baseline.manureN2OIndirectCO2eTon;

  for (const mitigation of mitigations) {
    const def = definitions[mitigation.actionId];
    if (!def) continue;
    const coverage = clamp01(mitigation.coverage);
    const factor = 1 - def.rate * coverage;
    if (def.target === "enteric") {
      if (def.type === "ef") {
        entericCH4Ton = round2(entericCH4Ton * factor);
      } else {
        const entericCO2e = entericCH4Ton * gwpCH4;
        const mitigatedCO2e = entericCO2e * factor;
        entericCH4Ton = round2(mitigatedCO2e / gwpCH4);
      }
    } else if (def.target === "manure") {
      manureCH4Ton = round2(manureCH4Ton * factor);
      manureN2ODirectCO2eTon = round2(manureN2ODirectCO2eTon * factor);
      manureN2OIndirectCO2eTon = round2(manureN2OIndirectCO2eTon * factor);
    }
  }

  return {
    entericCH4Ton,
    entericCO2eTon: round2(entericCH4Ton * gwpCH4),
    manureCH4Ton,
    manureCH4CO2eTon: round2(manureCH4Ton * gwpCH4),
    manureN2ODirectCO2eTon,
    manureN2OIndirectCO2eTon,
  };
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const round2 = (value: number) => Math.round(value * 100) / 100;
