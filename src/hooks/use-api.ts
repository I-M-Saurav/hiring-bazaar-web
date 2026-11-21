"use client";

import { useCallback } from "react";

import { ApiError, createApiClient, type ApiClient } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a function that runs a call against the API with a fresh access
 * token (supabase-js refreshes it when needed). Use inside TanStack Query
 * query/mutation functions:
 *
 *   const withApi = useApi();
 *   useQuery({ queryKey: ["readiness", id], queryFn: () => withApi((api) => api.readiness(id)) });
 */
export function useApi() {
  return useCallback(async <T,>(call: (api: ApiClient) => Promise<T>): Promise<T> => {
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!session) {
      throw new ApiError(401, "Your session has ended. Sign in again.");
    }
    return call(createApiClient(session.access_token));
  }, []);
}
