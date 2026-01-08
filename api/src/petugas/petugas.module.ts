import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PetugasController } from "./petugas.controller";
import { ConfigModule } from "../config/config.module";
import { PetugasService } from "./petugas.service";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "devsecret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [PetugasController],
  providers: [PetugasService],
  exports: [PetugasService],
})
export class PetugasModule {}
