import type { ReactNode } from "react";
import clsx from "clsx";

type Cta = { label: ReactNode; href: string };

export type HeroVariant = "default" | "centered" | "split";

export type HeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: Cta | Cta[];
  variant?: HeroVariant;
  className?: string;
};

function renderCta(cta?: Cta | Cta[]) {
  if (!cta) return null;
  const items = Array.isArray(cta) ? cta : [cta];
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.href}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function Hero({ eyebrow, title, subtitle, cta, variant = "default", className }: HeroProps) {
  const container = clsx(
    "relative isolate overflow-hidden bg-white py-16 sm:py-24",
    variant === "centered" && "text-center",
    variant === "split" && "md:flex md:items-center md:justify-between md:text-left",
    className
  );

  return (
    <section className={container}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6">
        {eyebrow ? <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</span> : null}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="text-base text-gray-600 sm:text-lg">{subtitle}</p> : null}
        {renderCta(cta)}
      </div>
    </section>
  );
}
