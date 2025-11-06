-- Supabase SQL schema for Personal Notes app
-- Creates the 'notes' table with metadata columns, index, and update trigger.

-- 1) Safe extension enable (uuid if needed)
create extension if not exists "uuid-ossp";

-- 2) Notes table
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  title         text not null default '',
  content       text not null default '',
  tags          text[] not null default '{}',
  is_archived   boolean not null default false,
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.notes is 'User-owned notes. RLS is enabled; users can only see and modify their own notes.';
comment on column public.notes.user_id is 'Owner of the note (auth.users.id)';
comment on column public.notes.tags is 'List of tags as text array';
comment on column public.notes.is_archived is 'Archive flag (soft hidden)';
comment on column public.notes.is_deleted is 'Soft delete flag';

-- 3) Helpful indexes
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_updated_at_desc on public.notes(updated_at desc);
create index if not exists idx_notes_active on public.notes(is_archived, is_deleted);

-- 4) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.notes;
create trigger trg_set_updated_at
before update on public.notes
for each row
execute procedure public.set_updated_at();

-- 5) Optional: storage bucket for attachments (if you plan to add file uploads later)
-- Uncomment if using @supabase/storage and file uploads
-- insert into storage.buckets (id, name, public)
-- values ('attachments', 'attachments', false)
-- on conflict (id) do nothing;
