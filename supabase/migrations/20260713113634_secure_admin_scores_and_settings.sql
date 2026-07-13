-- Add the trusted server-side boundary without breaking the currently deployed client.
-- The follow-up migration retires the legacy endpoints after the new client is live.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null,
  mode text not null default 'multiplication',
  level text not null default 'medium',
  grade_level integer not null default 4,
  game_type text not null default 'normal',
  school text,
  question_count integer,
  grade_group text
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.scores enable row level security;
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values
  ('school_battle_enabled', 'true'::jsonb),
  ('announcement_enabled', 'false'::jsonb),
  ('announcement_title', '""'::jsonb),
  ('announcement_message', '""'::jsonb),
  ('announcement_version', '""'::jsonb)
on conflict (key) do nothing;

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists private.app_secrets (
  key text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.api_rate_limits (
  rate_key text not null,
  scope text not null,
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 0,
  primary key (rate_key, scope)
);

create table if not exists public.school_battle_rounds (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  player_name text not null,
  school text not null,
  mode text not null,
  grade_level integer not null,
  grade_group text not null,
  questions jsonb not null,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  used_at timestamptz,
  result jsonb,
  constraint school_battle_rounds_mode_check
    check (mode in ('addition', 'subtraction', 'multiplication', 'division')),
  constraint school_battle_rounds_grade_check check (grade_level between 1 and 7),
  constraint school_battle_rounds_grade_group_check check (grade_group in ('small', 'middle')),
  constraint school_battle_rounds_questions_check check (jsonb_typeof(questions) = 'array')
);

alter table public.school_battle_rounds enable row level security;
revoke all on table public.school_battle_rounds from public, anon, authenticated;
grant select, insert, update, delete on table public.school_battle_rounds to service_role;
revoke all on all tables in schema private from public, anon, authenticated;

insert into private.app_secrets (key, secret_hash)
select
  'regnereisen_access_code',
  extensions.crypt(value #>> '{}', extensions.gen_salt('bf', 10))
from public.app_settings
where key = 'regnereisen_access_code'
  and value #>> '{}' ~ '^[0-9]{4}$'
on conflict (key) do nothing;

create or replace function private.consume_rate_limit(
  p_rate_key text,
  p_scope text,
  p_limit integer,
  p_window interval
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_count integer;
begin
  if coalesce(length(p_rate_key), 0) < 16
    or coalesce(length(p_scope), 0) < 1
    or p_limit < 1
    or p_window <= interval '0 seconds'
  then
    raise exception 'INVALID_RATE_LIMIT_INPUT' using errcode = '22023';
  end if;

  insert into private.api_rate_limits (rate_key, scope, window_started_at, request_count)
  values (p_rate_key, p_scope, clock_timestamp(), 1)
  on conflict (rate_key, scope) do update
  set
    window_started_at = case
      when private.api_rate_limits.window_started_at <= clock_timestamp() - p_window
        then clock_timestamp()
      else private.api_rate_limits.window_started_at
    end,
    request_count = case
      when private.api_rate_limits.window_started_at <= clock_timestamp() - p_window
        then 1
      else private.api_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  if v_count > p_limit then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.consume_rate_limit(text, text, integer, interval) from public, anon, authenticated;

create or replace function private.assert_admin_user(p_user_id uuid)
returns void
language plpgsql
security definer
stable
set search_path = pg_catalog
as $$
begin
  if p_user_id is null or not exists (
    select 1 from private.admin_users where user_id = p_user_id
  ) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.assert_admin_user(uuid) from public, anon, authenticated;

create or replace function public.check_admin_user_internal(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = pg_catalog
as $$
  select p_user_id is not null and exists (
    select 1 from private.admin_users where user_id = p_user_id
  );
$$;

revoke all on function public.check_admin_user_internal(uuid) from public, anon, authenticated;
grant execute on function public.check_admin_user_internal(uuid) to service_role;

create or replace function public.create_school_battle_round_internal(
  p_token text,
  p_player_name text,
  p_school text,
  p_mode text,
  p_grade_level integer,
  p_grade_group text,
  p_questions jsonb,
  p_rate_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_enabled boolean;
  v_clean_name text := btrim(p_player_name);
  v_clean_school text := btrim(p_school);
  v_round_id uuid;
begin
  perform private.consume_rate_limit(p_rate_key, 'school_round_start', 10, interval '1 minute');

  select coalesce((value #>> '{}')::boolean, true)
  into v_enabled
  from public.app_settings
  where key = 'school_battle_enabled';

  if coalesce(v_enabled, true) is not true then
    raise exception 'SCHOOL_BATTLE_CLOSED' using errcode = 'P0001';
  end if;

  if coalesce(length(p_token), 0) < 32
    or v_clean_name !~ '^[A-Za-z0-9ÆØÅæøå -]{2,24}$'
    or v_clean_name ~ '  '
    or length(v_clean_school) not between 1 and 80
    or p_mode not in ('addition', 'subtraction', 'multiplication', 'division')
    or p_grade_level not between 1 and 7
    or p_grade_group not in ('small', 'middle')
    or (p_grade_level <= 4 and p_grade_group <> 'small')
    or (p_grade_level >= 5 and p_grade_group <> 'middle')
    or jsonb_typeof(p_questions) <> 'array'
    or jsonb_array_length(p_questions) not between 25 and 240
  then
    raise exception 'INVALID_ROUND' using errcode = '22023';
  end if;

  delete from public.school_battle_rounds
  where expires_at < clock_timestamp() - interval '1 day';
  delete from private.api_rate_limits
  where window_started_at < clock_timestamp() - interval '1 day';

  insert into public.school_battle_rounds (
    token_hash,
    player_name,
    school,
    mode,
    grade_level,
    grade_group,
    questions,
    expires_at
  )
  values (
    encode(extensions.digest(p_token, 'sha256'), 'hex'),
    v_clean_name,
    v_clean_school,
    p_mode,
    p_grade_level,
    p_grade_group,
    p_questions,
    clock_timestamp() + interval '45 minutes'
  )
  returning id into v_round_id;

  return jsonb_build_object('created', true, 'roundId', v_round_id);
end;
$$;

revoke all on function public.create_school_battle_round_internal(text, text, text, text, integer, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_school_battle_round_internal(text, text, text, text, integer, text, jsonb, text) to service_role;

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
  v_round public.school_battle_rounds%rowtype;
  v_enabled boolean;
  v_answer record;
  v_answer_count integer;
  v_answer_value integer;
  v_correct_value integer;
  v_correct_count integer := 0;
  v_wrong_count integer := 0;
  v_score integer := 0;
  v_elapsed_seconds integer;
  v_is_time boolean;
  v_existing_score integer;
  v_candidate_id uuid;
  v_saved boolean := false;
  v_result jsonb;
begin
  perform private.consume_rate_limit(p_rate_key, 'school_round_submit', 30, interval '1 minute');

  if coalesce(length(p_token), 0) < 32 or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  select * into v_round
  from public.school_battle_rounds
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'ROUND_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_round.used_at is not null then
    return v_round.result;
  end if;
  if v_round.expires_at <= clock_timestamp() then
    raise exception 'ROUND_EXPIRED' using errcode = 'P0001';
  end if;

  select coalesce((value #>> '{}')::boolean, true)
  into v_enabled
  from public.app_settings
  where key = 'school_battle_enabled';
  if coalesce(v_enabled, true) is not true then
    raise exception 'SCHOOL_BATTLE_CLOSED' using errcode = 'P0001';
  end if;

  v_answer_count := jsonb_array_length(p_answers);
  if v_answer_count < 1
    or v_answer_count > jsonb_array_length(v_round.questions)
    or v_answer_count > 240
  then
    raise exception 'INVALID_ANSWER_COUNT' using errcode = '22023';
  end if;

  for v_answer in
    select value, ordinality
    from jsonb_array_elements(p_answers) with ordinality
  loop
    if jsonb_typeof(v_answer.value) <> 'number' or v_answer.value::text !~ '^-?[0-9]+$' then
      raise exception 'INVALID_ANSWER' using errcode = '22023';
    end if;
    v_answer_value := v_answer.value::text::integer;
    v_correct_value := (v_round.questions -> (v_answer.ordinality::integer - 1) ->> 'correct')::integer;
    if v_answer_value = v_correct_value then
      v_correct_count := v_correct_count + 1;
      v_score := v_score + 1;
    else
      v_wrong_count := v_wrong_count + 1;
      v_score := greatest(0, v_score - 1);
    end if;
  end loop;

  v_elapsed_seconds := greatest(1, floor(extract(epoch from (clock_timestamp() - v_round.started_at)))::integer);
  v_is_time := v_round.mode in ('addition', 'subtraction');

  if v_is_time then
    if v_correct_count <> 25 or v_elapsed_seconds > 2700 then
      raise exception 'INCOMPLETE_TIME_ROUND' using errcode = '22023';
    end if;
    v_score := v_elapsed_seconds + (v_wrong_count * 5);
  elsif v_elapsed_seconds < 65 or v_elapsed_seconds > 600 then
    raise exception 'INVALID_SCORE_ROUND_DURATION' using errcode = '22023';
  end if;

  if v_is_time then
    select min(score) into v_existing_score
    from public.scores
    where game_type = 'school_battle'
      and mode = v_round.mode
      and grade_group = v_round.grade_group
      and question_count = 25
      and lower(btrim(name)) = lower(v_round.player_name)
      and lower(btrim(coalesce(school, ''))) = lower(v_round.school)
      and grade_level = v_round.grade_level;

    if v_existing_score is null or v_score < v_existing_score then
      delete from public.scores
      where game_type = 'school_battle'
        and mode = v_round.mode
        and grade_group = v_round.grade_group
        and question_count = 25
        and lower(btrim(name)) = lower(v_round.player_name)
        and lower(btrim(coalesce(school, ''))) = lower(v_round.school)
        and grade_level = v_round.grade_level;

      insert into public.scores (name, score, mode, level, grade_level, game_type, school, question_count, grade_group)
      values (v_round.player_name, v_score, v_round.mode, 'medium', v_round.grade_level, 'school_battle', v_round.school, 25, v_round.grade_group)
      returning id into v_candidate_id;

      with ranked as (
        select id, row_number() over (order by score asc, id asc) as position
        from public.scores
        where game_type = 'school_battle'
          and mode = v_round.mode
          and grade_group = v_round.grade_group
          and question_count = 25
      )
      delete from public.scores s using ranked r
      where s.id = r.id and r.position > 20;
    end if;
  else
    select max(score) into v_existing_score
    from public.scores
    where game_type = 'school_battle'
      and mode = v_round.mode
      and lower(btrim(name)) = lower(v_round.player_name)
      and lower(btrim(coalesce(school, ''))) = lower(v_round.school)
      and grade_level = v_round.grade_level;

    if v_existing_score is null or v_score > v_existing_score then
      delete from public.scores
      where game_type = 'school_battle'
        and mode = v_round.mode
        and lower(btrim(name)) = lower(v_round.player_name)
        and lower(btrim(coalesce(school, ''))) = lower(v_round.school)
        and grade_level = v_round.grade_level;

      insert into public.scores (name, score, mode, level, grade_level, game_type, school, question_count, grade_group)
      values (v_round.player_name, v_score, v_round.mode, 'medium', v_round.grade_level, 'school_battle', v_round.school, 0, v_round.grade_group)
      returning id into v_candidate_id;

      with ranked as (
        select id, row_number() over (order by score desc, id asc) as position
        from public.scores
        where game_type = 'school_battle' and mode = v_round.mode
      )
      delete from public.scores s using ranked r
      where s.id = r.id and r.position > 20;
    end if;
  end if;

  if v_candidate_id is not null then
    select exists(select 1 from public.scores where id = v_candidate_id) into v_saved;
  end if;

  v_result := jsonb_build_object(
    'saved', v_saved,
    'score', v_score,
    'correctAnswers', v_correct_count,
    'wrongAnswers', v_wrong_count,
    'message', case
      when v_saved then 'Du kom på Skolekampen-listen!'
      when v_is_time then 'Det holdt ikke til topp 20 i Skolekampen denne gangen.'
      else 'Det holdt ikke til topp 20 i Skolekampen denne gangen.'
    end
  );

  update public.school_battle_rounds
  set used_at = clock_timestamp(), result = v_result
  where id = v_round.id;

  return v_result;
end;
$$;

revoke all on function public.complete_school_battle_round_internal(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.complete_school_battle_round_internal(text, jsonb, text) to service_role;

create or replace function public.verify_regnereisen_access_code_internal(
  p_code text,
  p_rate_key text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_hash text;
begin
  perform private.consume_rate_limit(p_rate_key, 'regnereisen_access', 5, interval '15 minutes');
  if p_code !~ '^[0-9]{4}$' then
    return false;
  end if;
  select secret_hash into v_hash
  from private.app_secrets
  where key = 'regnereisen_access_code';
  return v_hash is not null and extensions.crypt(p_code, v_hash) = v_hash;
end;
$$;

revoke all on function public.verify_regnereisen_access_code_internal(text, text) from public, anon, authenticated;
grant execute on function public.verify_regnereisen_access_code_internal(text, text) to service_role;

create or replace function public.admin_set_school_battle_enabled_internal(
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
  values ('school_battle_enabled', to_jsonb(p_enabled), clock_timestamp())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_set_school_battle_enabled_internal(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_school_battle_enabled_internal(uuid, boolean) to service_role;

create or replace function public.admin_set_regnereisen_access_code_internal(
  p_user_id uuid,
  p_access_code text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform private.assert_admin_user(p_user_id);
  if p_access_code !~ '^[0-9]{4}$' then
    raise exception 'INVALID_ACCESS_CODE' using errcode = '22023';
  end if;
  insert into private.app_secrets (key, secret_hash, updated_at)
  values ('regnereisen_access_code', extensions.crypt(p_access_code, extensions.gen_salt('bf', 10)), clock_timestamp())
  on conflict (key) do update set secret_hash = excluded.secret_hash, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_set_regnereisen_access_code_internal(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_regnereisen_access_code_internal(uuid, text) to service_role;

create or replace function public.admin_set_announcement_internal(
  p_user_id uuid,
  p_enabled boolean,
  p_title text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_title text := left(btrim(coalesce(p_title, '')), 80);
  v_message text := left(btrim(coalesce(p_message, '')), 280);
  v_version text := clock_timestamp()::text;
begin
  perform private.assert_admin_user(p_user_id);
  if p_enabled and length(v_message) = 0 then
    raise exception 'ANNOUNCEMENT_MESSAGE_REQUIRED' using errcode = '22023';
  end if;
  insert into public.app_settings (key, value, updated_at)
  values
    ('announcement_enabled', to_jsonb(p_enabled), clock_timestamp()),
    ('announcement_title', to_jsonb(v_title), clock_timestamp()),
    ('announcement_message', to_jsonb(v_message), clock_timestamp()),
    ('announcement_version', to_jsonb(v_version), clock_timestamp())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_set_announcement_internal(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_announcement_internal(uuid, boolean, text, text) to service_role;

create or replace function public.admin_delete_score_internal(
  p_user_id uuid,
  p_score_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_deleted integer;
begin
  perform private.assert_admin_user(p_user_id);
  delete from public.scores where id = p_score_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.admin_delete_score_internal(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_score_internal(uuid, uuid) to service_role;

create or replace function public.admin_reset_normal_score_list_internal(
  p_user_id uuid,
  p_mode text,
  p_level text,
  p_grade_level integer,
  p_question_count integer default null
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_deleted integer;
begin
  perform private.assert_admin_user(p_user_id);
  if p_mode not in ('addition', 'subtraction', 'multiplication', 'division')
    or p_level not in ('easy', 'medium', 'hard')
    or p_grade_level not between 1 and 8
  then
    raise exception 'INVALID_SCORE_LIST' using errcode = '22023';
  end if;
  delete from public.scores
  where game_type = 'normal'
    and mode = p_mode
    and level = p_level
    and grade_level = p_grade_level
    and (
      p_mode not in ('addition', 'subtraction')
      or question_count = p_question_count
    );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.admin_reset_normal_score_list_internal(uuid, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_reset_normal_score_list_internal(uuid, text, text, integer, integer) to service_role;

create or replace function public.admin_reset_school_battle_scores_internal(
  p_user_id uuid,
  p_mode text
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_deleted integer;
begin
  perform private.assert_admin_user(p_user_id);
  if p_mode not in ('addition', 'subtraction', 'multiplication', 'division') then
    raise exception 'INVALID_SCORE_LIST' using errcode = '22023';
  end if;
  delete from public.scores where game_type = 'school_battle' and mode = p_mode;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.admin_reset_school_battle_scores_internal(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_reset_school_battle_scores_internal(uuid, text) to service_role;
