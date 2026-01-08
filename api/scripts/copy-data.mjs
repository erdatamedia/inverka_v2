import { cpSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "src/data");
const dest = resolve(root, "dist/data");

if (!existsSync(src)) {
  console.warn(`[copy-data] Skip: source folder not found at ${src}`);
  process.exit(0);
}

try {
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-data] Copied data assets to ${dest}`);
} catch (error) {
  console.error("[copy-data] Failed to copy data folder:", error);
  process.exitCode = 1;
}
