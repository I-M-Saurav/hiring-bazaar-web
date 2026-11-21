import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROLE_HOME, isRole, roleForPath } from "@/lib/auth/roles";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Runs on every page request:
 *  1. refreshes the Supabase session cookie (access tokens are short-lived);
 *  2. guards the role areas: signed-out visitors go to /auth/login, and a
 *     signed-in user opening another role's area goes to their own home.
 *
 * This is a UX guard. Real enforcement is RLS (reads) and the FastAPI role
 * checks (writes), so a user who bypassed it still could not see or change
 * another role's data.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the token with Supabase (getSession() would trust the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const area = roleForPath(pathname);
  const isAuthPage = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register");

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user) {
    if (area) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (area || isAuthPage || pathname === "/") {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    const role = data && isRole(data.role) ? data.role : null;
    if (!role) {
      return area ? redirectTo("/auth/no-account") : response;
    }
    if (isAuthPage || pathname === "/" || (area && area !== role)) {
      return redirectTo(ROLE_HOME[role]);
    }
  }

  return response;
}

export const config = {
  // Every route except static assets and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
