import {
  Body,
  Controller,
  Get,
  Headers,
  Put,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "./config.service";
import { JwtService } from "@nestjs/jwt";

@Controller("config")
export class ConfigController {
  constructor(private cfg: ConfigService, private jwt: JwtService) {}

  // === Population ===
  @Get("population")
  getPopulation() {
    return this.cfg.getPopulation();
  }

  @Put("population")
  setPopulation(@Body() rows: any[], @Headers("authorization") auth?: string) {
    this.ensureSuperadmin(auth);
    this.cfg.setPopulation(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  // === Animal Parameters ===
  @Get("animal-params")
  getAnimalParams() {
    return this.cfg.getAnimalParams();
  }

  @Put("animal-params")
  setAnimalParams(
    @Body() rows: any[],
    @Headers("authorization") auth?: string
  ) {
    this.ensureSuperadmin(auth);
    this.cfg.setAnimalParams(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  // === Manure Management ===
  @Get("manure-mgmt")
  getManureMgmt() {
    return this.cfg.getManureMgmt();
  }

  @Put("manure-mgmt")
  setManureMgmt(@Body() rows: any[], @Headers("authorization") auth?: string) {
    this.ensureSuperadmin(auth);
    this.cfg.setManureMgmt(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  @Get("manure-nex")
  getManureNex() {
    return this.cfg.getManureNex();
  }

  @Put("manure-nex")
  setManureNex(@Body() rows: any[], @Headers("authorization") auth?: string) {
    this.ensureSuperadmin(auth);
    this.cfg.setManureNex(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  // === Activity Data ===
  @Get("activity-data")
  getActivityData() {
    return this.cfg.getActivityData();
  }

  @Put("activity-data")
  setActivityData(
    @Body() rows: any[],
    @Headers("authorization") auth?: string
  ) {
    this.ensureSuperadmin(auth);
    this.cfg.setActivityData(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  // === Mitigation Data ===
  @Get("mitigation-data")
  getMitigationData() {
    return this.cfg.getMitigationData();
  }

  @Put("mitigation-data")
  setMitigationData(
    @Body() rows: any[],
    @Headers("authorization") auth?: string
  ) {
    this.ensureSuperadmin(auth);
    this.cfg.setMitigationData(rows);
    return { ok: true, count: rows?.length || 0 };
  }

  // --- helper ---
  private ensureSuperadmin(auth?: string) {
    if (!auth?.startsWith("Bearer "))
      throw new UnauthorizedException("Missing token");
    const token = auth.split(" ")[1];
    const p = this.jwt.verify(token, {
      secret: process.env.JWT_SECRET || "devsecret",
    });
    if (p.role !== "superadmin")
      throw new ForbiddenException("Superadmin only");
  }
}
