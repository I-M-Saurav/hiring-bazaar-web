import { AuthCard } from "@/components/auth/auth-card";
import { SignOutButton } from "@/components/auth/sign-out-button";

/** Signed in with Supabase, but no platform account row (public.users). */
export default function NoAccountPage() {
  return (
    <AuthCard
      title="Account not set up"
      description="You are signed in, but no platform account is linked to this email yet."
    >
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          If you are a placement officer or recruiter, ask the platform admin to finish setting up your account. If you
          registered as a candidate, sign out and try again in a minute.
        </p>
        <SignOutButton />
      </div>
    </AuthCard>
  );
}
