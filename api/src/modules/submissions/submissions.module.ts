import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { MasterDataModule } from "../master/master.module";

@Module({
  imports: [
    MasterDataModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "devsecret",
    }),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
