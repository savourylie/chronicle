-- Create the analyses table for storing GitHub repo analysis results
create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  repo_url      text not null,
  repo_owner    text,
  repo_name     text,
  branch        text,
  commit_count  integer,
  status        text not null default 'pending'
                  check (status in ('pending', 'cloning', 'analyzing', 'complete', 'error')),
  result        jsonb,
  error_message text,
  pipeline_ms   integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes
create index if not exists idx_analyses_repo_url on public.analyses (repo_url);
create index if not exists idx_analyses_status  on public.analyses (status);

-- Auto-update updated_at on row modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.analyses
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.analyses enable row level security;

-- Anyone can read analyses
create policy "Analyses are publicly readable"
  on public.analyses for select
  using (true);

-- Only service_role can insert
create policy "Service role can insert analyses"
  on public.analyses for insert
  with check (auth.role() = 'service_role');

-- Only service_role can update
create policy "Service role can update analyses"
  on public.analyses for update
  using (auth.role() = 'service_role');
