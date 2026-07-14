import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { reportTechnicalError, sanitizeErrorMessage, sanitizeErrorStack } from "../src/errorMonitoring.mjs";
import { classifyScoreSubmissionError, RegnemesterApiError } from "../src/scoreSubmission.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("scorefeil retryes bare når de er midlertidige", () => {
  for (const error of [
    new RegnemesterApiError("offline", { code: "OFFLINE", retryable: true }),
    new RegnemesterApiError("timeout", { code: "REQUEST_TIMEOUT", status: 408, retryable: true }),
    new RegnemesterApiError("server", { code: "SERVER_ERROR", status: 503, retryable: true }),
  ]) {
    assert.equal(classifyScoreSubmissionError(error, { online: true }).retryable, true);
  }

  for (const error of [
    new RegnemesterApiError("closed", { code: "SCHOOL_BATTLE_CLOSED", status: 409 }),
    new RegnemesterApiError("expired", { code: "ROUND_EXPIRED", status: 410 }),
    new RegnemesterApiError("invalid", { code: "INVALID_ROUND", status: 400 }),
    new RegnemesterApiError("limited", { code: "RATE_LIMITED", status: 429 }),
    new RegnemesterApiError("unknown", { code: "UNKNOWN_ERROR" }),
  ]) {
    assert.equal(classifyScoreSubmissionError(error, { online: true }).retryable, false);
  }
});

test("kjente scorefeil gir egne brukerrettede meldinger", () => {
  assert.match(classifyScoreSubmissionError(new RegnemesterApiError("x", { code: "OFFLINE" }), { online: false }).message, /Ingen internettforbindelse/);
  assert.match(classifyScoreSubmissionError(new RegnemesterApiError("x", { code: "REQUEST_TIMEOUT" }), { online: true }).message, /Serveren svarer ikke/);
  assert.match(classifyScoreSubmissionError(new RegnemesterApiError("x", { code: "SCHOOL_BATTLE_CLOSED" }), { online: true }).message, /Skolekampen ble stengt/);
  assert.match(classifyScoreSubmissionError(new RegnemesterApiError("x", { code: "ROUND_EXPIRED" }), { online: true }).message, /utløpt/);
  assert.match(classifyScoreSubmissionError(new RegnemesterApiError("x", { code: "INVALID_ROUND" }), { online: true }).message, /kunne ikke godkjennes/);
});

test("feilrapportering redigerer bort elevdata og tekniske hemmeligheter", () => {
  const source = "playerName=Ole, school=Sol skole, score=42, email=ole@example.no, token=abcdefghijklmnopqrstuvwxyz123456";
  const message = sanitizeErrorMessage(source);
  const stack = sanitizeErrorStack(`Error: ${source}\n at save (https://example.no/app.js?token=secret)`);
  for (const sensitive of ["Ole", "Sol skole", "42", "ole@example.no", "abcdefghijklmnopqrstuvwxyz123456", "?token=secret"]) {
    assert.equal(message.includes(sensitive), false);
    assert.equal(stack.includes(sensitive), false);
  }
});

test("identiske feil dedupliseres og loggeren kaster ikke", () => {
  const error = new Error("dedupe-test-unik");
  assert.doesNotThrow(() => reportTechnicalError(error, { category: "test_error" }));
  assert.equal(reportTechnicalError(error, { category: "test_error" }), false);
});

test("feillogging går via Edge Function til privat service-role-grense", async () => {
  const client = await read("src/errorMonitoring.mjs");
  const edge = await read("supabase/functions/regnemester-api/index.ts");
  const migration = await read("supabase/migrations/20260714173740_add_private_error_monitoring_and_retry_status.sql");

  assert.match(client, /action:\s*ERROR_REPORT_ACTION/);
  assert.match(edge, /action === "report_client_error"/);
  assert.match(edge, /cleanErrorText/);
  assert.match(edge, /record_client_error_internal/);
  assert.match(migration, /create table if not exists private\.client_error_events/i);
  assert.match(migration, /client_error_event', 30, interval '10 minutes'/i);
  assert.match(migration, /revoke all on table private\.client_error_events from public, anon, authenticated, service_role/i);
  assert.match(migration, /grant execute[\s\S]+to service_role/i);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete|all)[^;]+to (?:anon|authenticated)/i);
});

test("samme ferdige Skolekampen-runde er fortsatt idempotent", async () => {
  const client = await read("src/App.jsx");
  const foundation = await read("supabase/migrations/20260713113634_secure_admin_scores_and_settings.sql");
  const migration = await read("supabase/migrations/20260714173740_add_private_error_monitoring_and_retry_status.sql");
  assert.match(client, /const HIGHSCORE_RETRY_DELAYS_MS = \[0, 1500, 4000\]/);
  assert.match(client, /token: entry\.roundToken,\s+answers: entry\.answers/);
  assert.match(client, /if \(!classification\.retryable\) \{\s+removePendingHighscore/);
  assert.match(client, /saveResult\?\.alreadySaved/);
  assert.match(foundation, /if v_round\.used_at is not null then\s+return v_round\.result;/i);
  assert.match(migration, /if v_used_at is not null then[\s\S]+alreadySaved', true/i);
  assert.match(migration, /complete_school_battle_round_unchecked_internal[\s\S]+alreadySaved', false/i);
  assert.match(migration, /school_round_submit', 30, interval '1 minute'/i);
});
