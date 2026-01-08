import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  SubmissionResponse,
  SubmissionStatus,
  SubmissionsService,
} from "../modules/submissions/submissions.service";

const STATUS_ALIAS: Record<string, SubmissionStatus> = {
  menunggu: "menunggu_verifikasi",
  menunggu_verifikasi: "menunggu_verifikasi",
  proses: "dalam_verifikasi",
  dalam_verifikasi: "dalam_verifikasi",
  terverifikasi: "disetujui",
  disetujui: "disetujui",
  ditolak: "ditolak",
};

function parseStatus(input?: string): SubmissionStatus | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase();
  const mapped = STATUS_ALIAS[normalized];
  if (!mapped) {
    throw new BadRequestException("Status tidak dikenal");
  }
  return mapped;
}

@Controller("verifikasi")
export class VerifController {
  constructor(
    private readonly jwt: JwtService,
    private readonly submissions: SubmissionsService
  ) {}

  private decodeUser(auth?: string) {
    if (!auth?.startsWith("Bearer ")) {
      throw new BadRequestException("Token diperlukan");
    }
    const payload: any = this.jwt.verify(auth.split(" ")[1], {
      secret: process.env.JWT_SECRET || "devsecret",
    });
    if (payload.role !== "verifikator" && payload.role !== "superadmin") {
      throw new BadRequestException("Hanya verifikator atau superadmin");
    }
    return payload;
  }

  @Get("queue")
  queue(
    @Headers("authorization") auth?: string,
    @Query("status") status?: string
  ): SubmissionResponse[] {
    this.decodeUser(auth);
    const filterStatus = parseStatus(status);
    return this.submissions.listForVerifier(filterStatus);
  }

  @Get("detail/:province/:year/:id")
  detail(
    @Headers("authorization") auth: string | undefined,
    @Param("province") province: string,
    @Param("year") year: string,
    @Param("id") id: string
  ): SubmissionResponse {
    this.decodeUser(auth);
    const yearNum = Number(year);
    if (!Number.isFinite(yearNum)) {
      throw new BadRequestException("Param year harus berupa angka");
    }
    return this.submissions.getById(province.toUpperCase(), yearNum, id);
  }

  @Patch("status/:id")
  updateStatus(
    @Headers("authorization") auth: string | undefined,
    @Param("id") id: string,
    @Body()
    body: {
      province: string;
      year: number;
      status: string;
      note?: string;
    }
  ): SubmissionResponse {
    const user = this.decodeUser(auth);
    if (!body?.province || !body?.year || !body?.status) {
      throw new BadRequestException(
        "Body harus berisi province, year, dan status"
      );
    }
    const status = parseStatus(body.status);
    if (!status) {
      throw new BadRequestException("Status tidak dikenal");
    }
    return this.submissions.updateStatus(
      user,
      body.province.toUpperCase(),
      Number(body.year),
      id,
      status,
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
  ): SubmissionResponse {
    const user = this.decodeUser(auth);
    if (!body?.province || body.year == null) {
      throw new BadRequestException("Body harus berisi province dan year");
    }
    return this.submissions.deleteSubmission(
      user,
      body.province,
      Number(body.year),
      id
    );
  }

  @Post("delete")
  deleteWithBody(
    @Headers("authorization") auth: string | undefined,
    @Body()
    body: {
      id: string;
      province: string;
      year: number;
    }
  ): SubmissionResponse {
    const user = this.decodeUser(auth);
    if (!body?.id || !body?.province || body?.year == null) {
      throw new BadRequestException("Body harus berisi id, province, dan year");
    }
    return this.submissions.deleteSubmission(
      user,
      body.province,
      Number(body.year),
      body.id
    );
  }
}
