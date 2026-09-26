import { timeAgo } from "short-time-ago";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function boldUsername(username: string): string {
  return `<b>"${escapeHtml(username)}"</b>`;
}

export function humanizeTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return timeAgo(date);
}

export function stripEmojis(text: string): string {
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: FE0F (variation selector) and 200D (ZWJ) are invisible by design — they hold multi-codepoint emoji sequences together and are stripped along with the pictographs
  return text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").trim();
}

export function formatUptime(seconds: number): string {
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
