import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  Headers,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";

@Controller("auth")
export class AuthController {
  constructor(private svc: AuthService, private jwt: JwtService) {}

  @Post("login")
  login(@Body() dto: { email: string; password: string }) {
    return this.svc.login(dto.email, dto.password);
  }

  @Get("me")
  me(@Req() req: any, @Headers("authorization") auth?: string) {
    if (!auth || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing token");
    }
    const token = auth.split(" ")[1];
    const payload = this.jwt.verify(token, {
      secret: process.env.JWT_SECRET || "devsecret",
    });
    return this.svc.profile(payload);
  }
}
