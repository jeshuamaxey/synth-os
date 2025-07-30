-- ------------------------------------------------------------
-- AUDIO BUCKET
-- ------------------------------------------------------------

-- Create the audio bucket
insert into storage.buckets (id, name, public) values ('audio', 'audio', true);

-- Allow anyone (including anon) to upload files to the audio bucket
create policy "Anyone can upload to audio bucket"
on storage.objects
for insert
with check (bucket_id = 'audio');

-- Allow anyone to read files from the audio bucket
create policy "Anyone can read from audio bucket"
on storage.objects
for select
using (bucket_id = 'audio');


-- ------------------------------------------------------------
-- SAMPLES TABLE
-- ------------------------------------------------------------

-- Create the samples table
create table if not exists public.samples (
  id uuid primary key default gen_random_uuid(),
  normalized_prompt text not null unique,
  public_url text not null,
  root_midi integer not null default 60,
  trim_start integer,
  trim_end integer,
  is_example boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Enable row level security
alter table public.samples enable row level security;

-- Policy: Anyone can select from samples
create policy "Public read access to samples"
  on public.samples
  for select
  using (true);

-- Policy: Allow insert for authenticated users (customize as needed)
create policy "Public insert access to samples"
  on public.samples
  for insert
  with check (true);

-- Policy: Allow update for anyone
create policy "Public update access to samples"
  on public.samples
  for update
  using (true)
  with check (true);

