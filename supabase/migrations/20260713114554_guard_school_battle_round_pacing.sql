-- Reject machine-speed submissions while preserving idempotent retries.
-- The existing scorer remains unchanged and is wrapped atomically in this migration.

alter function public.complete_school_battle_round_internal(text, jsonb, text)
rename to complete_school_battle_round_unchecked_internal;

create or replace function public.validate_school_battle_round_pacing_internal(
  p_token text,
  p_answer_count integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_started_at timestamptz;
  v_expires_at timestamptz;
  v_used_at timestamptz;
  v_elapsed_seconds integer;
begin
  if coalesce(length(p_token), 0) < 32
    or p_answer_count < 1
    or p_answer_count > 240
  then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  select started_at, expires_at, used_at
  into v_started_at, v_expires_at, v_used_at
  from public.school_battle_rounds
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if not found then
    raise exception 'ROUND_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_used_at is not null then
    return;
  end if;
  if v_expires_at <= clock_timestamp() then
    raise exception 'ROUND_EXPIRED' using errcode = 'P0001';
  end if;

  v_elapsed_seconds := greatest(
    0,
    floor(extract(epoch from (clock_timestamp() - v_started_at)))::integer
  );

  -- Four recorded answers per second plus a two-answer input allowance is
  -- above realistic child play, but blocks instant scripted submissions.
  if p_answer_count > (v_elapsed_seconds * 4) + 2 then
    raise exception 'INVALID_SUBMISSION_PACING' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.validate_school_battle_round_pacing_internal(text, integer) from public, anon, authenticated;
grant execute on function public.validate_school_battle_round_pacing_internal(text, integer) to service_role;

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
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'INVALID_SUBMISSION' using errcode = '22023';
  end if;

  perform public.validate_school_battle_round_pacing_internal(
    p_token,
    jsonb_array_length(p_answers)
  );

  return public.complete_school_battle_round_unchecked_internal(
    p_token,
    p_answers,
    p_rate_key
  );
end;
$$;

revoke all on function public.complete_school_battle_round_internal(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.complete_school_battle_round_internal(text, jsonb, text) to service_role;

revoke all on function public.complete_school_battle_round_unchecked_internal(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.complete_school_battle_round_unchecked_internal(text, jsonb, text) to service_role;
