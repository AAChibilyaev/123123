export type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  const dimension = SIZE_MAP[size] ?? SIZE_MAP.md;
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${dimension} ${className ?? ""}`}
      role="status"
      aria-label="Loading"
    />
  );
}
