-- ============================================
-- 002: commit sets and retry queue
-- ============================================

-- commit_sets: raw ingested commits per webhook push
-- IMPORTANT: no author emails ever stored here
create table public.commit_sets (
  id          uuid primary key default gen_random_uuid(),
  repo_id     uuid not null references public.repos(id) on delete cascade,
  commits     jsonb not null default '[]',
  -- commits schema: [{ sha, message, timestamp, author_name }]
  -- author EMAIL is intentionally excluded — GDPR
  branch      text not null,
  pushed_at   timestamptz not null default now(),
  commit_count integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.commit_sets enable row level security;

create policy "users can read own commit sets"
  on public.commit_sets for select
  using (
    auth.uid() = (
      select user_id from public.repos where id = repo_id
    )
  );

create index commit_sets_repo_id_idx on public.commit_sets(repo_id);
create index commit_sets_pushed_at_idx on public.commit_sets(pushed_at desc);

-- pending_generations: retry queue for failed OpenAI calls
create table public.pending_generations (
  id            uuid primary key default gen_random_uuid(),
  commit_set_id uuid not null references public.commit_sets(id) on delete cascade,
  repo_id       uuid not null references public.repos(id) on delete cascade,
  status        text not null default 'queued'
                  check (status in ('queued','processing','done','failed')),
  retry_count   integer not null default 0,
  max_retries   integer not null default 3,
  last_error    text,
  provider      text not null default 'openai'
                  check (provider in ('openai','anthropic')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  next_retry_at timestamptz not null default now()
);

alter table public.pending_generations enable row level security;

create policy "users can read own pending generations"
  on public.pending_generations for select
  using (
    auth.uid() = (
      select user_id from public.repos where id = repo_id
    )
  );

create trigger pending_generations_updated_at
  before update on public.pending_generations
  for each row execute procedure public.set_updated_at();

create index pending_generations_status_idx
  on public.pending_generations(status)
  where status in ('queued','processing');

create index pending_generations_next_retry_idx
  on public.pending_generations(next_retry_at)
  where status = 'queued';