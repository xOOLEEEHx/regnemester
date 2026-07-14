const ERROR_REPORT_ACTION = "report_client_error";
const DEDUPE_WINDOW_MS = 60_000;
const MAX_REPORTS_PER_SESSION = 20;
const REPORT_TIMEOUT_MS = 5_000;

const recentReports = new Map();
let reportsSent = 0;
let monitoringContext = { mode: "unknown", screen: "unknown" };
let monitoringInitialized = false;

function getEnvironment() {
  return import.meta.env || {};
}

function redactSensitiveText(value) {
  return String(value || "")
    .replace(/([?&](?:token|key|code|email|name|school|authorization)=[^&#\s]*)/gi, "[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:bearer\s+)?[a-z0-9_-]{24,}\b/gi, "[redacted-token]")
    .replace(/\b(playerName|name|school|answers?|score|accessCode)\s*[:=]\s*[^,}\n]+/gi, "$1=[redacted]")
    .replace(/[A-Z]:\\Users\\[^\\\s]+/gi, "[redacted-path]")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeErrorMessage(value, maxLength = 280) {
  return redactSensitiveText(value || "Ukjent teknisk feil.").slice(0, maxLength);
}

export function sanitizeErrorStack(value, maxLength = 2_000) {
  if (!value) return "";
  return String(value)
    .split("\n")
    .slice(0, 10)
    .map((line) => redactSensitiveText(line).replace(/https?:\/\/[^\s)]+/gi, (url) => url.split(/[?#]/)[0]))
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function detectBrowser() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const match = ua.match(/(?:Edg|Chrome|CriOS|Firefox|FxiOS|Version)\/(\d+)/i);
  if (/Edg\//i.test(ua)) return `Edge ${match?.[1] || ""}`.trim();
  if (/Firefox|FxiOS/i.test(ua)) return `Firefox ${match?.[1] || ""}`.trim();
  if (/CriOS|Chrome/i.test(ua)) return `Chrome ${match?.[1] || ""}`.trim();
  if (/Safari/i.test(ua)) return `Safari ${match?.[1] || ""}`.trim();
  return "other";
}

function detectPlatform() {
  if (typeof navigator === "undefined") return { os: "unknown", device: "unknown" };
  const ua = navigator.userAgent || "";
  const os = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS|Macintosh/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "other";
  const device = /iPad|Tablet/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua)
      ? "mobile"
      : "desktop";
  return { os, device };
}

function makeEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function normalizeCategory(value) {
  const category = String(value || "runtime_error").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return category.slice(0, 64) || "runtime_error";
}

function shouldSend(event) {
  const now = Date.now();
  const key = `${event.category}|${event.message}|${event.mode}|${event.screen}`;
  const previous = recentReports.get(key) || 0;
  if (now - previous < DEDUPE_WINDOW_MS || reportsSent >= MAX_REPORTS_PER_SESSION) return false;
  recentReports.set(key, now);
  reportsSent += 1;
  for (const [storedKey, timestamp] of recentReports) {
    if (now - timestamp > DEDUPE_WINDOW_MS * 2) recentReports.delete(storedKey);
  }
  return true;
}

async function sendEvent(event) {
  const env = getEnvironment();
  if (!env.PROD || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || typeof fetch !== "function") return false;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS) : null;
  try {
    await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/regnemester-api`, {
      method: "POST",
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: ERROR_REPORT_ACTION, event }),
      keepalive: true,
      signal: controller?.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function setErrorMonitoringContext(context = {}) {
  monitoringContext = {
    mode: String(context.mode || monitoringContext.mode || "unknown").slice(0, 32),
    screen: String(context.screen || monitoringContext.screen || "unknown").slice(0, 48),
  };
}

export function reportTechnicalError(error, options = {}) {
  try {
    const platform = detectPlatform();
    const event = {
      id: makeEventId(),
      category: normalizeCategory(options.category),
      severity: ["info", "warning", "error"].includes(options.severity) ? options.severity : "error",
      message: sanitizeErrorMessage(error?.message || error),
      stack: sanitizeErrorStack(options.stack || error?.stack),
      mode: String(options.mode || monitoringContext.mode || "unknown").slice(0, 32),
      screen: String(options.screen || monitoringContext.screen || "unknown").slice(0, 48),
      browser: detectBrowser().slice(0, 48),
      os: platform.os,
      device: platform.device,
      build: String(getEnvironment().VITE_APP_VERSION || "").slice(0, 64),
    };
    if (!shouldSend(event)) return false;
    void sendEvent(event);
    return true;
  } catch {
    return false;
  }
}

export function reportTechnicalEvent(category, message, options = {}) {
  return reportTechnicalError(new Error(message), { ...options, category });
}

export function initializeErrorMonitoring() {
  if (monitoringInitialized || typeof window === "undefined") return () => {};
  monitoringInitialized = true;
  const handleError = (event) => {
    reportTechnicalError(event.error || new Error(event.message || "Ukjent JavaScript-feil."), {
      category: "javascript_runtime_error",
    });
  };
  const handleRejection = (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error("Ubehandlet Promise-feil.");
    reportTechnicalError(reason, { category: "unhandled_promise_rejection" });
  };
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    monitoringInitialized = false;
  };
}
