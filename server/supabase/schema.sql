create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  invite_code text not null unique,
  partner_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'seen')),
  seen_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  image_path text not null,
  filter text not null default 'soft',
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists users_invite_code_idx on public.users(invite_code);
create index if not exists users_partner_id_idx on public.users(partner_id);
create index if not exists messages_conversation_key_created_at_idx on public.messages(conversation_key, created_at);
create index if not exists moments_conversation_key_created_at_idx on public.moments(conversation_key, created_at desc);
create index if not exists moments_expires_at_idx on public.moments(expires_at);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.moments enable row level security;

drop policy if exists "service role full users" on public.users;
create policy "service role full users" on public.users
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role full messages" on public.messages;
create policy "service role full messages" on public.messages
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role full moments" on public.moments;
create policy "service role full moments" on public.moments
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values ('moments', 'moments', false)
on conflict (id) do nothing;
