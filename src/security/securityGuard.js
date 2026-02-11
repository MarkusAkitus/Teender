// SecurityGuard: sistema de ciberseguridad avanzado sin dependencias externas
// Nota: diseñado para ser no invasivo, con bajos falsos positivos y alto rendimiento.

export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_TIMEOUT_MINUTES: 15,
  MAX_REQUESTS_PER_MINUTE: 100,
  DDOS_THRESHOLD: 500,
  SESSION_TIMEOUT_HOURS: 24,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_FILE_TYPES: ["jpg", "jpeg", "png", "gif"],
  IP_CHANGE_ALERT_THRESHOLD: 3,
  RATE_LIMITS: {
    login: { max: 5, window: 900000 },
    register: { max: 3, window: 3600000 },
    messages: { max: 50, window: 60000 },
    likes: { max: 100, window: 3600000 },
    upload: { max: 10, window: 3600000 },
  },
  BLOCKED_PATTERNS: [
    /(\bSELECT\b|\bDROP\b|\bUNION\b|\bINSERT\b|\bDELETE\b)/i,
    /('|--|;|\/\*|\*\/)/,
    /(<script|javascript:|onerror=|onload=)/i,
    /(\.\.\/|\.\.\\|\/etc\/passwd)/i,
  ],
};

export const THREAT_PATTERNS = {
  sqlInjection: [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(UNION.*SELECT)/i,
    /(DROP.*TABLE)/i,
  ],
  xss: [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ],
  suspiciousUserAgents: [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i],
};

const BANNED_WORDS = [
  "idiota",
  "imbecil",
  "estupido",
  "tonto",
  "puta",
  "puto",
  "mierda",
  "cabron",
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

const REGEX = {
  url: /https?:\/\/[^\s]+/i,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
  suspiciousName: /\d{4,}/,
  allCaps: /[A-ZÁÉÍÓÚÑ]{6,}/,
};

function now() {
  return Date.now();
}

function minutes(ms) {
  return ms / 60000;
}

function safeLower(value) {
  return String(value || "").toLowerCase();
}

function createLogEntry(event) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...event,
  };
}

// Log rotativo simple en memoria + opcional a disco (Node)
class RotatingLogger {
  constructor(maxBytes = 100 * 1024 * 1024) {
    this.maxBytes = maxBytes;
    this.files = [[]];
    this.currentSize = 0;
  }

  append(entry) {
    const serialized = JSON.stringify(entry) + "\n";
    this.currentSize += serialized.length;
    if (this.currentSize > this.maxBytes) {
      this.files.push([]);
      this.currentSize = serialized.length;
    }
    this.files[this.files.length - 1].push(serialized);
  }

  flushToDisk(pathPrefix = "security-log") {
    // Si se ejecuta en Node, intenta escribir. En browser se ignora.
    try {
      // eslint-disable-next-line no-undef
      const fs = require("fs");
      this.files.forEach((chunk, index) => {
        fs.writeFileSync(`${pathPrefix}-${index + 1}.log`, chunk.join(""), "utf8");
      });
    } catch (error) {
      // Sin filesystem: se ignora.
    }
  }
}

export class SecurityGuard {
  constructor() {
    this.ipTracking = {};
    this.sessionTracking = {};
    this.alerts = [];
    this.logger = new RotatingLogger();
    this.whitelist = new Set();
    this.blacklist = new Set();
    this._monitorTimer = null;
    this._reportTimer = null;
  }

  // 1. MONITOREO DE IPS
  trackIP(ip, userId, action) {
    const entry = this.ipTracking[ip] || {
      firstSeen: now(),
      lastSeen: now(),
      requestCount: 0,
      failedLogins: 0,
      users: new Set(),
      blocked: false,
      blockedUntil: null,
      riskScore: 0,
      ipChangesByUser: {},
    };

    entry.requestCount += 1;
    entry.lastSeen = now();
    if (userId) entry.users.add(userId);

    // detectar multiples cuentas desde misma IP
    let riskLevel = 0;
    let reason = "";
    if (entry.users.size >= 4) {
      riskLevel = 40;
      reason = "Multiples cuentas desde misma IP";
    }

    // detectar cambios frecuentes de IP por usuario (a nivel simple)
    if (userId) {
      entry.ipChangesByUser[userId] = (entry.ipChangesByUser[userId] || 0) + 1;
      if (entry.ipChangesByUser[userId] >= SECURITY_CONFIG.IP_CHANGE_ALERT_THRESHOLD) {
        riskLevel = Math.max(riskLevel, 50);
        reason = reason || "Cambios frecuentes de IP";
      }
    }

    this.ipTracking[ip] = entry;
    const isSuspicious = riskLevel >= 30;
    this.logSecurityEvent({
      type: "ip_track",
      ip,
      userId,
      action,
      riskLevel,
      reason,
    });
    return { isSuspicious, reason, riskLevel };
  }

