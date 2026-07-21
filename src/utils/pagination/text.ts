import { InlineKeyboard } from "grammy";
import { LbContext } from "../../types/context";
import type { PaginatedResponse } from "../../services/api";
import {
  basePagination,
  buildKeyboard,
  buildNavRow,
  defaultFooter,
  type BasePaginationOptions,
} from "./base";

export interface PaginationOptions<T> {
  name: string;
  header: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  formatItem: (item: T, index: number) => string;
  pageSize?: number;
  footer?: string;
  errorMessage?: string;
  reply_markup?: InlineKeyboard;
}

export function pagination<T>(options: PaginationOptions<T>) {
  return basePagination({
    ...options,
    render: (
      data: PaginatedResponse<T>,
      page: number,
      opts: BasePaginationOptions<T>,
    ) => {
      const ps = opts.pageSize ?? 10;
      const lines = data.results
        .map((item, i) => options.formatItem(item, i))
        .filter(Boolean);
      const footer = opts.footer ?? defaultFooter(page, data.count, ps);
      const navRow = buildNavRow(page, !!data.next, opts.name);

      const keyboard = buildKeyboard(
        navRow.length > 0 ? [navRow] : undefined,
        opts.reply_markup,
      );

      return {
        text: `${options.header}\n\n${lines.join("\n")}\n\n${footer}`,
        reply_markup: keyboard,
      };
    },
  });
}
