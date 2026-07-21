import type { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import { LbContext } from "../../types/context";
import type { PaginatedResponse } from "../../services/api";
import {
  basePagination,
  buildKeyboard,
  buildNavRow,
  defaultFooter,
  type BasePaginationOptions,
} from "./base";

export interface ButtonsPaginationOptions<T> {
  name: string;
  header: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  itemToButton: (item: T, index: number) => {
    text: string;
    callback_data: string;
  } | {
    text: string;
    url: string;
  };
  buttonsPerRow?: number;
  pageSize?: number;
  footer?: string;
  errorMessage?: string;
  reply_markup?: InlineKeyboard;
}

export function buttonsPagination<T>(options: ButtonsPaginationOptions<T>) {
  return basePagination({
    ...options,
    render: (
      data: PaginatedResponse<T>,
      page: number,
      opts: BasePaginationOptions<T>,
    ) => {
      const ps = opts.pageSize ?? 10;
      const bpr = options.buttonsPerRow ?? 1;
      const buttons = data.results.map((item, i) =>
        options.itemToButton(item, i),
      );
      const itemRows: InlineKeyboardButton[][] = [];

      for (let i = 0; i < buttons.length; i += bpr) {
        itemRows.push(buttons.slice(i, i + bpr));
      }

      const footer = opts.footer ?? defaultFooter(page, data.count, ps);
      const navRow = buildNavRow(page, !!data.next, opts.name);

      const keyboard = buildKeyboard(
        [...itemRows, ...(navRow.length > 0 ? [navRow] : [])],
        opts.reply_markup,
      );

      return {
        text: `${options.header}\n\n${footer}`,
        reply_markup: keyboard,
      };
    },
  });
}
