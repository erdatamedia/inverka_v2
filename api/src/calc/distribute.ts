export type SubcategoryKey =
  | "weaning"
  | "yearling"
  | "young"
  | "adult_male"
  | "adult_female"
  | "imported";

export type ProductionSystemKey = "extensive" | "semi_intensive" | "intensive";

export type DistributionResult = Record<
  SubcategoryKey,
  Record<ProductionSystemKey, number>
>;

export interface DistributionShares {
  subcategories: Record<SubcategoryKey, number>;
  systems: Record<ProductionSystemKey, number>;
}

export function distributePopulation(
  totalPopulation: number,
  shares: DistributionShares
): DistributionResult {
  const result = {} as DistributionResult;
  for (const subKey of Object.keys(shares.subcategories) as SubcategoryKey[]) {
    result[subKey] = {} as Record<ProductionSystemKey, number>;
    const subShare = shares.subcategories[subKey] ?? 0;
    for (const sysKey of Object.keys(
      shares.systems
    ) as ProductionSystemKey[]) {
      const sysShare = shares.systems[sysKey] ?? 0;
      result[subKey][sysKey] = totalPopulation * subShare * sysShare;
    }
  }
  return result;
}
