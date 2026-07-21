import { Context, InlineKeyboard } from "grammy";
import type { PaginatedResponse } from "../services/api";
import {
  callbacksRegisteredByDecorator,
  commandsRegisteredByDecorator,
} from "../decorators";
import { LbContext } from "../types/context";

export interface PageResult {
  text: string;
  reply_markup?: InlineKeyboard;
}

type FetchPage<T> = (
  page: number,
  ctx: LbContext,
) => Promise<PaginatedResponse<T>>;

interface PaginationOptions<T> {
  name: string;
  header: string;
  fetchPage: FetchPage<T>;
  formatItem: (item: T, index: number) => string;
  pageSize?: number;
  reply_markup?: InlineKeyboard;
  footer?: string;
  errorMessage?: string;
}

function buildKeyboard(page: number, hasNext: boolean, prefix: string, extraKeyboard?: InlineKeyboard) {
  const keyboard = extraKeyboard?.clone() ?? new InlineKeyboard();

  if (extraKeyboard) {
    keyboard.row();
  }

  if (page > 1) {
    keyboard.text("⬅️ Previous", `${prefix}:${page - 1}`);
  }

  if (hasNext) {
    keyboard.text("Next ➡️", `${prefix}:${page + 1}`);
  }

  return keyboard;
}

async function fetchPage<T>(
  options: PaginationOptions<T>,
  page: number,
  ctx: LbContext,
): Promise<PageResult> {
  const data = await options.fetchPage(page, ctx);

  if (data.results.length === 0) {
    return { text: "No data found." };
  }

  const lines = data.results.map((item, i) =>
    options.formatItem(item, i),
  );

  const totalPages = Math.ceil(data.count / (options.pageSize ?? 10));
  const footer = options.footer ?? `Page ${page} of ${totalPages}`;

  return {
    text: `${options.header}\n\n${lines.join("\n")}\n\n${footer}`,
    reply_markup: buildKeyboard(page, !!data.next, options.name, options.reply_markup),
  };
}

export function pagination<T>(options: PaginationOptions<T>) {
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
          return fetchPage(options, 1, lbCtx);
        } catch {
          return { text: options.errorMessage ?? "Failed to fetch data." };
        }
      },
    });

    callbacksRegisteredByDecorator.push({
      action: new RegExp(`^${options.name}:(\\d+)$`),
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);

        if (!lbCtx.match) {
          return;
        }

        const page = Number(lbCtx.match[1]);

        try {
          const result = await fetchPage(options, page, lbCtx);
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
