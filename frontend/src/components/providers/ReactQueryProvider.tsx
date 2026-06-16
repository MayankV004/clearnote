"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // useState ensures a new QueryClient is created per session (not shared across users).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 2 minutes before a background re-fetch is triggered.
            staleTime: 1000 * 60 * 2,
            // Keep unused cache data in memory for 5 minutes before garbage collection.
            gcTime: 1000 * 60 * 5,
            // Retry failed requests once before surfacing an error.
            retry: 1,
            // Don't refetch when the browser window regains focus in development
            // (too noisy during hot reloading).
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only render in development; they are excluded from production bundles. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
