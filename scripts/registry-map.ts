import { pascalCase } from "@/lib/utils/pascalCase";

export type ImportMap = { import: string; symbol: string; client?: boolean };

const REGISTRY: Record<string, ImportMap> = {
  "@official/hero": { import: `import { Hero } from "@/components/ui/hero";`, symbol: "Hero" },
  "@official/spinner": { import: `import { Spinner } from "@/components/ui/spinner";`, symbol: "Spinner", client: true },
  "@official/button-group": { import: `import { ButtonGroup } from "@/components/ui/button-group";`, symbol: "ButtonGroup", client: true },
  "@originui/feature-list": { import: `import { FeatureList } from "@/components/ui/feature-list";`, symbol: "FeatureList" },
  "@shadcnblocks/data-table": { import: `import { DataTable } from "@/components/ui/data-table";`, symbol: "DataTable", client: true }
};

export function resolveImport(item: string): ImportMap {
  if (REGISTRY[item]) return REGISTRY[item]!;
  const id = item.split("/").pop()!.replace("@", "");
  const symbol = pascalCase(id);
  return { import: `import { ${symbol} } from "@/components/ui/${id}";`, symbol, client: false };
}
