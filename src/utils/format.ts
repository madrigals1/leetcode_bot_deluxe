export function boldUsername(username: string): string {
  return `<b>"${username}"</b>`;
}

export function stripEmojis(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").trim();
}
