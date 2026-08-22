import { timeAgo } from "short-time-ago";

export function boldUsername(username: string): string {
  return `<b>"${username}"</b>`;
}

export function humanizeTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "-";
  }
  return timeAgo(new Date(timestamp));
}

export function stripEmojis(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").trim();
}

export function formatUptime(seconds: number): string {
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
