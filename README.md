# hiring-bazaar-web

Frontend of the **AI Recruitment Intelligence Platform** (Hiring Bazaar AI):
three dashboards for candidates, placement officers (TPOs) and recruiters.

The backend is a separate service and repo, `hiring-bazaar-api` (FastAPI +
the ML layer). The two only talk over HTTP and through Supabase:

```
hiring-bazaar-web (Next.js 14) ──REST + Bearer JWT──▶ hiring-bazaar-api (FastAPI, ML)
        │                                                  │
        └──── supabase-js (auth, read-only via RLS) ───────┴── Supabase (Postgres + pgvector + Auth)
```

- **Auth:** Supabase Auth (email + password), session in cookies via
  `@supabase/ssr`. Only candidates self-register; TPO and recruiter accounts
  are invited by the admin (`hiring-bazaar-api/scripts/create_staff_user.py`).
- **Reads:** directly from Supabase with the signed-in user's session; Row
  Level Security decides what each role may see.
- **Writes and ML:** through the API, which verifies the access token and the
  caller's role.

## Stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS 3 · shadcn/ui ·
TanStack Query · Zustand · Recharts · Supabase JS.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:3000
```

`.env.local`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (public by design; never the service_role key) |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL, e.g. `http://127.0.0.1:8000` |

The API must be running (`uvicorn app.main:app --reload` in
`hiring-bazaar-api`) and must allow this origin in `CORS_ALLOWED_ORIGINS`
(`http://localhost:3000` is allowed by default).

### Supabase dashboard settings

Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000` (the deployed URL later)
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

These make email confirmation and invite links land on `/auth/callback`,
which exchanges the code for a session.

## Structure

```
src/
  middleware.ts            session refresh + role-area guard
  app/
    auth/                  login, register (candidates), callback, no-account
    candidate/ tpo/ recruiter/   one route group per role (blueprint Section 9)
  components/              ui/ (shadcn), layout/, auth/, candidate/, tpo/
  hooks/use-api.ts         API calls with the current access token
  lib/
    api/                   typed FastAPI client + response types
    auth/roles.ts          roles and their home routes
    supabase/              browser/server clients, database types
```

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit`

## Known follow-ups

- **Next.js 14 security advisories.** 14.2.35 is the last 14.x release; fixes
  for the open advisories (React Server Components DoS, image optimizer and
  rewrites issues) ship only in Next 15+/16. The app avoids `remotePatterns`
  and `rewrites`. Revisit the version before production.
- **College at signup.** The signed-out key cannot read any table (by design),
  so registration does not offer a college list yet; it needs a small public
  API endpoint.
- **Database types** in `src/lib/supabase/database.types.ts` are hand-written;
  replace them with `supabase gen types` output once the Supabase CLI is set up.
