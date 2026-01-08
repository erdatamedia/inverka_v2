import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "./config.service";
import { ConfigController } from "./config.controller";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev-secret",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  providers: [ConfigService],
  controllers: [ConfigController],
  exports: [ConfigService, JwtModule], // ekspor bila dipakai modul lain
})
export class ConfigModule {}
