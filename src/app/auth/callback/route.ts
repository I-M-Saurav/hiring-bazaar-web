import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase email links (signup confirmation, staff
 * invites): exchanges the one-time code for a session cookie, then lets the
 * middleware route the user to their dashboard.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const home = new URL("/", request.url);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(home);
  }
  const login = new URL("/auth/login", request.url);
  login.searchParams.set("error", "That link is invalid or has expired. Sign in, or request a new link.");
  return NextResponse.redirect(login);
}
