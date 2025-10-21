import fg from "fast-glob";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { execa } from "execa";

function collectI18nKeys(obj: any, acc = new Set<string>()) {
  if (obj == null) return acc;
  if (typeof obj === "string" && obj.startsWith("@i18n.")) {
    acc.add(obj.slice(6));
    return acc;
  }
  if (Array.isArray(obj)) for (const v of obj) collectI18nKeys(v, acc);
  else if (typeof obj === "object") for (const v of Object.values(obj)) collectI18nKeys(v, acc);
  return acc;
}

async function loadSpec(file: string) {
  const raw = await fs.readFile(file, "utf-8");
  if (file.endsWith(".json")) return JSON.parse(raw);
  if (file.endsWith(".yaml") || file.endsWith(".yml")) return yaml.load(raw) as any;
  if (file.endsWith(".xml")) return {};
  return {};
}

async function ensureLocaleKeys(localeFile: string, keys: string[]) {
  const data = existsSync(localeFile) ? JSON.parse(await fs.readFile(localeFile, "utf-8")) : {};
  for (const key of keys) {
    const parts = key.split(".");
    let cur: any = data;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) {
        if (!(p in cur)) cur[p] = "__MISSING__";
      } else {
        if (!(p in cur)) cur[p] = {};
        cur = cur[p];
      }
    }
  }
  await fs.writeFile(localeFile, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  const dir = process.argv[2] ?? "dsl-pages";
  const files = await fg([`${dir}/*.{yaml,yml,json,xml}`]);
  const keys = new Set<string>();
  for (const file of files) {
    const spec = await loadSpec(file);
    collectI18nKeys(spec, keys);
  }
  const allKeys = Array.from(keys).sort();
  await fs.mkdir("locales", { recursive: true });
  await ensureLocaleKeys("locales/en.json", allKeys);
  await ensureLocaleKeys("locales/ru.json", allKeys);
  try {
    await execa("npx", ["i18nexus", "sync", "--ai-engine", "openai-o1"], { stdio: "inherit" });
  } catch {}
  console.log(`i18n-extract: ensured ${allKeys.length} keys`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
