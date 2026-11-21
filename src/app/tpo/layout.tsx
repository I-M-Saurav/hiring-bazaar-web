import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function TpoLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="tpo" nav={[{ href: "/tpo/dashboard", label: "Batch overview" }]}>
      {() => children}
    </AppShell>
  );
}
