// apps/api/src/petugas/petugas.dto.ts
export type Physiological = "Weaning" | "Yearling" | "Young" | "Mature";
export interface BaselineInput {
  year: number;
  province: string; // ISO code
  total_population: number;
  distribution: {
    Weaning: number;
    Yearling: number;
    Young: number;
    Mature: number;
  }; // wajib total = total_population
}
export interface MitigationInput {
  submissionId: string;
  activities: string[]; // daftar yang dipilih
  feedClass: {
    // alokasi populasi per kelas per fisiologis
    Weaning: { fc1: number; fc2: number; fc3: number; fc4: number };
    Yearling: { fc1: number; fc2: number; fc3: number; fc4: number };
    Young: { fc1: number; fc2: number; fc3: number; fc4: number };
    Mature: { fc1: number; fc2: number; fc3: number; fc4: number };
  };
  // optional komposisi pakan per kelas jika ingin disimpan
  feedNotes?: string;
}
