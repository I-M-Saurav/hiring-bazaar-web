import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/client";

export function QueryError({ error, title = "Could not load this" }: { error: unknown; title?: string }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const status = error instanceof ApiError ? error.status : null;
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {status ? <span className="ml-1 text-xs opacity-70">({status})</span> : null}
      </AlertDescription>
    </Alert>
  );
}
