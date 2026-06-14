-- ============================================================================
-- Shared Worlds — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
-- after creating a new Supabase project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- journals (table only — RLS policies added after journal_members exists)
-- ----------------------------------------------------------------------------
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.journals enable row level security;

-- ----------------------------------------------------------------------------
-- journal_members (must exist before journals RLS policies reference it)
-- ----------------------------------------------------------------------------
create table if not exists public.journal_members (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (journal_id, user_id)
);

alter table public.journal_members enable row level security;

create policy "View memberships for journals you belong to or own"
  on public.journal_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or journal_id in (select id from public.journals where owner_id = auth.uid())
    or journal_id in (
      select journal_id from public.journal_members m2
      where m2.user_id = auth.uid() and m2.status = 'accepted'
    )
  );

create policy "Users can create their own membership row"
  on public.journal_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners can update membership rows for their journals"
  on public.journal_members for update
  to authenticated
  using (journal_id in (select id from public.journals where owner_id = auth.uid()));

create policy "Owners can delete memberships, users can remove themselves"
  on public.journal_members for delete
  to authenticated
  using (
    journal_id in (select id from public.journals where owner_id = auth.uid())
    or user_id = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- journals RLS policies (now safe — journal_members exists)
-- ----------------------------------------------------------------------------
create policy "Open journals are viewable by everyone, members can view their journals"
  on public.journals for select
  to authenticated
  using (
    is_open = true
    or owner_id = auth.uid()
    or id in (
      select journal_id from public.journal_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

create policy "Users can create their own journals"
  on public.journals for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update their journals"
  on public.journals for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Owners can delete their journals"
  on public.journals for delete
  to authenticated
  using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- journal_entries
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

create policy "Entries are viewable by accepted members and the owner"
  on public.journal_entries for select
  to authenticated
  using (
    journal_id in (select id from public.journals where owner_id = auth.uid())
    or journal_id in (
      select journal_id from public.journal_members
      where user_id = auth.uid() and status = 'accepted'
    )
  );

create policy "Accepted members and owner can create entries as themselves"
  on public.journal_entries for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      journal_id in (select id from public.journals where owner_id = auth.uid())
      or journal_id in (
        select journal_id from public.journal_members
        where user_id = auth.uid() and status = 'accepted'
      )
    )
  );

create policy "Authors can update their own entries"
  on public.journal_entries for update
  to authenticated
  using (author_id = auth.uid());

create policy "Authors can delete their own entries, owners can delete any entry"
  on public.journal_entries for delete
  to authenticated
  using (
    author_id = auth.uid()
    or journal_id in (select id from public.journals where owner_id = auth.uid())
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists journal_members_journal_id_idx on public.journal_members (journal_id);
create index if not exists journal_members_user_id_idx on public.journal_members (user_id);
create index if not exists journal_entries_journal_id_idx on public.journal_entries (journal_id);
create index if not exists journal_entries_author_id_idx on public.journal_entries (author_id);
create index if not exists journals_owner_id_idx on public.journals (owner_id);
