import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "../config/config.service";
import { PetugasService } from "./petugas.service";
import { BaselineInput, MitigationInput } from "./petugas.dto";

/** ====== TYPINGS LOKAL (match activity-data & payload yang kita pakai) ====== */
type Systems = "Ekstensif" | "Semi-Intensif" | "Intensif";
type DistroKey = "Weaning" | "Yearling" | "Adult male" | "Adult female";

type Distrib = Partial<Record<DistroKey, number>>;

type ActivityRow = {
  provinceCode: string;
  provinceName: string;
  mix: {
    ekstensif: number; // 0-100
    semi: number; // 0-100
    intensif: number; // 0-100
  };
  distro: {
    ekstensif: Distrib; // nilai 0-100
    semi: Distrib;
    intensif: Distrib;
  };
};

type SubmitBody = { total: number; province?: string };

/** Row populasi yang akan disimpan untuk provinsi */
type PopulationRow = {
  Production_System: Systems;
  Animal_Category: DistroKey;
  Population: number;
};

@Controller("petugas")
export class PetugasController {
  constructor(
    private readonly config: ConfigService,
    private readonly petugas: PetugasService,
    private readonly jwt: JwtService
  ) {}

  private decodeUser(auth?: string) {
    if (!auth?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    try {
      return this.jwt.verify(auth.split(" ")[1], {
        secret: process.env.JWT_SECRET || "devsecret",
      });
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  @Post("population")
  async submitPopulation(
    @Headers("authorization") auth: string | undefined,
    @Headers("x-province") headerProvince: string | undefined,
    @Body() body: SubmitBody
  ) {
    let user: any = null;
    try {
      user = auth ? this.decodeUser(auth) : null;
    } catch {
      // population endpoint masih boleh tanpa token (fallback ke body/header)
      user = null;
    }
    // Ambil provinsi dari (prioritas): token -> body.province -> header x-province
    const provinceName: string | undefined =
      (user?.province as string | undefined) ??
      body?.province ??
      headerProvince;

    if (!provinceName)
      throw new BadRequestException(
        "Province is missing. Provide it via token payload, request body { province }, atau header 'x-province'."
      );
    if (!body?.total || body.total <= 0)
      throw new BadRequestException("Total must be > 0");

    // 1) Ambil activity-data dan cari provinsi user (tiped supaya 'r' tidak unknown)
    const activity = (await this.config.getActivityData()) as ActivityRow[];
    const row = activity.find(
      (r: ActivityRow) =>
        r.provinceName?.toLowerCase() === provinceName.toLowerCase()
    );
    if (!row)
      throw new BadRequestException("Province not found in activity-data");

    // 2) Ambil mix & distro (%)
    const { mix, distro } = row;
    const total = Number(body.total);

    const systems: Systems[] = ["Ekstensif", "Semi-Intensif", "Intensif"];
    const mapKey = (ps: Systems) =>
      ps === "Ekstensif"
        ? "ekstensif"
        : ps === "Semi-Intensif"
        ? "semi"
        : "intensif";

    // 3) Hitung baris population
    const populationRows: PopulationRow[] = systems.flatMap((ps) => {
      const k = mapKey(ps) as "ekstensif" | "semi" | "intensif";
      const portionPs = (mix[k] ?? 0) / 100; // mix persen (0-100)
      const basePs = total * portionPs;

      const d = distro[k] || {};
      const W = (d["Weaning"] ?? 0) / 100;
      const Y = (d["Yearling"] ?? 0) / 100;
      const AM = (d["Adult male"] ?? 0) / 100;
      const AF = (d["Adult female"] ?? 0) / 100;

      return [
        {
          Production_System: ps,
          Animal_Category: "Weaning",
          Population: Math.round(basePs * W),
        },
        {
          Production_System: ps,
          Animal_Category: "Yearling",
          Population: Math.round(basePs * Y),
        },
        {
          Production_System: ps,
          Animal_Category: "Adult male",
          Population: Math.round(basePs * AM),
        },
        {
          Production_System: ps,
          Animal_Category: "Adult female",
          Population: Math.round(basePs * AF),
        },
      ];
    });

    // 4) Simpan hanya untuk provinsi ini
    // NOTE: pastikan ConfigService punya method ini dengan signature yang cocok.
    // Jika method belum ada, sementara bisa cast ke any agar compile jalan.
    const cs: any = this.config as any;
    if (typeof cs.setPopulationForProvince !== "function") {
      throw new BadRequestException(
        "setPopulationForProvince() belum diimplementasikan pada ConfigService."
      );
    }
    await cs.setPopulationForProvince(provinceName, populationRows);

    return {
      ok: true,
      province: provinceName,
      total,
      saved: populationRows.length,
    };
  }

  @Post("baseline")
  createBaseline(
    @Headers("authorization") auth: string | undefined,
    @Body() dto: BaselineInput
  ) {
    const user = this.decodeUser(auth);
    return this.petugas.createBaseline(user, dto);
  }

  @Post("mitigation")
  attachMitigation(
    @Headers("authorization") auth: string | undefined,
    @Body() dto: MitigationInput & { year: number; province: string }
  ) {
    const user = this.decodeUser(auth);
    return this.petugas.attachMitigation(user, dto);
  }

  @Get("results")
  getResults(
    @Headers("authorization") auth: string | undefined,
    @Query("province") province?: string,
    @Query("year") year?: string,
    @Query("id") id?: string
  ) {
    if (!province || !year || !id) {
      throw new BadRequestException("province, year, dan id wajib diisi");
    }
    const user = this.decodeUser(auth);
    return this.petugas.getResults(user, province, Number(year), id);
  }
}
