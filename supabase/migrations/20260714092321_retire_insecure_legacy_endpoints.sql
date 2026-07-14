-- Apply only after the regnemester-api Edge Function and the matching client are live.
-- This closes every legacy PIN and client-trusted score entry point.

delete from public.app_settings where key = 'regnereisen_access_code';

drop policy if exists "Allow public read app settings" on public.app_settings;
drop policy if exists "Public read safe app settings" on public.app_settings;
create policy "Public read safe app settings"
on public.app_settings
for select
to anon, authenticated
using (key in (
  'school_battle_enabled',
  'announcement_enabled',
  'announcement_title',
  'announcement_message',
  'announcement_version'
));

drop policy if exists "Alle kan legge inn score" on public.scores;
drop policy if exists "Alle kan se highscore" on public.scores;
drop policy if exists "Public read scores" on public.scores;
create policy "Public read scores"
on public.scores
for select
to anon, authenticated
using (true);

revoke all on table public.app_settings from anon, authenticated;
grant select on table public.app_settings to anon, authenticated;
revoke all on table public.scores from anon, authenticated;
grant select on table public.scores to anon, authenticated;

drop policy if exists "No client access to school battle rounds" on public.school_battle_rounds;
create policy "No client access to school battle rounds"
on public.school_battle_rounds
for all
to anon, authenticated
using (false)
with check (false);

drop function if exists public.delete_normal_score(text, uuid);
drop function if exists public.delete_school_battle_score(text, uuid);
drop function if exists public.reset_normal_score_list(text, text, text, integer, integer);
drop function if exists public.reset_normal_score_list(text, text, text, integer);
drop function if exists public.reset_school_battle_scores(text, text);
drop function if exists public.reset_scores(text);
drop function if exists public.reset_scores_by_mode(text, text);
drop function if exists public.reset_scores_by_mode_and_grade(text, text, integer);
drop function if exists public.save_school_battle_score(text, integer, text, text);
drop function if exists public.save_school_battle_time_score(text, integer, text, text, text, integer);
drop function if exists public.save_time_score(text, integer, text, text, integer, integer);
drop function if exists public.save_top_score(text, integer, text, text, integer);
drop function if exists public.set_announcement_settings(boolean, text, text, text);
drop function if exists public.set_regnereisen_access_code(text, text);
drop function if exists public.set_school_battle_enabled(boolean, text);
drop function if exists public.validate_admin_pin(text);
