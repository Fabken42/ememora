let _purify: typeof import("dompurify").default | null = null;

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty;
  if (!_purify) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _purify = require("dompurify") as typeof import("dompurify").default;
  }
  return _purify.sanitize(dirty);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
