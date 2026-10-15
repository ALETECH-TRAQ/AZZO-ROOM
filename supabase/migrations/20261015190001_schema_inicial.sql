-- Esquema inicial de referência para a fase autenticada.
-- Revisar junto ao Codex antes de aplicar em projeto real; back-end deve checar as permissões também.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,48}$'),
  name text not null check (char_length(name) between 2 and 100),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check(role in ('owner','admin','member','guest')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.meeting_rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  visibility text not null default 'private' check(visibility in ('private','workspace')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meeting_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_moderate boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(meeting_id,user_id)
);

create index if not exists idx_members_user on public.workspace_members(user_id);
create index if not exists idx_meeting_workspace on public.meeting_rooms(workspace_id);
create index if not exists idx_meeting_members_user on public.meeting_participants(user_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.meeting_rooms enable row level security;
alter table public.meeting_participants enable row level security;

-- SECURITY DEFINER precisa de owner confiável e search_path fixo para evitar recursão de RLS.
create or replace function public.is_workspace_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace and m.user_id = (select auth.uid())
  );
$$;

create policy "workspace select only members" on public.workspaces
for select to authenticated using (
  public.is_workspace_member(id) or owner_id = (select auth.uid())
);
create policy "member see same workspace" on public.workspace_members
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "meetings visible to authorized workspace members" on public.meeting_rooms
for select to authenticated using (
  public.is_workspace_member(workspace_id) and (
    visibility = 'workspace' or exists (
      select 1 from public.meeting_participants p
      where p.meeting_id = meeting_rooms.id and p.user_id = (select auth.uid())
    )
  )
);
create policy "meeting attendance visible to own participant" on public.meeting_participants
for select to authenticated using (user_id = (select auth.uid()));

-- Inserções / edições / exclusões administrativas ficam BLOQUEADAS por padrão.
-- Implementar funções de domínio com checagem de role/ownership e transações seguras.
-- Criar workspace + owner member deve ocorrer via serviço autenticado com RPC controlada.
