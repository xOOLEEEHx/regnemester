import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SCHOOL_BATTLE_MODES = new Set(["addition", "subtraction", "multiplication", "division"]);
const ADMIN_ACTIONS = new Set([
  "admin_status",
  "admin_set_school_battle",
  "admin_set_access_code",
  "admin_set_announcement",
  "admin_delete_score",
  "admin_reset_normal_scores",
  "admin_reset_school_scores",
]);

function allowedOrigin(origin: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && (url.hostname === "regnemester.vercel.app" || url.hostname.endsWith(".vercel.app"))) return true;
    return (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1") && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "https://regnemester.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(origin: string, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanErrorText(value: unknown, maxLength: number): string {
  return cleanText(value, maxLength)
    .replace(/([?&](?:token|key|code|email|name|school|authorization)=[^&#\s]*)/gi, "[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:bearer\s+)?[a-z0-9_-]{24,}\b/gi, "[redacted-token]")
    .replace(/\b(playerName|name|school|answers?|score|accessCode)\s*[:=]\s*[^,}\n]+/gi, "$1=[redacted]")
    .replace(/[A-Z]:\\Users\\[^\\\s]+/gi, "[redacted-path]")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function apiError(origin: string, status: number, code: string, message: string, retryable = false): Response {
  return json(origin, status, { error: message, code, retryable });
}

function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 0) return min;
  const maxUint = 0xffffffff;
  const limit = maxUint - (maxUint % range);
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return min + (values[0] % range);
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = randomInt(0, index);
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function makeOptions(correct: number, mode: string): number[] {
  const minimum = mode === "division" ? 1 : 0;
  const maximum = mode === "division" ? 10 : Math.max(20, correct + 20);
  const candidates = shuffle([
    correct - 10,
    correct + 10,
    correct - 4,
    correct - 3,
    correct - 2,
    correct - 1,
    correct + 1,
    correct + 2,
    correct + 3,
    correct + 4,
  ]);
  const wrongs = new Set<number>();
  for (const candidate of candidates) {
    if (candidate !== correct && candidate >= minimum && candidate <= maximum) wrongs.add(candidate);
    if (wrongs.size === 3) break;
  }
  while (wrongs.size < 3) {
    const candidate = randomInt(minimum, maximum);
    if (candidate !== correct) wrongs.add(candidate);
  }
  return shuffle([correct, ...wrongs]);
}

type Question = {
  mode: string;
  a: number;
  b: number;
  symbol: string;
  correct: number;
  options: number[];
};

function calculationQuestion(mode: "addition" | "subtraction", a: number, b: number): Question {
  const correct = mode === "addition" ? a + b : a - b;
  return { mode, a, b, symbol: mode === "addition" ? "+" : "−", correct, options: makeOptions(correct, mode) };
}

function schoolCalculationQuestion(mode: "addition" | "subtraction", gradeGroup: string, category: number): Question {
  if (gradeGroup === "middle") {
    if (mode === "addition") {
      if (category === 0) return calculationQuestion(mode, randomInt(20, 99), randomInt(20, 99));
      if (category === 1) {
        const a = randomInt(100, 900);
        return calculationQuestion(mode, a, randomInt(10, Math.min(99, 999 - a)));
      }
      if (category === 2) {
        const a = randomInt(100, 800);
        return calculationQuestion(mode, a, randomInt(100, Math.min(999 - a, 899)));
      }
      if (category === 3) {
        const a = randomInt(1, 9) * 100;
        return calculationQuestion(mode, a, randomInt(0, 10 - a / 100) * 100);
      }
      const a = randomInt(100, 900);
      return calculationQuestion(mode, a, randomInt(1, 999 - a));
    }
    if (category === 0) return calculationQuestion(mode, randomInt(40, 99), randomInt(20, 40));
    if (category === 1) {
      const a = randomInt(100, 999);
      return calculationQuestion(mode, a, randomInt(10, Math.min(99, a)));
    }
    if (category === 2) {
      const a = randomInt(200, 999);
      return calculationQuestion(mode, a, randomInt(100, a));
    }
    if (category === 3) {
      const a = randomInt(2, 10) * 100;
      return calculationQuestion(mode, a, randomInt(0, Math.floor(a / 100)) * 100);
    }
    const a = randomInt(100, 999);
    return calculationQuestion(mode, a, randomInt(1, a));
  }

  if (mode === "addition") {
    if (category === 0) {
      const a = randomInt(0, 10);
      return calculationQuestion(mode, a, randomInt(0, Math.min(9, 19 - a)));
    }
    if (category === 1) {
      const a = randomInt(5, 9);
      return calculationQuestion(mode, a, randomInt(10 - a, 10));
    }
    if (category === 2) {
      const a = randomInt(10, 95);
      return calculationQuestion(mode, a, randomInt(1, Math.min(9, 99 - a)));
    }
    if (category === 3) {
      const a = randomInt(1, 9) * 10;
      return calculationQuestion(mode, a, randomInt(0, 10 - a / 10) * 10);
    }
    const a = randomInt(10, 80);
    return calculationQuestion(mode, a, randomInt(10, 99 - a));
  }
  if (category === 0) {
    const a = randomInt(1, 20);
    return calculationQuestion(mode, a, randomInt(0, Math.min(10, a)));
  }
  if (category === 1) {
    const a = randomInt(11, 20);
    const minB = Math.min(a, (a % 10) + 1);
    return calculationQuestion(mode, a, randomInt(minB, Math.min(a, 9)));
  }
  if (category === 2) {
    const a = randomInt(10, 99);
    return calculationQuestion(mode, a, randomInt(1, Math.min(9, a)));
  }
  if (category === 3) {
    const a = randomInt(2, 10) * 10;
    return calculationQuestion(mode, a, randomInt(0, Math.floor(a / 10)) * 10);
  }
  const a = randomInt(20, 99);
  return calculationQuestion(mode, a, randomInt(10, a));
}

function createQuestion(mode: string, gradeGroup: string, index: number): Question {
  if (mode === "addition" || mode === "subtraction") return schoolCalculationQuestion(mode, gradeGroup, index % 5);
  if (mode === "division") {
    const divisor = randomInt(1, 10);
    const correct = randomInt(1, 10);
    return { mode, a: divisor * correct, b: divisor, symbol: "÷", correct, options: makeOptions(correct, mode) };
  }
  const a = randomInt(0, 10);
  const b = randomInt(0, 10);
  const correct = a * b;
  return { mode: "multiplication", a, b, symbol: "×", correct, options: makeOptions(correct, mode) };
}

function createQuestionDeck(mode: string, gradeGroup: string): Question[] {
  return Array.from({ length: 240 }, (_, index) => createQuestion(mode, gradeGroup, index));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function makeRateKey(req: Request): Promise<string> {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SUPABASE_SERVICE_ROLE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(address));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requireAdmin(req: Request): Promise<string | null> {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === SUPABASE_ANON_KEY) return null;
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: allowed, error: accessError } = await service.rpc("check_admin_user_internal", { p_user_id: data.user.id });
  return !accessError && allowed ? data.user.id : null;
}

function safeDatabaseMessage(error: { message?: string } | null): { status: number; code: string; message: string; retryable: boolean } {
  const message = error?.message ?? "";
  if (message.includes("RATE_LIMITED")) return { status: 429, code: "RATE_LIMITED", message: "For mange forsøk. Vent litt før du prøver igjen.", retryable: false };
  if (message.includes("SCHOOL_BATTLE_CLOSED")) return { status: 409, code: "SCHOOL_BATTLE_CLOSED", message: "Skolekampen er stengt akkurat nå.", retryable: false };
  if (message.includes("ROUND_EXPIRED")) return { status: 410, code: "ROUND_EXPIRED", message: "Runden er utløpt og kan ikke lagres.", retryable: false };
  if (message.includes("INVALID_ERROR_EVENT")) return { status: 400, code: "INVALID_ERROR_EVENT", message: "Ugyldig feilrapport.", retryable: false };
  if (message.includes("ROUND_NOT_FOUND") || message.includes("INVALID_")) return { status: 400, code: "INVALID_ROUND", message: "Runden kunne ikke verifiseres.", retryable: false };
  if (message.includes("ADMIN_REQUIRED")) return { status: 403, code: "ADMIN_REQUIRED", message: "Du har ikke administratortilgang.", retryable: false };
  return { status: 500, code: "SERVER_ERROR", message: "Tjenesten kunne ikke fullføre forespørselen.", retryable: true };
}

function databaseErrorResponse(origin: string, error: { message?: string } | null): Response {
  const safe = safeDatabaseMessage(error);
  return apiError(origin, safe.status, safe.code, safe.message, safe.retryable);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (!allowedOrigin(origin)) return apiError(origin, 403, "ORIGIN_NOT_ALLOWED", "Origin er ikke tillatt.");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return apiError(origin, 405, "METHOD_NOT_ALLOWED", "Kun POST er tillatt.");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return apiError(origin, 503, "SERVICE_UNAVAILABLE", "Tjenesten er ikke konfigurert.", true);

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > 65536) return apiError(origin, 413, "REQUEST_TOO_LARGE", "Forespørselen er for stor.");

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 65536) return apiError(origin, 413, "REQUEST_TOO_LARGE", "Forespørselen er for stor.");
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return apiError(origin, 400, "INVALID_JSON", "Ugyldig JSON.");
  }

  const action = cleanText(body.action, 64);
  if (!action) return apiError(origin, 400, "ACTION_REQUIRED", "Handling mangler.");
  try {
    if (action === "report_client_error") {
      const rawEvent = body.event && typeof body.event === "object" && !Array.isArray(body.event)
        ? body.event as Record<string, unknown>
        : null;
      if (!rawEvent) return apiError(origin, 400, "INVALID_ERROR_EVENT", "Ugyldig feilrapport.");
      const eventId = cleanText(rawEvent.id, 64);
      const category = cleanText(rawEvent.category, 64).toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const severity = cleanText(rawEvent.severity, 16);
      const message = cleanErrorText(rawEvent.message, 280);
      const stack = cleanErrorText(rawEvent.stack, 2_000);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId) || !category || !message || !["info", "warning", "error"].includes(severity)) {
        return apiError(origin, 400, "INVALID_ERROR_EVENT", "Ugyldig feilrapport.");
      }
      const rateKey = await makeRateKey(req);
      const { error } = await service.rpc("record_client_error_internal", {
        p_event_id: eventId,
        p_category: category,
        p_severity: severity,
        p_message: message,
        p_stack: stack,
        p_mode: cleanText(rawEvent.mode, 32),
        p_screen: cleanText(rawEvent.screen, 48),
        p_browser: cleanText(rawEvent.browser, 48),
        p_os: cleanText(rawEvent.os, 24),
        p_device: cleanText(rawEvent.device, 16),
        p_build: cleanText(rawEvent.build, 64),
        p_rate_key: rateKey,
      });
      if (error) return databaseErrorResponse(origin, error);
      return json(origin, 202, { accepted: true });
    }

    if (action === "start_school_battle_round") {
      const mode = cleanText(body.mode, 24);
      const playerName = cleanText(body.playerName, 32);
      const school = cleanText(body.school, 80);
      const gradeLevel = Number(body.gradeLevel);
      const gradeGroup = gradeLevel >= 5 ? "middle" : "small";
      if (!SCHOOL_BATTLE_MODES.has(mode) || !Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 7) {
        return apiError(origin, 400, "INVALID_ROUND", "Ugyldig spilloppsett.");
      }
      const questions = createQuestionDeck(mode, gradeGroup);
      const token = randomToken();
      const rateKey = await makeRateKey(req);
      const { error } = await service.rpc("create_school_battle_round_internal", {
        p_token: token,
        p_player_name: playerName,
        p_school: school,
        p_mode: mode,
        p_grade_level: gradeLevel,
        p_grade_group: gradeGroup,
        p_questions: questions,
        p_rate_key: rateKey,
      });
      if (error) {
        return databaseErrorResponse(origin, error);
      }
      return json(origin, 200, { token, questions });
    }

    if (action === "submit_school_battle_round") {
      const token = cleanText(body.token, 128);
      const answers = Array.isArray(body.answers) ? body.answers : null;
      if (!token || !answers || answers.length > 240 || answers.some((answer) => !Number.isInteger(answer))) {
        return apiError(origin, 400, "INVALID_ROUND", "Ugyldig svarliste.");
      }
      const rateKey = await makeRateKey(req);
      const { data, error } = await service.rpc("complete_school_battle_round_internal", {
        p_token: token,
        p_answers: answers,
        p_rate_key: rateKey,
      });
      if (error) {
        return databaseErrorResponse(origin, error);
      }
      return json(origin, 200, { result: data });
    }

    if (action === "verify_regnereisen_code") {
      const code = cleanText(body.code, 4);
      const rateKey = await makeRateKey(req);
      const { data, error } = await service.rpc("verify_regnereisen_access_code_internal", {
        p_code: code,
        p_rate_key: rateKey,
      });
      if (error) {
        return databaseErrorResponse(origin, error);
      }
      return json(origin, 200, { valid: Boolean(data) });
    }

    if (ADMIN_ACTIONS.has(action)) {
      const userId = await requireAdmin(req);
      if (!userId) return apiError(origin, 403, "ADMIN_REQUIRED", "Du har ikke administratortilgang.");
      if (action === "admin_status") return json(origin, 200, { isAdmin: true });

      let rpc = "";
      let params: Record<string, unknown> = { p_user_id: userId };
      if (action === "admin_set_school_battle") {
        rpc = "admin_set_school_battle_enabled_internal";
        params = { ...params, p_enabled: Boolean(body.enabled) };
      } else if (action === "admin_set_access_code") {
        rpc = "admin_set_regnereisen_access_code_internal";
        params = { ...params, p_access_code: cleanText(body.code, 4) };
      } else if (action === "admin_set_announcement") {
        rpc = "admin_set_announcement_internal";
        params = {
          ...params,
          p_enabled: Boolean(body.enabled),
          p_title: cleanText(body.title, 80),
          p_message: cleanText(body.message, 280),
        };
      } else if (action === "admin_delete_score") {
        rpc = "admin_delete_score_internal";
        params = { ...params, p_score_id: cleanText(body.scoreId, 64) };
      } else if (action === "admin_reset_normal_scores") {
        rpc = "admin_reset_normal_score_list_internal";
        params = {
          ...params,
          p_mode: cleanText(body.mode, 24),
          p_level: cleanText(body.level, 16),
          p_grade_level: Number(body.gradeLevel),
          p_question_count: body.questionCount == null ? null : Number(body.questionCount),
        };
      } else if (action === "admin_reset_school_scores") {
        rpc = "admin_reset_school_battle_scores_internal";
        params = { ...params, p_mode: cleanText(body.mode, 24) };
      }

      const { data, error } = await service.rpc(rpc, params);
      if (error) {
        return databaseErrorResponse(origin, error);
      }
      return json(origin, 200, { ok: true, result: data });
    }

    return apiError(origin, 404, "UNKNOWN_ACTION", "Ukjent handling.");
  } catch {
    return apiError(origin, 500, "SERVER_ERROR", "Tjenesten kunne ikke fullføre forespørselen.", true);
  }
});
