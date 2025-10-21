import type { ReactNode } from "react";
import clsx from "clsx";

type FeatureItem = {
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
};

export type FeatureListProps = {
  items: FeatureItem[];
  className?: string;
  columns?: 1 | 2 | 3;
};

export function FeatureList({ items, className, columns = 2 }: FeatureListProps) {
  const columnClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  }[columns];

  return (
    <div className={clsx("grid gap-8", columnClass, className)}>
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {item.icon ? <div className="mb-4 text-2xl text-indigo-600">{item.icon}</div> : null}
          <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
          {item.desc ? <p className="mt-2 text-sm text-slate-600">{item.desc}</p> : null}
        </div>
      ))}
    </div>
  );
}
