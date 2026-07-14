export class RegnemesterApiError extends Error {
  constructor(message, options = {}) {
    super(message || "Tjenesten svarte med en feil.");
    this.name = "RegnemesterApiError";
    this.code = String(options.code || "UNKNOWN_ERROR");
    this.status = Number(options.status || 0);
    this.retryable = Boolean(options.retryable);
  }
}

function isOnline(options = {}) {
  if (typeof options.online === "boolean") return options.online;
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function classifyScoreSubmissionError(error, options = {}) {
  const code = String(error?.code || "UNKNOWN_ERROR").toUpperCase();
  const status = Number(error?.status || 0);
  if (!isOnline(options) || code === "OFFLINE") {
    return {
      kind: "offline",
      category: "score_network_error",
      retryable: true,
      message: "Ingen internettforbindelse. Kontroller nettet og prøv igjen. Resultatet er bevart på denne enheten.",
    };
  }
  if (code === "REQUEST_TIMEOUT" || status === 408) {
    return {
      kind: "timeout",
      category: "score_timeout",
      retryable: true,
      message: "Serveren svarer ikke akkurat nå. Resultatet er bevart, og appen prøver å lagre det på nytt.",
    };
  }
  if (["NETWORK_ERROR", "FUNCTIONS_FETCH_ERROR"].includes(code)) {
    return {
      kind: "network",
      category: "score_network_error",
      retryable: true,
      message: "Nettverksforbindelsen ble brutt. Resultatet er bevart, og appen prøver å lagre det på nytt.",
    };
  }
  if (code === "SCHOOL_BATTLE_CLOSED") {
    return {
      kind: "school_closed",
      category: "score_school_battle_closed",
      retryable: false,
      message: "Skolekampen ble stengt før runden var ferdig.\nResultatet ble derfor ikke lagret.",
    };
  }
  if (code === "ROUND_EXPIRED") {
    return {
      kind: "expired_round",
      category: "score_invalid_round",
      retryable: false,
      message: "Runden er utløpt og kunne ikke godkjennes. Resultatet ble ikke lagret.",
    };
  }
  if (["INVALID_ROUND", "ROUND_NOT_FOUND", "INVALID_SUBMISSION", "INVALID_SUBMISSION_PACING", "INVALID_ANSWER_COUNT", "INVALID_ANSWER"].includes(code) || status === 400) {
    return {
      kind: "invalid_round",
      category: "score_invalid_round",
      retryable: false,
      message: "Runden kunne ikke godkjennes av serveren. Resultatet ble ikke lagret.",
    };
  }
  if (code === "RATE_LIMITED" || status === 429) {
    return {
      kind: "rate_limited",
      category: "score_rate_limited",
      retryable: false,
      message: "For mange lagringsforsøk på kort tid. Resultatet kunne ikke lagres.",
    };
  }
  if (error?.retryable || ["SERVER_ERROR", "SERVICE_UNAVAILABLE", "FUNCTIONS_RELAY_ERROR"].includes(code) || status >= 500) {
    return {
      kind: "server",
      category: "score_server_error",
      retryable: true,
      message: "Serveren har en midlertidig feil. Resultatet er bevart, og appen prøver å lagre det på nytt.",
    };
  }
  return {
    kind: "unknown",
    category: "score_unknown_error",
    retryable: false,
    message: "Resultatet kunne ikke lagres på grunn av en ukjent feil.",
  };
}
