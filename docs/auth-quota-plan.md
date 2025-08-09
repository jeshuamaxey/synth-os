# Auth + Quota Protection Plan for `api/samples/generate`

## Overview
Protect the ElevenLabs generation endpoint with Supabase Auth, enable invisible anonymous sign‑in, and enforce per-user generation limits communicated through the in‑app CLI.

- Anonymous users: up to 3 generations
- Authenticated users: up to 10 generations
- CLI-only UX: status, errors, and login are all via the terminal interface

## Architecture decisions
- Keep `public.samples` as the shared, de-duplicated asset catalog.
- Add an append-only `public.sample_generations` table to track per-user usage (counts include cache hits).
- Require a valid Supabase JWT on `POST /api/samples/generate` and enforce limits server-side.
- On the client, auto sign-in anonymously on app load; all protected calls include the bearer token.
- When a user logs in, prefer identity linking to upgrade the existing anonymous account so quota history carries over.

---

## Tasks Checklist

### Database / Auth
- [ ] Enable anonymous sign-ins in Supabase
  - [ ] Cloud/Dashboard: Auth settings → enable anonymous users
  - [x] Local: set `enable_anonymous_sign_ins = true` in `supabase/config.toml`
  - [ ] (Optional) Tune `[auth.rate_limit].anonymous_users`
- [x] Create `public.sample_generations` table (append-only usage log)
  - [x] Columns: `id uuid pk`, `user_id uuid not null`, `prompt text not null`, `duration int`, `sample_id uuid null`, `public_url text null`, `created_at timestamptz default now()`
  - [x] FK: `user_id` → `auth.users(id)`
  - [x] Index: `idx_sample_generations_user_created_at(user_id, created_at desc)`
  - [x] RLS: enabled on table
  - [x] Policy: `select/insert` where `user_id = auth.uid()`
- [ ] (Optional hardening) Adjust existing policies
  - [ ] `public.samples`: keep `select` public; restrict `insert/update` to authenticated users (or service-only if desired)
  - [ ] Storage bucket `audio`: consider restricting `insert` to authenticated only
- [x] Add migration SQL and commit

### Backend (Next API route)
- [x] Require Supabase JWT on `POST /api/samples/generate`
  - [x] Read `Authorization: Bearer <token>` from request
  - [x] Initialize Supabase server client with that header
  - [x] `auth.getUser()`; if missing/invalid → return 401 with CLI-friendly string
- [x] Enforce quota before generating
  - [x] Detect anonymous vs authenticated via `user.is_anonymous`
  - [x] Query count: `select count(*) from sample_generations where user_id = auth.uid()`
  - [x] Limit: `3` if anonymous, else `10`
  - [x] If at/over limit → return 429 with CLI-friendly string (`"Limit reached: X/Y. Run 'login' to upgrade."`)
- [x] Proceed with existing de-dup flow
  - [x] If existing sample by `normalized_prompt` → return it
  - [x] Else call ElevenLabs, upload to storage, insert into `public.samples`
- [x] Record usage after success (always, even on cache hit)
  - [x] Insert into `public.sample_generations` with `user_id`, `prompt`, `duration`, and either `sample_id` or `public_url`
- [x] Ensure responses remain small and CLI-consumable; map errors to clear strings

### Frontend (Auth bootstrap + fetch headers)
- [x] Auto anonymous sign-in on app load (invisible)
  - [x] In a provider or `layout.tsx`, on mount: `supabase.auth.getSession()` → if none, `signInAnonymously()`
  - [x] Handle transient rate limits with small backoff retry
- [x] Add bearer token to protected fetches
  - [x] Before calling `/api/samples/generate`, get access token via `supabase.auth.getSession()`
  - [x] Include `Authorization: Bearer <token>` header in the fetch
  - [x] Parse 401/429 and surface messages to CLI

### Frontend (CLI commands)
- [x] `whoami`
  - [x] Print `user.id` and whether `Anonymous` or `Authenticated`
- [x] `quota`
  - [x] Query Supabase to print `X of Y generation(s) used`
- [x] `login`
  - [x] Support email magic link via `supabase.auth.signInWithOtp`
  - [x] Identity linking preference: attempt `auth.linkIdentity` first if available
  - [x] Support inline OTP verification: `verify <otp>` via `supabase.auth.verifyOtp`
  - [x] Post-login: confirm upgraded status in CLI; quota becomes 10 (implicit via whoami/quota)
- [x] (Optional) `logout` to clear session
- [x] Update generate flow UI text
  - [x] On 401: "Not signed in yet. Please wait a moment or run 'login'."
  - [x] On 429: "Limit reached: X/Y. Run 'login' to upgrade to 10."

### Observability & Admin
- [ ] Add simple admin SQL/snippets to inspect usage
  - [ ] Per-user counts, last generation timestamps
  - [ ] Top prompts
- [ ] (Optional) Add rate limiting at the API layer if needed (per-IP, per-user)

### DevOps / Local Setup
- [x] Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Enable anonymous sign-ins locally in `supabase/config.toml`
- [x] Create and run migration for `sample_generations`
- [ ] `yarn dev` end-to-end test locally

### UX Adjustments
- [x] Skip boot sequence when returning via auth email link (one-time)

### QA Scenarios
- [ ] Fresh visit auto-signs in anonymously (no visible UI)
- [ ] Generate 3 times as anonymous → 4th returns CLI 429 message
- [ ] Run `login email <addr>` then `verify <otp>` → now limit is 10 and user shows as Authenticated
- [ ] Clicking email link returns to app and skips boot-up sequence
- [ ] After login, previous anonymous usage is preserved (identity linking)
- [ ] Cache hit still increments usage
- [ ] Unauthorized call to API without token returns 401

---

## Implementation Notes
- Server client initialization: pass the bearer token as an Authorization header when creating Supabase client so `auth.getUser()` works server-side.
- Identity linking ensures continuity of `user_id`. Avoid logging in as a separate user without linking; otherwise quota resets.
- Keep `samples` focused on asset metadata; do not duplicate per-user to count usage.

## Acceptance Criteria
- Endpoint rejects unauthenticated requests
- Anonymous users limited to 3 generations; authenticated to 10
- Limits and auth feedback shown only via terminal CLI
- Anonymous session established automatically on page load
- Upgrading to a real account preserves usage history and raises limit to 10 