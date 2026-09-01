'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes stale time
            gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Do not retry client validation or auth errors (400, 401, 403, 404)
              const status = error?.status || error?.response?.status;
              if (status && status >= 400 && status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

