import { Context, InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import type { PaginatedResponse } from "../../services/api";
import {
  callbacksRegisteredByDecorator,
  commandsRegisteredByDecorator,
} from "../../decorators";
import { LbContext } from "../../types/context";

export interface PageResult {
  text: string;
  reply_markup?: InlineKeyboard;
}

export interface BasePaginationOptions<T> {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
  footer?: string;
  errorMessage?: string;
  reply_markup?: InlineKeyboard;
  render: (
    data: PaginatedResponse<T>,
    page: number,
    options: BasePaginationOptions<T>,
  ) => PageResult;
}

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

export function basePagination<T>(options: BasePaginationOptions<T>) {
  return function (
    _target: object,
    _propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    commandsRegisteredByDecorator.push({
      name: options.name,
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);
        try {
          const data = await options.fetchPage(1, lbCtx);

          if (data.results.length === 0) {
            return { text: "No data found." };
          }

          return options.render(data, 1, options);
        } catch {
          return { text: options.errorMessage ?? "Failed to fetch data." };
        }
      },
    });

    callbacksRegisteredByDecorator.push({
      action: new RegExp(`^${options.name}_page:(\\d+)$`),
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);

        if (!lbCtx.match) {
          return;
        }

        const page = Number(lbCtx.match[1]);

        try {
          const data = await options.fetchPage(page, lbCtx);

          if (data.results.length === 0) {
            await lbCtx.editMessageText("No data found.");
            return;
          }

          const result = options.render(data, page, options);
          await lbCtx.editMessageText(result.text, {
            reply_markup: result.reply_markup,
          });
        } catch {
          await lbCtx.editMessageText(
            options.errorMessage ?? "Failed to fetch data.",
          );
        }
      },
    });
  };
}
