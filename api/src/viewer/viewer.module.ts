import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ViewerController } from "./viewer.controller";

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || "devsecret" }),
  ],
  controllers: [ViewerController],
})
export class ViewerModule {}