  // 2. DETECCION DE FUERZA BRUTA
  detectBruteForce(ip, endpoint) {
    const entry = this.ipTracking[ip] || { failedLogins: 0, blockedUntil: null, lastSeen: now() };
    const limit = SECURITY_CONFIG.RATE_LIMITS.login;
    const cutoff = now() - limit.window;

    entry.failedLoginsTimestamps = (entry.failedLoginsTimestamps || []).filter((t) => t > cutoff);
    entry.failedLoginsTimestamps.push(now());
    entry.failedLogins = entry.failedLoginsTimestamps.length;

    let blockedUntil = entry.blockedUntil;
    if (entry.failedLogins >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      blockedUntil = now() + SECURITY_CONFIG.LOGIN_TIMEOUT_MINUTES * 60000;
      entry.blockedUntil = blockedUntil;
      this.blacklist.add(ip);
    }

    this.ipTracking[ip] = entry;
    const isAttack = Boolean(blockedUntil && blockedUntil > now());
    this.logSecurityEvent({
      type: "bruteforce_check",
      ip,
      endpoint,
      attemptsCount: entry.failedLogins,
      blockedUntil,
    });
    return { isAttack, attemptsCount: entry.failedLogins, blockedUntil };
  }

  // 3. DETECCION DE DDOS
  detectDDoS(ip) {
    const entry = this.ipTracking[ip] || { requestCount: 0, lastSeen: now() };
    const elapsedMinutes = Math.max(1, minutes(now() - (entry.lastSeen || now())));
    const rpm = Math.round(entry.requestCount / elapsedMinutes);

    let action = "none";
    if (rpm >= SECURITY_CONFIG.DDOS_THRESHOLD) action = "block";
    else if (rpm >= 200) action = "throttle";
    else if (rpm >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) action = "warn";

    const isDDoS = action === "block";
    this.logSecurityEvent({ type: "ddos_check", ip, requestsPerMinute: rpm, action });
    return { isDDoS, requestsPerMinute: rpm, action };
  }

