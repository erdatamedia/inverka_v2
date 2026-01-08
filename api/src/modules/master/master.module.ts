import { Module } from "@nestjs/common";
import { MasterDataService } from "./master.service";
import { ConfigModule } from "../../config/config.module";

@Module({
  imports: [ConfigModule],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
