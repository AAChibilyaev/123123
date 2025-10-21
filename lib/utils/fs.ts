import fs from "node:fs/promises";
import path from "node:path";
export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}
export async function writeFileAtomic(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, "utf-8");
}
