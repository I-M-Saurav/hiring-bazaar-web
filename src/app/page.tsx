import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Public landing page. Signed-in users are sent to their dashboard by the middleware. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Hiring Bazaar AI</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">AI Recruitment Intelligence Platform</h1>
        <p className="text-lg text-muted-foreground">
          See where you stand at every stage of placements — resume shortlisting, technical rounds and offers — and
          exactly which factors help or hurt each one.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/auth/register">Create a candidate account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Placement officers and recruiters: your account is created by the platform admin. Use Sign in with the email
        you were invited with.
      </p>
    </main>
  );
}
