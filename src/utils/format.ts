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
