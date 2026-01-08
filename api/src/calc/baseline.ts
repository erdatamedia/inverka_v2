import {
  DistributionResult,
  ProductionSystemKey,
  SubcategoryKey,
} from "./distribute";

export interface BaselineFactors {
  entericEF: Record<string, number>; // kg CH4 / head / year
  manureCH4EF: Record<string, number>; // kg CH4 / head / year
  manureN2ODirectEF: Record<string, number>; // kg N2O / head / year
  manureN2OIndirectEF: Record<string, number>; // kg N2O / head / year
  gwpCH4: number;
  gwpN2O: number;
  n2oToCO2e: number; // factor 44/28
}

export interface BaselineEmission {
  entericCH4Ton: number;
  entericCO2eTon: number;
  manureCH4Ton: number;
  manureCH4CO2eTon: number;
  manureN2ODirectCO2eTon: number;
  manureN2OIndirectCO2eTon: number;
}

export function calculateBaselineEmissions(
  distribution: DistributionResult,
  factors: BaselineFactors
): BaselineEmission {
  let entericCH4Ton = 0;
  let manureCH4Ton = 0;
  let manureN2ODirectCO2eTon = 0;
  let manureN2OIndirectCO2eTon = 0;

  for (const subKey of Object.keys(distribution) as SubcategoryKey[]) {
    const entericEF = factors.entericEF[subKey] ?? 0;
    const manureCH4EF = factors.manureCH4EF[subKey] ?? 0;
    const n2oDirEF = factors.manureN2ODirectEF[subKey] ?? 0;
    const n2oIndEF = factors.manureN2OIndirectEF[subKey] ?? 0;

    for (const sysKey of Object.keys(
      distribution[subKey]
    ) as ProductionSystemKey[]) {
      const headCount = distribution[subKey][sysKey];
      const entericCH4kg = headCount * entericEF;
      const manureCH4kg = headCount * manureCH4EF;
      const n2oDirKg = headCount * n2oDirEF;
      const n2oIndKg = headCount * n2oIndEF;

      entericCH4Ton += entericCH4kg / 1000;
      manureCH4Ton += manureCH4kg / 1000;

      manureN2ODirectCO2eTon +=
        (n2oDirKg * factors.n2oToCO2e * factors.gwpN2O) / 1000;
      manureN2OIndirectCO2eTon +=
        (n2oIndKg * factors.n2oToCO2e * factors.gwpN2O) / 1000;
    }
  }

  const entericCO2eTon = entericCH4Ton * factors.gwpCH4;
  const manureCH4CO2eTon = manureCH4Ton * factors.gwpCH4;

  return {
    entericCH4Ton: round2(entericCH4Ton),
    entericCO2eTon: round2(entericCO2eTon),
    manureCH4Ton: round2(manureCH4Ton),
    manureCH4CO2eTon: round2(manureCH4CO2eTon),
    manureN2ODirectCO2eTon: round2(manureN2ODirectCO2eTon),
    manureN2OIndirectCO2eTon: round2(manureN2OIndirectCO2eTon),
  };
}

const round2 = (value: number) => Math.round(value * 100) / 100;
