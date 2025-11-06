-- Supabase RLS policies for Personal Notes app

-- 1) Enable RLS on the table
alter table public.notes enable row level security;

-- 2) Ensure no-bypass by disabling replica identity full (default) and relying on RLS
-- (Supabase handles this automatically; included for clarity)

-- 3) Read: owners can read their own notes
drop policy if exists "Users can read own notes" on public.notes;
create policy "Users can read own notes"
on public.notes
for select
using ( auth.uid() is not null and user_id = auth.uid() );

-- 4) Insert: owners can create new notes; must set user_id to auth.uid()
drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
on public.notes
for insert
with check ( auth.uid() is not null and user_id = auth.uid() );

-- 5) Update: owners can update their own notes
drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
on public.notes
for update
using ( auth.uid() is not null and user_id = auth.uid() )
with check ( auth.uid() is not null and user_id = auth.uid() );

-- 6) Delete: owners can soft-delete or delete their own notes (hard delete allowed but app uses soft delete)
drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
on public.notes
for delete
using ( auth.uid() is not null and user_id = auth.uid() );
