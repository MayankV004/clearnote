"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  dense?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  dense = false,
  emptyMessage = "No clinical records found.",
  isLoading = false,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-card", className)}>
      {/* Desktop & Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={cn(
                      "transition-colors",
                      dense ? "px-3 py-2 text-xs" : "px-4 py-3 text-xs",
                      col.sortable && "cursor-pointer hover:text-foreground select-none",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground/70">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className={dense ? "px-3 py-2.5" : "px-4 py-3.5"}>
                      <div className="h-4 w-3/4 rounded-[var(--radius-xs)] bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        dense ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
                        "text-foreground",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card / Stacked View */}
      <div className="block sm:hidden divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">{emptyMessage}</div>
        ) : (
          data.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn("p-4 space-y-2 hover:bg-muted/30 transition-colors", onRowClick && "cursor-pointer")}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2 text-xs">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    {col.header}
                  </span>
                  <div className="text-right text-foreground font-medium">
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
