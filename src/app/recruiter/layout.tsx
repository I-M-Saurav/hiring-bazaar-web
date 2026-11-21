import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      role="recruiter"
      nav={[
        { href: "/recruiter/dashboard", label: "Job descriptions" },
        { href: "/recruiter/post-jd", label: "Post a JD" },
      ]}
    >
      {() => children}
    </AppShell>
  );
}
