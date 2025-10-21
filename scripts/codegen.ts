import path from "node:path";
import type { TPageSpec, TDSLBlock, TAPIBlock } from "@/schemas/page";
import { writeFileAtomic, ensureDir } from "@/lib/utils/fs";
import { resolveImport } from "./registry-map";

type RenderUnit = { imports: string[]; body: string; client?: boolean; hoisted?: string[] };
type RenderBundle = {
  imports: string[];
  extraImports: string[];
  body: string[];
  apiStatements: string[];
  hoisted: string[];
  clientNeeded: boolean;
  metadata: Record<string, unknown>;
  dynamic?: "force-static" | "force-dynamic" | "auto";
};

type RenderState = {
  counters: Record<string, number>;
};

function serializeProps(obj: any): string {
  return JSON.stringify(obj, null, 0)
    .replace(/"@i18n\.([^"]+)"/g, (_m, key) => `{t("${key}")}`)
    .replace(/"@@RAW@@([^"]+)@@"/g, (_m, raw) => raw);
}

function propsExpression(props: Record<string, any>) {
  return serializeProps(props)
    .replace(/:"\{(.+?)\}"/g, (_m, expr) => `:${expr}`)
    .replace(/"(\{t\(.+?\)\})"/g, (_m, inner) => inner);
}

function indentLines(text: string, spaces: number) {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.length > 0 ? pad + line : line))
    .join("\n");
}

