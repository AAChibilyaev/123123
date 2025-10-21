import fs from "node:fs/promises";
import yaml from "js-yaml";
import { XMLParser } from "fast-xml-parser";

export async function loadSpec(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  if (filePath.endsWith(".json")) return JSON.parse(content) as any;
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return yaml.load(content) as any;
  if (filePath.endsWith(".xml")) {
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(content) as any;
  }
  throw new Error("Unsupported spec format: " + filePath);
}
