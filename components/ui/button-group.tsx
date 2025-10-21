import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost";

type ButtonConfig = {
  label: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
};

export type ButtonGroupProps = {
  buttons: ButtonConfig[];
  className?: string;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  default: "bg-indigo-600 text-white hover:bg-indigo-500",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
  secondary: "bg-slate-900 text-white hover:bg-slate-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
};

function renderButton(button: ButtonConfig, index: number) {
  const variant = button.variant ?? "default";
  const common = clsx(
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
    VARIANT_STYLES[variant]
  );

  if (button.href) {
    return (
      <a key={index} href={button.href} className={common}>
        {button.label}
      </a>
    );
  }

  return (
    <button key={index} type="button" className={common} onClick={button.onClick}>
      {button.label}
    </button>
  );
}

export function ButtonGroup({ buttons, className }: ButtonGroupProps) {
  return <div className={clsx("flex flex-wrap gap-3", className)}>{buttons.map(renderButton)}</div>;
}
