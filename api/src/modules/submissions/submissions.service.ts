import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import * as fs from "fs";
import * as path from "path";
import { MasterDataService } from "../master/master.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { distributePopulation } from "../../calc/distribute";
import { calculateBaselineEmissions } from "../../calc/baseline";
import { applyMitigations } from "../../calc/mitigation";
import { buildSummary, SummaryResult } from "../../calc/summarize";

export type SubmissionStatus =
  | "menunggu_verifikasi"
  | "dalam_verifikasi"
  | "disetujui"
  | "ditolak";

export interface StoredSubmission {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  province: string;
  year: number;
  status: SubmissionStatus;
  payload: CreateSubmissionDto;
  result: SummaryResult;
  notes?: StatusNote[];
}

export interface StatusNote {
  status: SubmissionStatus;
  note: string;
  updatedAt: string;
  updatedBy?: string | null;
}

const dataDir = path.join(__dirname, "../../data/submissions");

const ensureDir = (target: string) => fs.mkdirSync(target, { recursive: true });

const provinceDir = (province: string, year: number) =>
  path.join(dataDir, province, String(year));

export interface SubmissionResponse {
  id: string;
  province: string;
  year: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  notes: StatusNote[];
  result: {
    summary: {
      baseline_GgCO2e: number;
      with_mitigation_GgCO2e: number;
      reduction_GgCO2e: number;
      reduction_percent: number;
    };
    by_gas_GgCO2e: SummaryResult["by_gas"];
    manure_detail_GgCO2e: {
      CH4: number;
      N2O_direct: number;
      N2O_indirect: number;
      total: number;
    };
    enteric_detail: {
      CH4_ton: number;
      CH4_CO2e_ton: number;
      CH4_GgCO2e: number;
    };
  };
}

@Injectable()
export class SubmissionsService {
  constructor(private readonly masterService: MasterDataService) {}

  private filePath(province: string, year: number, id: string) {
    return path.join(provinceDir(province, year), `${id}.json`);
  }

  private save(record: StoredSubmission) {
    const dir = provinceDir(record.province, record.year);
    ensureDir(dir);
    fs.writeFileSync(this.filePath(record.province, record.year, record.id), JSON.stringify(record, null, 2));
    return record;
  }

  private load(province: string, year: number, id: string): StoredSubmission {
    const file = this.filePath(province, year, id);
    return JSON.parse(fs.readFileSync(file, "utf8")) as StoredSubmission;
  }

