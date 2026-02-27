/**
 * Sanitizes user-provided text to reduce XSS risk when data is re-used.
 * React escapes output by default, but sanitizing at input time adds defense-in-depth.
 */
export function sanitizeText(value, options = {}) {
  const { maxLen = 250, allowNewLines = false } = options;
  const source = String(value ?? "");
  const trimmed = source.trim();
  const noControls = Array.from(trimmed)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");
  const normalized = allowNewLines
    ? noControls.replace(/\r/g, "")
    : noControls.replace(/\s+/g, " ");
  const stripped = normalized.replace(/[<>`]/g, "");
  return stripped.slice(0, maxLen);
}

export function sanitizeEmail(value) {
  return sanitizeText(value, { maxLen: 120 }).toLowerCase();
}

export function isValidISODate(dateValue) {
  if (!dateValue) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
}
