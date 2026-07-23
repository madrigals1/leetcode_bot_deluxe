import { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";

export function buildKeyboard(
  itemRows?: InlineKeyboardButton[][],
  extraKeyboard?: InlineKeyboard,
) {
  const rows: InlineKeyboardButton[][] = [];

  if (itemRows) {
    for (const row of itemRows) {
      rows.push(row);
    }
  }

  if (extraKeyboard) {
    for (const row of extraKeyboard.inline_keyboard) {
      rows.push(row);
    }
  }

  return new InlineKeyboard(rows);
}

export function totalPages(count: number, pageSize: number) {
  return Math.ceil(count / pageSize);
}

export function defaultFooter(page: number, count: number, pageSize: number) {
  return `Page ${page} of ${totalPages(count, pageSize)}`;
}

export function buildNavRow(page: number, hasNext: boolean, name: string) {
  const row: InlineKeyboardButton[] = [];

  if (page > 1) {
    row.push({ text: "⬅️ Previous", callback_data: `${name}_page:${page - 1}` });
  }

  if (hasNext) {
    row.push({ text: "Next ➡️", callback_data: `${name}_page:${page + 1}` });
  }

  return row;
}
