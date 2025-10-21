"use client";
import React from "react";
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/ui/hero";
import { DataTable } from "@/components/ui/data-table";

export const dynamic = "force-static";

export default async function Page() {
  const t = await getTranslations();
  return (
    <>
      <Hero {...{"title":{t("docs.hero.title")},"subtitle":{t("docs.hero.subtitle")},"cta":{"label":{t("cta.readDocs")},"href":"/docs/getting-started"}}} />
      <DataTable {...{"columns":["Name","Version","Status"],"dataKey":"packages"}} />
    </>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    "title": t("docs.overview.title"),
    "description": t("docs.overview.desc")
  };
}
