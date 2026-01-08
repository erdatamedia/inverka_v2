import { Controller, Get } from "@nestjs/common";
import { EmissionsService } from "./emissions.service";

@Controller("emissions")
export class EmissionsController {
  constructor(private svc: EmissionsService) {}

  // Tabel 1
  @Get("ef")
  ef() {
    return this.svc.efTable();
  }

  // Tabel 3 (detail)
  @Get("detail")
  detail() {
    return this.svc.detailTable();
  }

  // Tabel 2 (overall)
  @Get("summary")
  summary() {
    return this.svc.overallTotal();
  }

  // Tabel 4 (by system)
  @Get("by-system")
  bySystem() {
    return this.svc.bySystem();
  }
}
