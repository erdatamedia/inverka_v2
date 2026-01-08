import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { seedUsers } from "./users.seed";

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}
  login(email: string, password: string) {
    const u = seedUsers.find(
      (x) => x.email === email && x.password === password
    );
    if (!u) throw new UnauthorizedException("Invalid credentials");

    const payload: any = {
      sub: u.id,
      role: u.role,
      email: u.email,
    };
    if ((u as any).province) payload.province = (u as any).province;

    const access_token = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET || "devsecret",
    });

    return {
      access_token,
      role: u.role,
      email: u.email,
      province: (u as any).province ?? null,
    };
  }
  profile(payload: any) {
    return seedUsers.find((u) => u.id === payload.sub);
  }
}
