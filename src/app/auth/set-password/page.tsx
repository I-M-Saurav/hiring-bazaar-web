"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Set a password after accepting an invite (placement officers, recruiters)
 * or following a password-reset link. AuthHashHandler has already turned
 * the link into a session; without one, the user is asked to sign in.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const load = () =>
      supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null);
        setChecked(true);
      });
    void load();
    // The session may arrive a moment later, when AuthHashHandler stores it.
    const { data } = supabase.auth.onAuthStateChange(() => void load());
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (!checked) {
    return <AuthCard title="Set your password" description="Checking your invite link…">{null}</AuthCard>;
  }
  if (!email) {
    return (
      <AuthCard title="Link expired" description="This invite or reset link is no longer valid.">
        <p className="text-sm text-muted-foreground">Ask the platform admin to send a new invite, or sign in.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set your password" description={`For ${email}. You will use it to sign in from now on.`}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Set password and continue"}
        </Button>
      </form>
    </AuthCard>
  );
}
