import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="candidate" nav={[{ href: "/candidate/dashboard", label: "Readiness" }]}>
      {() => children}
    </AppShell>
  );
}
