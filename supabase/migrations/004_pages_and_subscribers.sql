-- ============================================
-- 004: changelog pages and subscribers
-- ============================================

-- changelog_pages: public page config per repo
create table public.changelog_pages (
  id              uuid primary key default gen_random_uuid(),
  repo_id         uuid not null unique references public.repos(id) on delete cascade,
  slug            text not null unique,
  custom_domain   text unique,
  title           text not null default 'Changelog',
  description     text,
  is_public       boolean not null default true,
  branding        jsonb not null default '{
    "powered_by": true,
    "primary_color": "#000000",
    "logo_url": null,
    "custom_css": null
  }',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.changelog_pages enable row level security;

create policy "users can crud own changelog pages"
  on public.changelog_pages for all
  using (
    auth.uid() = (
      select user_id from public.repos where id = repo_id
    )
  );

create policy "public can read public changelog pages"
  on public.changelog_pages for select
  using (is_public = true);

create trigger changelog_pages_updated_at
  before update on public.changelog_pages
  for each row execute procedure public.set_updated_at();

create index changelog_pages_slug_idx on public.changelog_pages(slug);
create index changelog_pages_custom_domain_idx
  on public.changelog_pages(custom_domain)
  where custom_domain is not null;

-- subscribers: email subscribers per changelog page
-- no names stored — email only, GDPR minimum
create table public.subscribers (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.changelog_pages(id) on delete cascade,
  email         text not null,
  confirmed_at  timestamptz,
  unsubscribed_at timestamptz,
  created_at    timestamptz not null default now(),
  unique(page_id, email)
);

alter table public.subscribers enable row level security;

create policy "users can read own subscribers"
  on public.subscribers for select
  using (
    auth.uid() = (
      select r.user_id
      from public.changelog_pages cp
      join public.repos r on r.id = cp.repo_id
      where cp.id = page_id
    )
  );

create policy "anyone can subscribe"
  on public.subscribers for insert
  with check (true);

create policy "subscribers can unsubscribe"
  on public.subscribers for update
  using (true)
  with check (true);

create index subscribers_page_id_idx on public.subscribers(page_id);
create index subscribers_email_idx on public.subscribers(email);

-- email_digests: log of sent digest emails
create table public.email_digests (
  id               uuid primary key default gen_random_uuid(),
  page_id          uuid not null references public.changelog_pages(id) on delete cascade,
  entry_ids        uuid[] not null default '{}',
  recipient_count  integer not null default 0,
  subject          text not null,
  status           text not null default 'sent'
                     check (status in ('sent','failed','partial')),
  sent_at          timestamptz not null default now()
);

alter table public.email_digests enable row level security;

create policy "users can read own email digests"
  on public.email_digests for select
  using (
    auth.uid() = (
      select r.user_id
      from public.changelog_pages cp
      join public.repos r on r.id = cp.repo_id
      where cp.id = page_id
    )
  );

create index email_digests_page_id_idx on public.email_digests(page_id);
create index email_digests_sent_at_idx on public.email_digests(sent_at desc);