function toIdentifierBase(symbol: string) {
  const sanitized = symbol.replace(/[^a-zA-Z0-9]/g, "");
  if (!sanitized) return "block";
  return sanitized.replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function nextVarName(state: RenderState, symbol: string, suffix: string) {
  const base = `${toIdentifierBase(symbol)}${suffix}`;
  const count = (state.counters[base] ?? 0) + 1;
  state.counters[base] = count;
  return count === 1 ? base : `${base}${count}`;
}

function splitPropsAndLoading(props?: Record<string, any>) {
  if (!props) return { cleanedProps: {}, loading: undefined as undefined | { use: string; props: Record<string, any> } };
  const candidate = props.loading;
  if (candidate && typeof candidate === "object" && "component" in candidate) {
    const { component, ...restLoading } = candidate as Record<string, any> & { component: string };
    const { loading: _ignored, ...rest } = props;
    return {
      cleanedProps: rest,
      loading: { use: component, props: restLoading }
    };
  }
  return { cleanedProps: props, loading: undefined };
}

function renderChildren(children: unknown[], state: RenderState): RenderUnit[] {
  return children
    .map((child) => {
      if (child && typeof child === "object" && "use" in (child as any)) {
        return renderBlock(child as TDSLBlock, state);
      }
      if (typeof child === "string") {
        if (child.startsWith("@i18n.")) {
          return { imports: [], body: `{t("${child.slice(6)}")}` };
        }
        return { imports: [], body: JSON.stringify(child) };
      }
      if (child == null) return undefined;
      return { imports: [], body: `{${JSON.stringify(child)}}` };
    })
    .filter(Boolean) as RenderUnit[];
}

function renderBlock(block: TDSLBlock, state: RenderState): RenderUnit {
  const info = resolveImport(block.use);
  const { cleanedProps, loading: loadingFromProps } = splitPropsAndLoading(block.props ?? {});
  const props = propsExpression(cleanedProps ?? {});
  const variantAttr = block.variant ? ` variant="${block.variant}"` : "";
  const animationAttr = block.animation ? ` data-animation="${block.animation}"` : "";
  const imports = [info.import];
  const hoisted: string[] = [];
  let spread = "";
  if (props !== "{}") {
    const varName = nextVarName(state, info.symbol, "Props");
    hoisted.push(`const ${varName} = ${props};`);
    spread = ` {...${varName}}`;
  }
  const childrenUnits = renderChildren(block.children ?? [], state);
  const allImports = [...imports, ...childrenUnits.flatMap((child) => child.imports)];
  const allHoisted = [...childrenUnits.flatMap((child) => child.hoisted ?? []), ...hoisted];

  const combinedChildrenBody = childrenUnits
    .map((child) => indentLines(child.body, 2))
    .join("\n");

  const openTag = `<${info.symbol}${variantAttr}${animationAttr}${spread}>`;
  const selfClosing = `<${info.symbol}${variantAttr}${animationAttr}${spread} />`;
  const closeTag = `</${info.symbol}>`;
  const blockWithChildren = combinedChildrenBody ? `${openTag}\n${combinedChildrenBody}\n${closeTag}` : selfClosing;

  const loading = block.loading ?? loadingFromProps;
  if (loading) {
    const linfo = resolveImport(loading.use);
    const loadingProps = propsExpression(loading.props ?? {});
    let loadingSpread = "";
    if (loadingProps !== "{}") {
      const loadingVar = nextVarName(state, linfo.symbol, "LoadingProps");
      allHoisted.push(`const ${loadingVar} = ${loadingProps};`);
      loadingSpread = ` {...${loadingVar}}`;
    }
    const fallback = `<${linfo.symbol}${loadingSpread} />`;
    allImports.push(linfo.import);
    const paddedFallback = indentLines(fallback, 2);
    const inner = combinedChildrenBody ? `${combinedChildrenBody}\n${paddedFallback}` : paddedFallback;
    const blockBody = `${openTag}\n${inner}\n${closeTag}`;
    const body = `{/* with loading fallback */}\n${blockBody}`;
    return { imports: Array.from(new Set(allImports)), body, client: info.client || linfo.client, hoisted: allHoisted };
  }

  return { imports: Array.from(new Set(allImports)), body: blockWithChildren, client: info.client, hoisted: allHoisted };
}

function renderApi(block: TAPIBlock): RenderUnit {
  const info = resolveImport(block.use);
  const props = propsExpression(block.props ?? {});
  const callArgs = props === "{}" ? "" : props;
  const awaited = block.await === false ? "" : "await ";
  const invocation = callArgs ? `${info.symbol}(${callArgs})` : `${info.symbol}()`;
  const body = `const ${block.id} = ${awaited}${invocation};`;
  return { imports: [info.import], body };
}

function toBundle(spec: TPageSpec): RenderBundle {
  const state: RenderState = { counters: {} };
  const units = spec.blocks.map((block) => renderBlock(block, state));
  const apiUnits = (spec.api ?? []).map(renderApi);
  const imports = Array.from(new Set([...units, ...apiUnits].flatMap((u) => u.imports))).filter(Boolean);
  const body = units.map((u) => u.body);
  const apiStatements = apiUnits.map((u) => u.body);
  const hoisted = units.flatMap((u) => u.hoisted ?? []);
  const clientNeeded = units.some((u) => u.client);
  const metadata: Record<string, unknown> = {};
  if (spec.seo?.title) metadata["title"] = spec.seo.title;
  if (spec.seo?.description) metadata["description"] = spec.seo.description;
  const dynamic = spec.ppr?.dynamic;
  const extraImports = Array.from(new Set(spec.imports ?? []));
  return { imports, extraImports, body, apiStatements, hoisted, clientNeeded, metadata, dynamic };
}

function pageTemplate(bundle: RenderBundle) {
  const head = [
    ...(bundle.clientNeeded ? [`"use client";`] : []),
    `import React from "react";`,
    `import { getTranslations } from "next-intl/server";`,
    ...bundle.extraImports,
    ...bundle.imports
  ].join("\n");
  const dynamicLine = `export const dynamic = "${bundle.dynamic ?? "force-static"}";`;
  const rawMetadata = JSON.stringify(bundle.metadata, null, 2).replace(
    /"@i18n\.([^\"]+)"/g,
    (_m, key) => `t("${key}")`
  );
  const metadataObject = rawMetadata
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");
  const preludeLines = [
    "const t = await getTranslations();",
    ...bundle.apiStatements,
    ...bundle.hoisted
  ];
  const prelude = preludeLines
    .map((line) => indentLines(line, 2))
    .join("\n");
  const preludeSection = prelude ? `${prelude}\n\n` : "";
  return `
${head}

${dynamicLine}

export default async function Page() {
${preludeSection}  return (
    <>
${bundle.body.map((b) => indentLines(b, 6)).join("\n")}
    </>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return ${metadataObject};
}
`.trim();
}

function routeToSegments(route: string): string[] {
  const clean = route.replace(/^\/+/, "");
  if (clean === "") return [];
  return clean.split("/");
}

function layoutGroupSegment(layout?: string) {
  if (!layout || layout === "default") return [] as string[];
  return [`(${layout})`];
}

export async function emitPage(spec: TPageSpec) {
  const segments = routeToSegments(spec.route);
  const layoutSegments = layoutGroupSegment(spec.layout);
  const outDir = path.join("app", "[locale]", ...layoutSegments, ...segments);
  await ensureDir(outDir);
  const file = path.join(outDir, "page.tsx");
  const content = pageTemplate(toBundle(spec));
  await writeFileAtomic(file, content);
  return file;
}
