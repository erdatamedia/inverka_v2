import { Controller, Get, Query } from "@nestjs/common";
import { MasterService } from "./master.service";

@Controller("master")
export class MasterController {
  constructor(private readonly svc: MasterService) {}
  @Get()
  list(@Query("page") page?: string, @Query("limit") limit?: string) {
    return this.svc.paged(Number(page || 1), Number(limit || 20));
  }
}
