import { Module } from "@nestjs/common";
import { VerifController } from "./verif.controller";
import { JwtModule } from "@nestjs/jwt";
import { SubmissionsModule } from "../modules/submissions/submissions.module";

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || "devsecret" }),
    SubmissionsModule,
  ],
  controllers: [VerifController],
})
export class VerifModule {}
