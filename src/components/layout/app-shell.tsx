import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/auth/roles";
import { getCurrentUser, type CurrentUser } from "@/lib/supabase/server";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Header + navigation for one role's area. Server-side check on top of the
 * middleware: a user of another role is redirected to their own home.
 */
export async function AppShell({
  role,
  nav,
  children,
}: {
  role: Role;
  nav: NavItem[];
  children: (user: CurrentUser) => ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={ROLE_HOME[role]} className="font-semibold">
              Hiring Bazaar AI
            </Link>
            <nav className="flex gap-4 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children(user)}</main>
    </div>
  );
}
