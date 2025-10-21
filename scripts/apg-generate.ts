import path from "node:path";
import fs from "node:fs/promises";
import { PageSpec } from "@/schemas/page";
import { loadSpec } from "./ingest";
import { ensureShadcnItem } from "./ensure";
import { emitPage } from "./codegen";
import { collectComponentRefs } from "./spec-deps";

async function listSpecFiles(dir: string) {
  const entries = await fs.readdir(dir);
  return entries.filter((f) => /\.(json|ya?ml|xml)$/.test(f)).map((f) => path.join(dir, f));
}

async function main() {
  const specsPath = process.argv[2] ?? "dsl-pages";
  const files = await listSpecFiles(specsPath);
  if (files.length === 0) {
    console.error(`No spec files in ${specsPath}`);
    process.exit(1);
  }
  for (const file of files) {
    const raw = await loadSpec(file);
    const parsed = PageSpec.safeParse(raw);
    if (!parsed.success) {
      console.error(`Spec ${file} не прошёл валидацию:`);
      for (const issue of parsed.error.issues) {
        console.error(`- ${issue.path.join(".") || "root"}: ${issue.message}`);
      }
      process.exitCode = 1;
      continue;
    }
    const spec = parsed.data;
    const refs = collectComponentRefs(spec);
    for (const ref of refs) {
      await ensureShadcnItem(ref);
    }
    const out = await emitPage(spec);
    console.log(`Generated: ${path.relative(process.cwd(), out)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
