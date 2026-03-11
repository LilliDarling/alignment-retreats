-- Contact form submissions from unauthenticated users
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.contact_submissions enable row level security;

-- Anyone (including anon) can submit
create policy "Anyone can submit contact form"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Only admins can view submissions
create policy "Admins can view contact submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
