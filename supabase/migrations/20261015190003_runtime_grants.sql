-- Grants explícitos para instalações novas, sem depender dos defaults do dashboard.
-- RLS continua responsável pelo isolamento por usuário/workspace.
grant usage on schema public to authenticated;
grant select on public.workspaces,public.workspace_members,public.meeting_rooms,public.meeting_participants,public.workspace_invites to authenticated;
grant select,insert,update on public.profiles,public.avatar_profiles to authenticated;
revoke all on public.profiles,public.avatar_profiles,public.workspace_invites from anon;
revoke all on function public.is_workspace_member(uuid) from public,anon;
revoke all on function public.is_workspace_admin(uuid) from public,anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
