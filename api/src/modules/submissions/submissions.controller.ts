import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import {
  SubmissionStatus,
  SubmissionsService,
} from "./submissions.service";

@Controller("submissions")
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly jwt: JwtService
  ) {}

  private decodeUser(auth?: string) {
    if (!auth?.startsWith("Bearer ")) {
      throw new BadRequestException("Bearer token diperlukan");
    }
    try {
      return this.jwt.verify(auth.split(" ")[1], {
        secret: process.env.JWT_SECRET || "devsecret",
      });
    } catch {
      throw new BadRequestException("Token tidak valid");
    }
  }

  @Post()
  create(
    @Headers("authorization") auth: string | undefined,
    @Body() dto: CreateSubmissionDto
  ) {
    const user = this.decodeUser(auth);
    return this.submissionsService.create(user, dto);
  }

  @Get()
  list(
    @Headers("authorization") auth: string | undefined,
    @Query("year") year?: string
  ) {
    const user = this.decodeUser(auth);
    const yearNum = year ? Number(year) : undefined;
    if (year && !Number.isFinite(yearNum)) {
      throw new BadRequestException("Param year harus berupa angka");
    }
    return this.submissionsService.listForUser(user, yearNum);
  }

  @Patch(":id/status")
  updateStatus(
    @Headers("authorization") auth: string | undefined,
    @Param("id") id: string,
    @Body()
    body: {
      province: string;
      year: number;
      status: SubmissionStatus;
      note?: string;
    }
  ) {
    const user = this.decodeUser(auth);
    if (!body?.province || !body?.year || !body?.status) {
      throw new BadRequestException(
        "Body harus berisi province, year, dan status"
      );
    }
    return this.submissionsService.updateStatus(
      user,
      body.province,
      body.year,
      id,
      body.status,
      body.note
    );
  }

  @Delete(":id")
  remove(
    @Headers("authorization") auth: string | undefined,
    @Param("id") id: string,
    @Body()
    body: {
      province: string;
      year: number;
    }
  ) {
    const user = this.decodeUser(auth);
    if (!body?.province || body?.year == null) {
      throw new BadRequestException("Body harus berisi province dan year");
    }
    return this.submissionsService.deleteSubmission(
      user,
      body.province,
      body.year,
      id
    );
  }
}
