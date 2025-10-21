import { execa } from "execa";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";

/**
 * Ensure registry item exists via shadcn CLI (multi-registry).
 * Fallback: generate with v0 if not found (requires V0_API_KEY).
 */
export async function ensureShadcnItem(item: string) {
  const [nsRaw, nameRaw] = item.split("/");
  const ns = nsRaw.replace("@", "");
  const name = (nameRaw ?? ns).replace("@", "");
  const componentPath = path.join("components", "ui", name);
  if (!existsSync(componentPath)) {
    try {
      await execa("npx", ["shadcn@latest", "search", `@${ns}`, "-q", name], { stdio: "inherit" });
      await execa("npx", ["shadcn@latest", "view", item], { stdio: "inherit" });
      await execa("npx", ["shadcn@latest", "add", item], { stdio: "inherit" });
    } catch {
      const apiKey = process.env.V0_API_KEY;
      if (!apiKey) throw new Error(`Missing V0_API_KEY and shadcn add failed for ${item}`);
      const resp = await axios.post(
        "https://v0.vercel.com/api/generate",
        {
          prompt: `Generate a shadcn/ui-compatible ${name} React component (TypeScript + Tailwind + Radix primitives), export named ${name}.`,
          framework: "nextjs"
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const code: string = resp.data?.code ?? `export const ${name} = () => null;`;
      const genPath = path.join(componentPath, "index.tsx");
      await fs.mkdir(path.dirname(genPath), { recursive: true });
      await fs.writeFile(genPath, code, "utf-8");
    }
  }
}
