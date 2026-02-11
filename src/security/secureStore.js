// Almacenamiento seguro basico para datos sensibles (sin dependencias externas)
const SECRET = "friending_local_key_v1";

function xorText(text) {
  const secretLen = SECRET.length;
  const chars = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i) ^ SECRET.charCodeAt(i % secretLen);
    chars.push(String.fromCharCode(code));
  }
  return chars.join("");
}

export function encryptText(value) {
  const raw = String(value ?? "");
  if (!raw) return "";
  const xored = xorText(raw);
  return btoa(xored);
}

export function decryptText(value) {
  if (!value) return "";
  try {
    const decoded = atob(String(value));
    return xorText(decoded);
  } catch (error) {
    return "";
  }
}

export function verifyPassword(user, input) {
  if (!user) return false;
  if (user.passwordEnc) {
    return decryptText(user.passwordEnc) === String(input ?? "");
  }
  return user.password === String(input ?? "");
}

export function normalizePassword(user) {
  if (!user) return user;
  if (user.passwordEnc) return user;
  if (user.password) {
    return { ...user, passwordEnc: encryptText(user.password), password: undefined };
  }
  return user;
}

export function getPasswordForDisplay(user, canView) {
  if (!user) return "";
  if (!canView) return "••••••";
  if (user.passwordEnc) return decryptText(user.passwordEnc);
  return user.password || "";
}
