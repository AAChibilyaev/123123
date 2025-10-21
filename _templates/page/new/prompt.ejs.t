<%
  const rawName = name.trim();
  const normalized = rawName
    .toLowerCase()
    .replace(/[^a-z0-9\/-]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
  const pageId = normalized || "page";
  const routePath = pageId === "home" ? "/" : `/${pageId}`;
  const i18nBase = pageId.replace(/\//g, ".").replace(/-+/g, ".");
  const lastSegment = pageId.split("/").pop() ?? pageId;
  const camelSegment = lastSegment.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
  const camelVar = camelSegment.replace(/^[A-Z]/, (c) => c.toLowerCase());
  const safeCamel = /^[a-zA-Z_]/.test(camelVar) && camelVar.length > 0 ? camelVar : `data${camelSegment}`;
  const dataVar = (safeCamel || "records") + "Rows";
  const supabaseTable = lastSegment.replace(/-+/g, "_");
%>
---
to: dsl-pages/<%= pageId %>.yaml
---
page: <%= pageId %>
route: <%= routePath %>
layout: default
seo:
  title: "@i18n.<%= i18nBase %>.title"
  description: "@i18n.<%= i18nBase %>.description"
imports:
  - "import type { Database } from \"@/lib/supabase/types\";"
api:
  - id: "<%= dataVar %>"
    use: "@api/supabase-query"
    props:
      table: "<%= supabaseTable %>"
      select: "*"
blocks:
  # Добавляйте любые UI блоки (shadcn/ui, originui, собственные компоненты и т.д.)
  - use: "@official/hero"
    props:
      title: "@i18n.<%= i18nBase %>.hero.title"
      subtitle: "@i18n.<%= i18nBase %>.hero.subtitle"
      cta:
        label: "@i18n.cta.getStarted"
        href: "/signup"
  # Пример использования данных из API-блока в UI-компоненте
  - use: "@shadcnblocks/data-table"
    props:
      columns: ["Name", "Status"]
      data: "@@RAW@@<%= dataVar %>@@"
localeScope: ["en", "ru"]
