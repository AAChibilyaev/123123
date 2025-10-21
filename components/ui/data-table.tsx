import type { ReactNode } from "react";

export type DataTableColumn = string | { key: string; label: ReactNode };

export type DataTableProps<T extends Record<string, unknown>> = {
  columns: DataTableColumn[];
  data?: T[];
  dataKey?: keyof T | string;
  emptyState?: ReactNode;
};

function getColumnLabel(col: DataTableColumn): ReactNode {
  return typeof col === "string" ? col : col.label ?? col.key;
}

function getColumnKey(col: DataTableColumn): string {
  return typeof col === "string" ? col : col.key;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data = [], emptyState }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={getColumnKey(column)}
                scope="col"
                className="px-4 py-3 text-left text-sm font-semibold text-slate-600"
              >
                {getColumnLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
                {emptyState ?? "No data"}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {columns.map((column) => {
                  const key = getColumnKey(column);
                  const value = (row as Record<string, unknown>)[key];
                  return (
                    <td key={`${key}-${rowIndex}`} className="px-4 py-3 text-sm text-slate-900">
                      {value as ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
