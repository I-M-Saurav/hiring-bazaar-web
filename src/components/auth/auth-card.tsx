import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <Link href="/" className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground">
          Hiring Bazaar AI
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter> : null}
        </Card>
      </div>
    </main>
  );
}
