-- ============================================
-- 001: users and repos
-- ============================================

-- profiles extends Supabase auth.users
-- created automatically on signup via trigger
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  plan         text not null default 'free'
                 check (plan in ('free','starter','growth','agency')),
  plan_status  text not null default 'active'
                 check (plan_status in ('active','paused','cancelled')),
  paddle_customer_id    text,
  paddle_subscription_id text,
  generations_used_this_month integer not null default 0,
  generations_reset_at  timestamptz not null default date_trunc('month', now()),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at auto-update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- repos: connected GitHub/GitLab repositories
create table public.repos (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  github_repo_id    bigint not null,
  github_repo_name  text not null,
  github_full_name  text not null,
  github_owner      text not null,
  provider          text not null default 'github'
                      check (provider in ('github','gitlab')),
  webhook_id        bigint,
  webhook_secret    text not null,
  is_active         boolean not null default true,
  default_branch    text not null default 'main',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(user_id, github_repo_id)
);

alter table public.repos enable row level security;

create policy "users can crud own repos"
  on public.repos for all
  using (auth.uid() = user_id);

create trigger repos_updated_at
  before update on public.repos
  for each row execute procedure public.set_updated_at();

create index repos_user_id_idx on public.repos(user_id);