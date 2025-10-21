"use client";
import React from "react";
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/ui/hero";
import { Spinner } from "@/components/ui/spinner";
import { FeatureList } from "@/components/ui/feature-list";
import { DataTable } from "@/components/ui/data-table";
import { ButtonGroup } from "@/components/ui/button-group";

export const dynamic = "force-static";

export default async function Page() {
  const t = await getTranslations();
  const heroProps = {
    eyebrow: t("home.hero.eyebrow"),
    title: t("home.hero.title"),
    subtitle: t("home.hero.subtitle"),
    cta: { label: t("cta.getStarted"), href: "/signup" }
  };
  const spinnerLoadingProps = { size: "md" };
  const featureListProps = {
    items: [
      {
        icon: "bolt",
        title: t("features.fast"),
        desc: t("features.fast_desc"),
        ai_prompt: "Translate casually for tech audience using OpenAI o1-preview"
      },
      { icon: "shield", title: t("features.secure"), desc: t("features.secure_desc") }
    ]
  };
  const dataTableProps = { columns: ["Name", "Version", "Status"], dataKey: "packages" };
  const buttonGroupProps = {
    buttons: [
      { label: t("actions.save"), variant: "default" },
      { label: t("actions.cancel"), variant: "outline" }
    ]
  };
  return (
    <>
      {/* with loading fallback */}
      <Hero variant="centered" {...heroProps}>
        <Spinner {...spinnerLoadingProps} />
      </Hero>
      <FeatureList {...featureListProps} />
      <DataTable {...dataTableProps} />
      <ButtonGroup {...buttonGroupProps} />
    </>
  );
}

export async function generateMetadata() {
  const t = await getTranslations();
  return {
    "title": t("home.seo.title"),
    "description": t("home.seo.desc")
  };
}
