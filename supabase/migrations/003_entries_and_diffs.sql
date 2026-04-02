-- ============================================
-- 003: generated entries, published entries,
--      and edit diffs (data flywheel)
-- ============================================

-- generated_entries: raw AI draft output
create table public.generated_entries (
  id             uuid primary key default gen_random_uuid(),
  commit_set_id  uuid not null references public.commit_sets(id) on delete cascade,
  repo_id        uuid not null references public.repos(id) on delete cascade,
  ai_draft       jsonb not null default '[]',
  -- ai_draft schema: [{ type, title, description }]
  status         text not null default 'draft'
                   check (status in ('draft','published','discarded')),
  provider       text not null default 'openai',
  prompt_version text not null default 'v1',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.generated_entries enable row level security;

create policy "users can crud own generated entries"
  on public.generated_entries for all
  using (
    auth.uid() = (
      select user_id from public.repos where id = repo_id
    )
  );

create trigger generated_entries_updated_at
  before update on public.generated_entries
  for each row execute procedure public.set_updated_at();

create index generated_entries_repo_id_idx on public.generated_entries(repo_id);
create index generated_entries_status_idx on public.generated_entries(status);

-- published_entries: live changelog entries
create table public.published_entries (
  id                  uuid primary key default gen_random_uuid(),
  repo_id             uuid not null references public.repos(id) on delete cascade,
  generated_entry_id  uuid references public.generated_entries(id) on delete set null,
  title               text not null,
  description         text not null,
  entry_type          text not null default 'improvement'
                        check (entry_type in ('feature','fix','improvement')),
  version_tag         text,
  is_published        boolean not null default true,
  published_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.published_entries enable row level security;

create policy "users can crud own published entries"
  on public.published_entries for all
  using (
    auth.uid() = (
      select user_id from public.repos where id = repo_id
    )
  );

-- public read for changelog pages
create policy "public can read published entries"
  on public.published_entries for select
  using (is_published = true);

create trigger published_entries_updated_at
  before update on public.published_entries
  for each row execute procedure public.set_updated_at();

create index published_entries_repo_id_idx on public.published_entries(repo_id);
create index published_entries_published_at_idx
  on public.published_entries(published_at desc);

-- edit_diffs: data flywheel — captures every edit
-- a user makes to an AI draft before publishing
-- this becomes fine-tuning training data at Month 12
create table public.edit_diffs (
  id                  uuid primary key default gen_random_uuid(),
  generated_entry_id  uuid not null references public.generated_entries(id) on delete cascade,
  published_entry_id  uuid references public.published_entries(id) on delete set null,
  original_draft      jsonb not null,
  published_version   jsonb not null,
  words_added         integer not null default 0,
  words_removed       integer not null default 0,
  entries_removed     integer not null default 0,
  approved_unchanged  boolean not null default false,
  review_duration_ms  integer,
  created_at          timestamptz not null default now()
);

alter table public.edit_diffs enable row level security;

create policy "users can read own edit diffs"
  on public.edit_diffs for select
  using (
    auth.uid() = (
      select r.user_id
      from public.generated_entries ge
      join public.repos r on r.id = ge.repo_id
      where ge.id = generated_entry_id
    )
  );

create policy "service role can insert edit diffs"
  on public.edit_diffs for insert
  with check (true);

create index edit_diffs_generated_entry_id_idx
  on public.edit_diffs(generated_entry_id);
create index edit_diffs_approved_unchanged_idx
  on public.edit_diffs(approved_unchanged);