-- Keep client error telemetry private and make repeated score submission explicit.

create table if not exists private.client_error_events (
  event_id uuid primary key,
  category text not null check (char_length(category) between 1 and 64),
  severity text not null check (severity in ('info', 'warning', 'error')),
  message text not null check (char_length(message) between 1 and 280),
  stack text not null default '' check (char_length(stack) <= 2000),
  mode text not null default '' check (char_length(mode) <= 32),
  screen text not null default '' check (char_length(screen) <= 48),
  browser text not null default '' check (char_length(browser) <= 48),
  os text not null default '' check (char_length(os) <= 24),
  device text not null default '' check (char_length(device) <= 16),
  build text not null default '' check (char_length(build) <= 64),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists client_error_events_created_at_idx
on private.client_error_events (created_at desc);

alter table private.client_error_events enable row level security;
revoke all on table private.client_error_events from public, anon, authenticated, service_role;

create or replace function public.record_client_error_internal(
  p_event_id uuid,
  p_category text,
  p_severity text,
  p_message text,
  p_stack text,
  p_mode text,
  p_screen text,
  p_browser text,
  p_os text,
  p_device text,
  p_build text,
  p_rate_key text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_event_id is null
    or coalesce(length(p_category), 0) not between 1 and 64
    or p_category !~ '^[a-z0-9_-]+$'
    or p_severity not in ('info', 'warning', 'error')
    or coalesce(length(p_message), 0) not between 1 and 280
    or length(coalesce(p_stack, '')) > 2000
    or length(coalesce(p_mode, '')) > 32
    or length(coalesce(p_screen, '')) > 48
    or length(coalesce(p_browser, '')) > 48
    or length(coalesce(p_os, '')) > 24
    or length(coalesce(p_device, '')) > 16
    or length(coalesce(p_build, '')) > 64
  then
    raise exception 'INVALID_ERROR_EVENT' using errcode = '22023';
  end if;

  perform private.consume_rate_limit(p_rate_key, 'client_error_event', 30, interval '10 minutes');

  delete from private.client_error_events
  where created_at < clock_timestamp() - interval '30 days';

  insert into private.client_error_events (
    event_id,
    category,
    severity,
    message,
    stack,
    mode,
    screen,
    browser,
    os,
    device,
    build
  )
  values (
    p_event_id,
    p_category,
    p_severity,
    p_message,
    coalesce(p_stack, ''),
    coalesce(p_mode, ''),
    coalesce(p_screen, ''),
    coalesce(p_browser, ''),
    coalesce(p_os, ''),
    coalesce(p_device, ''),
    coalesce(p_build, '')
  )
  on conflict (event_id) do nothing;
end;
$$;

revoke all on function public.record_client_error_internal(uuid, text, text, text, text, text, text, text, text, text, text, text)
from public, anon, authenticated;
grant execute on function public.record_client_error_internal(uuid, text, text, text, text, text, text, text, text, text, text, text)
to service_role;

create or replace function public.complete_school_battle_round_internal(
  p_token text,
  p_answers jsonb,
  p_rate_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_used_at timestamptz;
  v_existing_result jsonb;
  v_result jsonb;
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  perform public.validate_school_battle_round_pacing_internal(
    p_token,
    jsonb_array_length(p_answers)
  );

  select used_at, result
  into v_used_at, v_existing_result
  from public.school_battle_rounds
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if v_used_at is not null then
    perform private.consume_rate_limit(p_rate_key, 'school_round_submit', 30, interval '1 minute');
    return coalesce(v_existing_result, '{}'::jsonb) || jsonb_build_object('alreadySaved', true);
  end if;

  v_result := public.complete_school_battle_round_unchecked_internal(
    p_token,
    p_answers,
    p_rate_key
  );

  return coalesce(v_result, '{}'::jsonb) || jsonb_build_object('alreadySaved', false);
end;
$$;

revoke all on function public.complete_school_battle_round_internal(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.complete_school_battle_round_internal(text, jsonb, text) to service_role;
