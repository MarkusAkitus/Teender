// Sistema de moderacion inteligente sin dependencias externas

// Configuracion de umbrales
const BOT_SCORE_THRESHOLD = 6;
const TOXICITY_THRESHOLD = 3;
const FAKE_PROFILE_THRESHOLD = 0.6;
const SPAM_THRESHOLD = 0.6;

const RISK_SAFE_MAX = 30;
const RISK_SUSPICIOUS_MAX = 60;
const RISK_DANGEROUS_MAX = 100;

// Palabras prohibidas (minimo 20)
const BANNED_WORDS = [
  "idiota",
  "imbecil",
  "estupido",
  "tonto",
  "puta",
  "puto",
  "mierda",
  "cabr*n",
  "gilipollas",
  "pendejo",
  "maricon",
  "zorra",
  "perra",
  "maldito",
  "asco",
  "nazi",
  "violacion",
  "matar",
  "golpear",
  "droga",
  "porno",
  "sexo",
];

// Patrones regex requeridos
const REGEX = {
  url: /https?:\/\/[^\s]+/i,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
  suspiciousName: /\d{4,}/,
  allCaps: /[A-ZÁÉÍÓÚÑ]{6,}/,
};

// Utilidad para logs internos
function logEvent(store, entry) {
  store.push({
    at: new Date().toISOString(),
    ...entry,
  });
  if (store.length > 200) store.shift();
}

export class ModerationSystem {
  constructor() {
    this.logs = [];
  }

  // DETECCION DE BOTS
  detectBotBehavior(user) {
    const reasons = [];
    let score = 0;

    const likesPerHour = user?.activity?.likesPerHour || 0;
    const messagesPerHour = user?.activity?.messagesPerHour || 0;
    const accountAgeHours = user?.activity?.accountAgeHours || 0;
    const responseTimeSec = user?.activity?.avgResponseTimeSec || 9999;

    if (likesPerHour > 80) {
      score += 2;
      reasons.push("likes excesivos");
    }
    if (messagesPerHour > 60) {
      score += 2;
      reasons.push("mensajes excesivos");
    }
    if (accountAgeHours < 6) {
      score += 1;
      reasons.push("cuenta muy nueva");
    }
    if (responseTimeSec < 5) {
      score += 1;
      reasons.push("respuestas demasiado rapidas");
    }

    const isBot = score >= BOT_SCORE_THRESHOLD;
    logEvent(this.logs, { type: "bot_check", userId: user?.id, score, reasons });
    return { isBot, score, reasons };
  }

  // ANALISIS DE TOXICIDAD EN MENSAJES
  analyzeMessage(text) {
    const flags = [];
    let severity = 0;
    const lower = String(text || "").toLowerCase();

    if (REGEX.url.test(text)) {
      flags.push("url");
      severity += 1;
    }
    if (REGEX.email.test(text)) {
      flags.push("email");
      severity += 1;
    }
    if (REGEX.phone.test(text)) {
      flags.push("telefono");
      severity += 1;
    }
    if (REGEX.allCaps.test(text)) {
      flags.push("mayusculas");
      severity += 1;
    }

    const badWord = BANNED_WORDS.find((word) => lower.includes(word));
    if (badWord) {
      flags.push("lenguaje_ofensivo");
      severity += 2;
    }

    const isToxic = severity >= TOXICITY_THRESHOLD;
    logEvent(this.logs, { type: "message_check", isToxic, severity, flags });
    return { isToxic, severity, flags };
  }

  // DETECCION DE PERFILES FALSOS
  analyzeFakeProfile(profile) {
    let probability = 0;
    const warnings = [];

    if (!profile?.avatarUrl) {
      probability += 0.2;
      warnings.push("sin_foto");
    }
    if (!profile?.bio || profile.bio.length < 12) {
      probability += 0.2;
      warnings.push("bio_corta");
    }
    if (REGEX.suspiciousName.test(profile?.name || "")) {
      probability += 0.2;
      warnings.push("nombre_sospechoso");
    }

    const activity = profile?.activity || {};
    if ((activity.accountAgeHours || 0) < 12 && (activity.likesPerHour || 0) > 50) {
      probability += 0.2;
      warnings.push("actividad_anormal");
    }

    const isFake = probability >= FAKE_PROFILE_THRESHOLD;
    logEvent(this.logs, { type: "profile_check", isFake, probability, warnings });
    return { isFake, probability, warnings };
  }

  // DETECCION DE SPAM
  detectSpam(messages = []) {
    const recent = messages.slice(-10).map((m) => String(m.text || ""));
    const frequency = {};
    recent.forEach((msg) => {
      frequency[msg] = (frequency[msg] || 0) + 1;
    });

    const maxRepeat = Math.max(0, ...Object.values(frequency));
    const repeatedMsg = Object.keys(frequency).find((k) => frequency[k] === maxRepeat) || "";

    const timestamps = messages.slice(-10).map((m) => m.timeMs || 0);
    const isBurst =
      timestamps.length >= 3 &&
      Math.max(...timestamps) - Math.min(...timestamps) < 60 * 1000;

    const confidence =
      (maxRepeat >= 3 ? 0.6 : 0) + (isBurst ? 0.3 : 0) + (maxRepeat >= 5 ? 0.1 : 0);
    const isSpam = confidence >= SPAM_THRESHOLD;
    const pattern = repeatedMsg || (isBurst ? "burst" : "none");

    logEvent(this.logs, { type: "spam_check", isSpam, confidence, pattern });
    return { isSpam, confidence, pattern };
  }

  // SISTEMA DE PUNTUACION GENERAL
  calculateRiskScore(user, activity = {}) {
    const bot = this.detectBotBehavior({ ...user, activity });
    const fake = this.analyzeFakeProfile({ ...user, activity });
    const spam = this.detectSpam(activity.recentMessages || []);

    let score = 0;
    score += bot.score * 6;
    score += fake.probability * 30;
    score += spam.confidence * 40;

    score = Math.min(100, Math.round(score));
    let level = "seguro";
    if (score > RISK_SUSPICIOUS_MAX) level = "peligroso";
    else if (score > RISK_SAFE_MAX) level = "sospechoso";

    logEvent(this.logs, { type: "risk_score", score, level, userId: user?.id });
    return { score, level };
  }

  // ACCIONES AUTOMATICAS
  handleViolation(user, violation) {
    const score = violation?.score ?? violation?.severity ?? 0;

    if (score <= RISK_SAFE_MAX) {
      return { action: "none" };
    }
    if (score <= RISK_SUSPICIOUS_MAX) {
      logEvent(this.logs, { type: "action", action: "warning", userId: user?.id });
      return { action: "warning" };
    }
    if (score <= 80) {
      logEvent(this.logs, { type: "action", action: "temp_restrict", userId: user?.id });
      return { action: "temp_restrict", durationMinutes: 60 };
    }
    logEvent(this.logs, { type: "action", action: "block", userId: user?.id });
    return { action: "block" };
  }

  // MONITOREO EN TIEMPO REAL
  startMonitoring() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      logEvent(this.logs, { type: "monitor_tick" });
    }, 30000);
  }
}

