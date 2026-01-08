import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private jwt: JwtService, private roles: string[] = []) {}
  canActivate(ctx: ExecutionContext) {
    const req: any = ctx.switchToHttp().getRequest();
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer "))
      throw new ForbiddenException("Missing token");
    const payload: any = this.jwt.verify(auth.split(" ")[1], {
      secret: process.env.JWT_SECRET || "devsecret",
    });
    if (this.roles.length && !this.roles.includes(payload.role))
      throw new ForbiddenException("Forbidden");
    // simpan ke req.user
    req.user = payload;
    return true;
  }
}
