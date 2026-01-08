import { Module } from "@nestjs/common";
import { EmissionsService } from "./emissions.service";
import { EmissionsController } from "./emissions.controller";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [ConfigModule],
  providers: [EmissionsService],
  controllers: [EmissionsController],
})
export class EmissionsModule {}
