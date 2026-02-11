export function sanitizeText(value) {
  const raw = String(value ?? "");
  return raw.replace(/[<>]/g, "").trim();
}

export function sanitizeUsername(value) {
  return sanitizeText(value).replace(/[^\w.-]/g, "").slice(0, 30);
}

export function sanitizeList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 8);
}

export function sanitizeBio(value) {
  return sanitizeText(value).slice(0, 180);
}

export function sanitizeCity(value) {
  return sanitizeText(value).slice(0, 40);
}

export function sanitizeVibe(value) {
  return sanitizeText(value).slice(0, 30);
}

export function sanitizeEmail(value) {
  return sanitizeText(value).slice(0, 80);
}

export function sanitizeInstagram(value) {
  return sanitizeText(value).replace(/^@+/, "@").slice(0, 30);
}
