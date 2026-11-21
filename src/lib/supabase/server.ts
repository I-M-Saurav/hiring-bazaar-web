import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isRole, type Role } from "@/lib/auth/roles";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/** Supabase client for Server Components, Route Handlers and Server Actions. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the middleware refreshes the session instead.
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  email: string | null;
  role: Role;
  collegeId: string | null;
  companyId: string | null;
}

/**
 * The signed-in user with their platform role, or null. The role comes from
 * public.users (RLS lets a user read only their own row), never from
 * anything the browser could set.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("role, college_id, company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !isRole(data.role)) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    role: data.role,
    collegeId: data.college_id,
    companyId: data.company_id,
  };
}
