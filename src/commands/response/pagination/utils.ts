import { Context, InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import { LbContext } from "@/types/context";
import { callbacksRegisteredByDecorator } from "@/decorators/callback";
import { LeetCodeBotError, DataNotFoundError } from "@/errors";
import type { RegisterPaginationCallbackOptions } from "./types";

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

export function registerPaginationCallback<T>({
  name,
  fetchPage,
  renderPage,
  defaultPageSize,
  defaultButtonsPerRow,
}: RegisterPaginationCallbackOptions<T>) {
  const regex = new RegExp(`^${name}_page:(\\d+)$`);

  const existing = callbacksRegisteredByDecorator.find((c) => c.action instanceof RegExp && c.action.source === regex.source);
  if (existing) {
    return;
  }

  callbacksRegisteredByDecorator.push({
    action: regex,
    handler: async (ctx: Context) => {
      try {
        const lbCtx = new LbContext(ctx);
        const page = Number(lbCtx.match[1]);
        const data = await fetchPage(page, lbCtx);

        if (data.results.length === 0) {
          throw new DataNotFoundError();
        }

        await renderPage(lbCtx, data, page, defaultPageSize, defaultButtonsPerRow);
      } catch (error) {
        if (error instanceof LeetCodeBotError) {
          await ctx.answerCallbackQuery(error.message);
          return;
        }

        await ctx.editMessageText("Failed to fetch data.");
      }
    },
  });
}
