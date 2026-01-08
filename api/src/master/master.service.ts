import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class MasterService {
  private data: any[] = [];
  constructor() {
    const p = path.join(__dirname, "../data/master_data.json");
    const raw = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "[]";
    this.data = JSON.parse(raw);
  }
  all() {
    return this.data;
  }
  paged(page = 1, limit = 20) {
    const s = (page - 1) * limit;
    return { total: this.data.length, items: this.data.slice(s, s + limit) };
  }
}
