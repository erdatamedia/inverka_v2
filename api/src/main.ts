import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  app.enableCors({ origin: true, credentials: true });
  await app.listen(process.env.PORT || 8000);
  console.log(`API ready on http://localhost:${process.env.PORT || 8000}`);
}
bootstrap();
