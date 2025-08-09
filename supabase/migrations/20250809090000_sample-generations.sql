-- ------------------------------------------------------------
-- SAMPLE GENERATIONS (per-user usage log)
-- ------------------------------------------------------------

create table if not exists public.sample_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  duration integer,
  sample_id uuid null references public.samples(id) on delete set null,
  public_url text null,
  created_at timestamp with time zone default now()
);

alter table public.sample_generations enable row level security;

-- Users can see only their own usage
create policy "Users can read own generations"
  on public.sample_generations
  for select
  using (auth.uid() = user_id);

-- Users can insert only for themselves
create policy "Users can insert own generations"
  on public.sample_generations
  for insert
  with check (auth.uid() = user_id);

-- Helpful index for counting and recent history per user
create index if not exists idx_sample_generations_user_created_at
  on public.sample_generations (user_id, created_at desc); 