import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("klienten inneholder ingen offentlig admin-PIN eller legacy-RPC", async () => {
  const source = await read("src/App.jsx");
  const prohibited = [
    "VITE_ADMIN_PIN",
    "ADMIN_PIN_FALLBACK",
    "validate_admin_pin",
    'rpc("save_top_score"',
    'rpc("save_time_score"',
    'rpc("save_school_battle_score"',
    'rpc("save_school_battle_time_score"',
    'rpc("delete_normal_score"',
    'rpc("delete_school_battle_score"',
    '.from("scores").insert',
    '.from("scores").delete',
  ];
  for (const value of prohibited) assert.equal(source.includes(value), false, `${value} skal ikke finnes i klienten`);
  assert.match(source, /start_school_battle_round/);
  assert.match(source, /submit_school_battle_round/);
  assert.match(source, /schoolBattleAnswers/);
  assert.match(source, /shouldCreateUser:\s*false/);
});

test("miljømalen inneholder bare offentlige Supabase-verdier", async () => {
  const env = await read(".env.example");
  assert.match(env, /VITE_SUPABASE_URL/);
  assert.match(env, /VITE_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(env, /PIN|SERVICE_ROLE|SECRET/i);
});

test("databasegrensen tilbakekaller legacy-tilgang og direkte tabellskriving", async () => {
  const foundation = await read("supabase/migrations/20260713113634_secure_admin_scores_and_settings.sql");
  const pacing = await read("supabase/migrations/20260713114554_guard_school_battle_round_pacing.sql");
  const retirement = await read("supabase/migrations/20260714092321_retire_insecure_legacy_endpoints.sql");
  assert.match(foundation, /complete_school_battle_round_internal/);
  assert.match(foundation, /jsonb_array_elements\(p_answers\)/);
  assert.match(foundation, /grant execute[\s\S]+to service_role/i);
  assert.match(pacing, /p_answer_count > \(v_elapsed_seconds \* 4\) \+ 2/);
  assert.match(pacing, /complete_school_battle_round_unchecked_internal/);
  assert.match(retirement, /revoke all on table public\.scores from anon, authenticated/i);
  assert.match(retirement, /grant select on table public\.scores to anon, authenticated/i);
  assert.match(retirement, /create policy "No client access to school battle rounds"/i);
  assert.doesNotMatch(retirement, /revoke all on function public\.(?:save|reset|delete|validate_admin_pin)/i);
  for (const name of [
    "reset_scores",
    "reset_scores_by_mode",
    "save_top_score",
    "save_time_score",
    "save_school_battle_score",
    "save_school_battle_time_score",
    "validate_admin_pin",
  ]) {
    assert.match(retirement, new RegExp(`drop function if exists public\\.${name}\\(`, "i"));
  }
});

test("Vercel-konfigurasjonen har sikkerhetsheadere og immutable asset-cache", async () => {
  const config = JSON.parse(await read("vercel.json"));
  const headers = config.headers[0].headers.map(({ key }) => key);
  for (const name of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.ok(headers.includes(name), `${name} mangler`);
  }
  assert.equal(config.headers[1].source, "/assets/(.*)");
  assert.match(config.headers[1].headers[0].value, /immutable/);
});
