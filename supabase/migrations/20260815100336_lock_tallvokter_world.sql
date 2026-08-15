insert into public.app_settings (key, value, updated_at)
values ('tallvokter_world_enabled', 'false'::jsonb, clock_timestamp())
on conflict (key) do nothing;

drop policy if exists "Public read safe app settings" on public.app_settings;
create policy "Public read safe app settings"
on public.app_settings
for select
to anon, authenticated
using (key in (
  'school_battle_enabled',
  'tallvokter_world_enabled',
  'announcement_enabled',
  'announcement_title',
  'announcement_message',
  'announcement_version'
));

create or replace function public.admin_set_tallvokter_world_enabled_internal(
  p_user_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform private.assert_admin_user(p_user_id);
  insert into public.app_settings (key, value, updated_at)
  values ('tallvokter_world_enabled', to_jsonb(p_enabled), clock_timestamp())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_set_tallvokter_world_enabled_internal(uuid, boolean)
from public, anon, authenticated;
grant execute on function public.admin_set_tallvokter_world_enabled_internal(uuid, boolean)
to service_role;
