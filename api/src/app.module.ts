import { Module } from "@nestjs/common";
import { MasterModule } from "./master/master.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { ConfigModule } from "./config/config.module";
import { EmissionsModule } from "./emissions/emissions.module";
import { PetugasModule } from "./petugas/petugas.module";
import { VerifModule } from "./verif/verif.module";
import { ViewerModule } from "./viewer/viewer.module";
import { UsersModule } from "./users/users.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";

@Module({
  imports: [
    MasterModule,
    AuthModule,
    ConfigModule,
    EmissionsModule,
    PetugasModule,
    VerifModule,
    ViewerModule,
    UsersModule,
    SubmissionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
