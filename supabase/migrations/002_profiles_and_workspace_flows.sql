-- Apply after 001_schema_inicial.sql using the Supabase SQL editor / CLI.
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(char_length(display_name)<=80),
 updated_at timestamptz not null default now()
);
create table public.avatar_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 config jsonb not null check(jsonb_typeof(config)='object' and octet_length(config::text)<2000 and (config->>'schemaVersion')='1'),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.avatar_profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "own avatar" on public.avatar_profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create table public.workspace_invites (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
 token_hash text unique not null,email text,role text not null default 'member' check(role in ('member','guest')),
 expires_at timestamptz not null default now()+interval '7 days',created_by uuid not null references auth.users(id),accepted_at timestamptz
);
alter table public.workspace_invites enable row level security;
create or replace function public.is_workspace_admin(p_workspace uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.workspace_members where workspace_id=p_workspace and user_id=(select auth.uid()) and role in ('owner','admin'));
$$;
create policy "admin invites" on public.workspace_invites for select to authenticated using(public.is_workspace_admin(workspace_id));
create or replace function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare w uuid;private_room uuid;u uuid:=auth.uid();
begin
 if u is null or char_length(trim(p_name)) not between 2 and 100 then raise exception 'Nome inválido ou sessão expirada';end if;
 if (select count(*) from public.workspaces where owner_id=u)>=5 then raise exception 'Limite de escritórios atingido';end if;
 insert into public.workspaces(name,slug,owner_id) values(trim(p_name),'office-'||encode(extensions.gen_random_bytes(12),'hex'),u) returning id into w;
 insert into public.workspace_members(workspace_id,user_id,role) values(w,u,'owner');
 insert into public.meeting_rooms(workspace_id,title,visibility,created_by) values(w,'Sala Horizonte','workspace',u);
 insert into public.meeting_rooms(workspace_id,title,visibility,created_by) values(w,'Sala Conexão','private',u) returning id into private_room;
 insert into public.meeting_participants(meeting_id,user_id,can_moderate) values(private_room,u,true);
 return w;
end;$$;
create or replace function public.create_workspace_invite(p_workspace uuid,p_email text default null,p_role text default 'member')
returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not public.is_workspace_admin(p_workspace) or p_role not in ('member','guest') then raise exception 'Acesso negado';end if;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.workspace_invites(workspace_id,token_hash,email,role,created_by) values(p_workspace,encode(extensions.digest(token,'sha256'),'hex'),nullif(lower(trim(p_email)),''),p_role,auth.uid());
 return token;
end;$$;
create or replace function public.accept_workspace_invite(p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare inv public.workspace_invites;user_email text;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta';end if;
 select email into user_email from auth.users where id=auth.uid();
 select * into inv from public.workspace_invites where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') for update;
 if inv.id is null or inv.accepted_at is not null or inv.expires_at<now() or (inv.email is not null and lower(user_email)<>inv.email) then raise exception 'Convite inválido, expirado ou de outro e-mail';end if;
 insert into public.workspace_members(workspace_id,user_id,role) values(inv.workspace_id,auth.uid(),inv.role) on conflict do nothing;
 update public.workspace_invites set accepted_at=now() where id=inv.id;
 return inv.workspace_id;
end;$$;
revoke all on function public.create_workspace(text) from public,anon;
revoke all on function public.create_workspace_invite(uuid,text,text) from public,anon;
revoke all on function public.accept_workspace_invite(text) from public,anon;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.create_workspace_invite(uuid,text,text) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
create or replace function public.revoke_workspace_invite(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.workspace_invites set expires_at=now() where id=p_id and public.is_workspace_admin(workspace_id);
 if not found then raise exception 'Convite inexistente ou sem permissão';end if;
end;$$;
revoke all on function public.revoke_workspace_invite(uuid) from public,anon;
grant execute on function public.revoke_workspace_invite(uuid) to authenticated;