  private listAll(year?: number, province?: string): StoredSubmission[] {
    if (!fs.existsSync(dataDir)) return [];
    const provinces = province ? [province] : fs.readdirSync(dataDir);
    const out: StoredSubmission[] = [];
    for (const prov of provinces) {
      const provPath = path.join(dataDir, prov);
      if (!fs.existsSync(provPath)) continue;
      const years = year != null ? [String(year)] : fs.readdirSync(provPath);
      for (const y of years) {
        const yearNum = Number(y);
        if (!Number.isFinite(yearNum)) continue;
        if (year != null && yearNum !== year) continue;
        const dir = path.join(provPath, y);
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
          if (!file.endsWith(".json")) continue;
          try {
            const record = JSON.parse(
              fs.readFileSync(path.join(dir, file), "utf8")
            ) as StoredSubmission;
            out.push(record);
          } catch {
            /* ignore malformed file */
          }
        }
      }
    }
    return out;
  }

  private toResponse(record: StoredSubmission): SubmissionResponse {
    const result: SubmissionResponse["result"] = {
      summary: {
        baseline_GgCO2e: record.result.summary.baseline / 1000,
        with_mitigation_GgCO2e: record.result.summary.mitigated / 1000,
        reduction_GgCO2e: record.result.summary.reduction / 1000,
        reduction_percent: record.result.summary.percent,
      },
      by_gas_GgCO2e: record.result.by_gas,
      manure_detail_GgCO2e: {
        CH4: record.result.manure.CH4 / 1000,
        N2O_direct: record.result.manure.N2O_dir / 1000,
        N2O_indirect: record.result.manure.N2O_ind / 1000,
        total: record.result.manure.total / 1000,
      },
      enteric_detail: {
        CH4_ton: record.result.enteric.CH4_ton,
        CH4_CO2e_ton: record.result.enteric.CH4_CO2e,
        CH4_GgCO2e: record.result.enteric.CH4_Gg,
      },
    };

    return {
      id: record.id,
      province: record.province,
      year: record.year,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      notes: record.notes ?? [],
      result,
    };
  }

  create(
    user: { role: string; province?: string; email?: string },
    dto: CreateSubmissionDto
  ): SubmissionResponse {
    const mitigations = dto.mitigations ?? [];

    const province = dto.region_id.toUpperCase();
    if (user.role === "petugas" && user.province?.toUpperCase() !== province) {
      throw new ForbiddenException("Petugas tidak boleh mengajukan untuk provinsi lain");
    }

    const shares = this.masterService.getDistributionShares();
    const factors = this.masterService.getBaselineFactors();
    const definitions = this.masterService.getMitigationDefinitions();

    const distribution = distributePopulation(dto.total_population, shares);
    const baseline = calculateBaselineEmissions(distribution, factors);
    const mitigated = applyMitigations(
      baseline,
      mitigations.map((m) => ({
        actionId: m.action_id,
        coverage: m.coverage,
      })),
      definitions,
      factors.gwpCH4
    );

    const summary = buildSummary(baseline, mitigated);

    const record: StoredSubmission = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.email ?? "petugas",
      province,
      year: dto.year,
      status: "menunggu_verifikasi",
      payload: dto,
      result: summary,
      notes: [],
    };

    this.save(record);

    return this.toResponse(record);
  }

  listForUser(
    user: { role: string; province?: string },
    year?: number
  ): SubmissionResponse[] {
    if (user.role === "petugas") {
      if (!user.province) return [];
      return this.listAll(year, user.province.toUpperCase()).map((r) =>
        this.toResponse(r)
      );
    }
    return this.listAll(year).map((r) => this.toResponse(r));
  }

  updateStatus(
    user: { role: string; email?: string },
    province: string,
    year: number,
    id: string,
    status: SubmissionStatus,
    note?: string
  ): SubmissionResponse {
    if (!["verifikator", "superadmin"].includes(user.role)) {
      throw new ForbiddenException("Hanya verifikator atau superadmin");
    }
    const record = this.load(province, year, id);
    const trimmedNote = note?.trim();
    if (
      ["disetujui", "ditolak"].includes(status) &&
      (!trimmedNote || trimmedNote.length === 0)
    ) {
      throw new BadRequestException("Catatan wajib diisi untuk status ini");
    }
    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (trimmedNote) {
      record.notes = record.notes ?? [];
      record.notes.push({
        status,
        note: trimmedNote,
        updatedAt: record.updatedAt,
        updatedBy: user.email ?? null,
      });
    }
    this.save(record);
    return this.toResponse(record);
  }

  listForVerifier(status?: SubmissionStatus): SubmissionResponse[] {
    const records = this.listAll();
    const filtered = status
      ? records.filter((record) => record.status === status)
      : records;
    return filtered.map((record) => this.toResponse(record));
  }

  getById(province: string, year: number, id: string): SubmissionResponse {
    const record = this.load(province.toUpperCase(), year, id);
    return this.toResponse(record);
  }

  deleteSubmission(
    user: { role: string },
    province: string,
    year: number,
    id: string
  ): SubmissionResponse {
    if (!["verifikator", "superadmin"].includes(user.role)) {
      throw new ForbiddenException("Hanya verifikator atau superadmin");
    }
    const normalizedProvince = province.toUpperCase();
    const file = this.filePath(normalizedProvince, year, id);
    if (!fs.existsSync(file)) {
      throw new NotFoundException("Pengajuan tidak ditemukan");
    }
    const existing = this.load(normalizedProvince, year, id);
    fs.unlinkSync(file);
    return this.toResponse(existing);
  }
}
