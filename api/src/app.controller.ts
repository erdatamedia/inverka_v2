import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "inverka_v2-api",
      status: "ok",
      routes: [
        "GET /master",
        "POST /auth/login",
        "GET /auth/me",
        "GET /health",
      ],
    };
  }

  @Get("health")
  health() {
    return { status: "ok" };
  }
}
