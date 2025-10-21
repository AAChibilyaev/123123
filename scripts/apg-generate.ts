import path from "node:path";
import fs from "node:fs/promises";
import { loadSpec } from "./ingest";
import { ensureShadcnItem } from "./ensure";
import { emitPage } from "./codegen";

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
    const spec = await loadSpec(file);
    for (const block of spec.blocks ?? []) {
      if (block.use?.startsWith?.("@")) await ensureShadcnItem(block.use);
      const loadingFromProps = block?.props?.loading?.component as string | undefined;
      if (block.loading?.use?.startsWith?.("@")) await ensureShadcnItem(block.loading.use);
      if (loadingFromProps?.startsWith?.("@")) await ensureShadcnItem(loadingFromProps);
    }
    const out = await emitPage(spec as any);
    console.log(`Generated: ${path.relative(process.cwd(), out)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
