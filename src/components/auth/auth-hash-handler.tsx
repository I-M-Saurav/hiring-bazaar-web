"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Supabase invite and password-recovery links sign the user in with tokens
 * in the URL fragment (#access_token=...&refresh_token=...&type=invite),
 * not with the ?code= exchange used for signup confirmation. The fragment
 * never reaches the server, so this runs in the browser on whichever page
 * the link lands on (the redirect URL, or the Site URL as a fallback),
 * stores the session, removes the tokens from the address bar, and sends
 * invited/recovering users to set a password.
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash.includes("access_token") && !hash.includes("error_description")) return;

    const params = new URLSearchParams(hash);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const error = params.get("error_description");
    if (error) {
      router.replace(`/auth/login?error=${encodeURIComponent(error)}`);
      return;
    }
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const type = params.get("type");
    void createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: sessionError }) => {
        if (sessionError) {
          router.replace(`/auth/login?error=${encodeURIComponent(sessionError.message)}`);
          return;
        }
        router.replace(type === "invite" || type === "recovery" ? "/auth/set-password" : "/");
        router.refresh();
      });
  }, [router]);

  return null;
}
