\set ON_ERROR_STOP on
-- Simulate Supabase's standard table grants. RLS must still isolate users.
grant usage on schema public,extensions to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select public.create_workspace('Empresa A') as workspace_a \gset
select public.create_workspace_invite(:'workspace_a','carla@example.com','member') as invite_a \gset
insert into public.avatar_profiles(user_id,config) values(auth.uid(),'{"schemaVersion":1}');
do $$begin
 assert (select count(*) from public.workspaces)=1,'owner sees own workspace';
 assert (select count(*) from public.meeting_rooms)=2,'owner sees own private and workspace rooms';
end$$;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select public.create_workspace('Empresa B') as workspace_b \gset
do $$begin
 assert (select count(*) from public.workspaces)=1,'other company isolation';
 assert (select name from public.workspaces)='Empresa B','only B visible';
 assert (select count(*) from public.workspace_members)=1,'members isolated';
 assert (select count(*) from public.avatar_profiles)=0,'avatars private';
 begin
  insert into public.avatar_profiles(user_id,config) values('11111111-1111-1111-1111-111111111111','{"schemaVersion":1}');
  raise exception 'Unexpected cross-user avatar write';
 exception when insufficient_privilege then null;end;
end$$;
-- A mismatched-email invite cannot be redeemed.
select set_config('test.invite',:'invite_a',false);
select set_config('test.workspace_a',:'workspace_a',false);
do $$begin
 begin perform public.accept_workspace_invite(current_setting('test.invite'));raise exception 'Unexpected invite accepted';exception when raise_exception then if SQLERRM='Unexpected invite accepted' then raise;end if;end;
 begin perform public.create_workspace_invite(current_setting('test.workspace_a')::uuid,null,'member');raise exception 'Unexpected invite created';exception when raise_exception then if SQLERRM='Unexpected invite created' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
select public.accept_workspace_invite(:'invite_a');
do $$begin
 assert (select count(*) from public.workspaces)=1,'invited member sees A';
 assert (select name from public.workspaces)='Empresa A','invited to exact workspace';
 assert (select count(*) from public.meeting_rooms)=1,'private meeting hidden from member';
 assert (select count(*) from public.workspace_invites)=0,'invites hidden from member';
 begin perform public.accept_workspace_invite(current_setting('test.invite'));raise exception 'Unexpected reused invite';exception when raise_exception then if SQLERRM='Unexpected reused invite' then raise;end if;end;
end$$;
reset role;
select 'PASS: workspace, avatar, meeting RLS, email-bound single-use invites, owner/admin authorization' as result;
