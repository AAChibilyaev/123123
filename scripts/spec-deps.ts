import type { TDSLBlock, TPageSpec } from "@/schemas/page";

function visitBlock(block: TDSLBlock, refs: Set<string>) {
  if (!block) return;
  if (typeof block.use === "string") {
    refs.add(block.use);
  }
  const loadingComponent = block.props?.loading;
  if (loadingComponent && typeof loadingComponent === "object") {
    const component = (loadingComponent as Record<string, unknown>).component;
    if (typeof component === "string") {
      refs.add(component);
    }
  }
  const loading = block.loading;
  if (loading && typeof loading.use === "string") {
    refs.add(loading.use);
  }
  const children = Array.isArray(block.children) ? block.children : [];
  for (const child of children) {
    if (child && typeof child === "object" && "use" in (child as Record<string, unknown>)) {
      visitBlock(child as TDSLBlock, refs);
    }
  }
}

export function collectComponentRefs(spec: Pick<TPageSpec, "blocks">): Set<string> {
  const refs = new Set<string>();
  for (const block of spec.blocks ?? []) {
    visitBlock(block, refs);
  }
  for (const ref of Array.from(refs)) {
    if (!ref.startsWith("@") || ref.startsWith("@api/")) {
      refs.delete(ref);
    }
  }
  return refs;
}