  // 4. VALIDACION DE PETICIONES
  validateRequest(req) {
    const threats = [];
    const payload = JSON.stringify(req?.body || {});
    const path = req?.path || "";
    const combined = `${payload} ${path}`;

    SECURITY_CONFIG.BLOCKED_PATTERNS.forEach((pattern) => {
      if (pattern.test(combined)) threats.push("blocked_pattern");
    });

    THREAT_PATTERNS.sqlInjection.forEach((pattern) => {
      if (pattern.test(combined)) threats.push("sql_injection");
    });
    THREAT_PATTERNS.xss.forEach((pattern) => {
      if (pattern.test(combined)) threats.push("xss");
    });

    const sanitized = { ...(req?.body || {}) };
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitized[key]
          .replace(/<script.*?>.*?<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+=/gi, "");
      }
    });

    const isValid = threats.length === 0;
    this.logSecurityEvent({ type: "request_validate", threats, path });
    return { isValid, threats, sanitized };
  }

  // 5. ANOMALIAS
  detectAnomalies(user, activity) {
    let severity = 0;
    let anomalyType = "";

    if (activity?.country && user?.lastCountry && activity.country !== user.lastCountry) {
      severity += 2;
      anomalyType = "country_change";
    }
    if (activity?.hour && (activity.hour < 5 || activity.hour > 2)) {
      severity += 1;
      anomalyType = anomalyType || "unusual_hours";
    }
    if (activity?.actionsPerMinute > 80) {
      severity += 2;
      anomalyType = anomalyType || "sudden_activity_spike";
    }
    if (activity?.unknownEndpoints > 3) {
      severity += 2;
      anomalyType = anomalyType || "unusual_endpoints";
    }

    const isAnomaly = severity >= 2;
    this.logSecurityEvent({ type: "anomaly_check", userId: user?.id, anomalyType, severity });
    return { isAnomaly, anomalyType, severity };
  }

  // 6. SESSION HIJACKING
  validateSession(sessionId, ip, userAgent) {
    const session = this.sessionTracking[sessionId];
    if (!session) return { isValid: false, reason: "session_not_found" };

    if (session.ip !== ip || session.userAgent !== userAgent) {
      delete this.sessionTracking[sessionId];
      this.logSecurityEvent({ type: "session_hijack", sessionId, ip, userAgent });
      return { isValid: false, reason: "session_mismatch" };
    }
    return { isValid: true, reason: "ok" };
  }

  // 7. RATE LIMITING
  enforceRateLimit(ip, endpoint) {
    const limits = SECURITY_CONFIG.RATE_LIMITS;
    const key = endpoint.includes("login")
      ? "login"
      : endpoint.includes("register")
        ? "register"
        : endpoint.includes("messages")
          ? "messages"
          : endpoint.includes("like")
            ? "likes"
            : endpoint.includes("upload")
              ? "upload"
              : null;

    if (!key) return { allowed: true, remainingRequests: 999, resetTime: now() };

    const limit = limits[key];
    const entry = this.ipTracking[ip] || { rateBuckets: {} };
    entry.rateBuckets = entry.rateBuckets || {};
    const bucket = entry.rateBuckets[key] || [];
    const cutoff = now() - limit.window;
    const filtered = bucket.filter((t) => t > cutoff);
    filtered.push(now());
    entry.rateBuckets[key] = filtered;
    this.ipTracking[ip] = entry;

    const remaining = Math.max(0, limit.max - filtered.length);
    const allowed = filtered.length <= limit.max;
    const resetTime = filtered.length ? filtered[0] + limit.window : now();
    this.logSecurityEvent({ type: "rate_limit", ip, endpoint, allowed, remaining });
    return { allowed, remainingRequests: remaining, resetTime };
  }

  // 8. DETECCION DE BOTS Y SCRAPERS
  detectBot(userAgent, behavior = {}) {
    const evidence = [];
    let confidence = 0;

    if (THREAT_PATTERNS.suspiciousUserAgents.some((p) => p.test(userAgent || ""))) {
      evidence.push("user_agent");
      confidence += 0.4;
    }
    if (behavior.clicksPerSecond > 6) {
      evidence.push("click_speed");
      confidence += 0.3;
    }
    if (behavior.repeatPattern) {
      evidence.push("pattern_repeat");
      confidence += 0.3;
    }

    const isBot = confidence >= 0.6;
    this.logSecurityEvent({ type: "bot_detect", isBot, confidence, evidence });
    return { isBot, confidence, evidence };
  }

  // 9. MONITOREO DE ARCHIVOS
  scanUploadedFile(file) {
    const threats = [];
    const name = file?.name || "";
    const sizeMb = (file?.size || 0) / (1024 * 1024);
    const ext = name.split(".").pop()?.toLowerCase() || "";

    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(ext)) {
      threats.push("ext_no_permitida");
    }
    if (sizeMb > SECURITY_CONFIG.MAX_FILE_SIZE_MB) {
      threats.push("tamano_excesivo");
    }
    const header = file?.header || "";
    if (header.startsWith("MZ")) {
      threats.push("ejecutable_disfrazado");
    }

    const isSafe = threats.length === 0;
    this.logSecurityEvent({ type: "file_scan", isSafe, fileType: ext, threats });
    return { isSafe, fileType: ext, threats };
  }

  // 10. SISTEMA DE ALERTAS
  generateAlert(threat, severity) {
    const alert = {
      alertId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now(),
      severity,
      threat,
      action: "log",
    };

    if (severity === "MEDIUM") alert.action = "email";
    if (severity === "HIGH") alert.action = "block_and_notify";
    if (severity === "CRITICAL") alert.action = "lockdown_and_call";

    this.alerts.push(alert);
    this.logSecurityEvent({ type: "alert", ...alert });
    return alert;
  }

  // 11. LISTAS NEGRAS Y BLANCAS
  checkBlacklist(ip) {
    return this.blacklist.has(ip);
  }

  checkWhitelist(ip) {
    return this.whitelist.has(ip);
  }

  // 12. REGISTRO DE AUDITORIA
  logSecurityEvent(event) {
    const entry = createLogEntry(event);
    this.logger.append(entry);
  }

  // 13. MONITOREO EN TIEMPO REAL
  startSecurityMonitoring() {
    if (this._monitorTimer) clearInterval(this._monitorTimer);
    this._monitorTimer = setInterval(() => {
      // Revisiones basicas
      Object.keys(this.ipTracking).forEach((ip) => this.detectDDoS(ip));
    }, 10000);

    if (this._reportTimer) clearInterval(this._reportTimer);
    this._reportTimer = setInterval(() => {
      this.logSecurityEvent({ type: "hourly_report" });
    }, 3600000);
  }

  // 14. PROTECCION CSRF
  generateCSRFToken(sessionId) {
    const token = Math.random().toString(36).slice(2);
    if (this.sessionTracking[sessionId]) {
      this.sessionTracking[sessionId].csrfToken = token;
    }
    return token;
  }

  validateCSRFToken(token, sessionId) {
    const session = this.sessionTracking[sessionId];
    if (!session) return false;
    return session.csrfToken === token;
  }

  // 15. ENCRIPTACION DE DATOS SENSIBLES (simulada)
  encryptSensitive(data) {
    const text = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(text)));
  }

  decryptSensitive(encryptedData) {
    const text = decodeURIComponent(escape(atob(encryptedData)));
    return JSON.parse(text);
  }
}

