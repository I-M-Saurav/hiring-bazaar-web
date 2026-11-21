import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      role="candidate"
      nav={[
        { href: "/candidate/dashboard", label: "Readiness" },
        { href: "/candidate/profile", label: "Profile" },
        { href: "/candidate/jobs", label: "Roles" },
        { href: "/candidate/applications", label: "Applications" },
      ]}
    >
      {() => children}
    </AppShell>
  );
}
