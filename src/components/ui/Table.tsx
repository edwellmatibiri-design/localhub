import type { ReactNode } from "react";

interface TableProps<T> {
  columns: string[];
  rows: T[];
  renderCell: (row: T, col: string) => ReactNode;
}

export function Table<T>({ columns, rows, renderCell }: TableProps<T>) {
  return (
    <div className="border-lh-border bg-lh-surface-soft overflow-hidden rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-lh-surface">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="text-lh-text-secondary px-4 py-2 text-left text-xs font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-lh-text-secondary px-4 py-4 text-center text-xs"
              >
                No data available.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-lh-border border-t">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="text-lh-text-secondary px-4 py-2 text-xs"
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
