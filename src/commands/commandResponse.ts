import { Context, InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import type { PaginatedResponse } from "../services/api";
import { LbContext } from "../types/context";
import { callbacksRegisteredByDecorator } from "../decorators/callback";
import type {
  TextResponse,
  PhotoResponse,
  PaginatedTextResponse,
  PaginatedButtonsResponse,
  CommandResponse,
} from "./commandResponseTypes";

export function text(text: string): TextResponse {
  return { text, type: "text" };
}

export function complexText(options: { text: string; reply_markup?: InlineKeyboard }): TextResponse {
  return { ...options, type: "text" };
}

export function photo(options: { photo: string; caption?: string; reply_markup?: InlineKeyboard }): PhotoResponse {
  return { ...options, type: "photo" };
}

export function paginatedText<T>(options: {
  name: string;
  header: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  formatItem: (item: T, index: number) => string;
  reply_markup?: InlineKeyboard;
  itemsPerPage?: number;
  pageButtonsPerRow?: number;
  showPageNumbers?: boolean;
  showFirstLastButtons?: boolean;
}): PaginatedTextResponse<T> {
  return { ...options, type: "paginatedText" };
}

export function paginatedButtons<T>(options: {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  itemToButton: (item: T) => InlineKeyboardButton;
  buttonsPerRow?: number;
  reply_markup?: InlineKeyboard;
  itemsPerPage?: number;
  pageButtonsPerRow?: number;
  showPageNumbers?: boolean;
  showFirstLastButtons?: boolean;
}): PaginatedButtonsResponse<T> {
  return { ...options, type: "paginatedButtons" };
}

export async function dispatchResponse(
  lbCtx: LbContext,
  response: CommandResponse,
) {
  switch (response.type) {
    case "text":
      return handleTextResponse(lbCtx, response);
    case "photo":
      return handlePhotoResponse(lbCtx, response);
    case "paginatedText":
      return handlePaginatedTextResponse(lbCtx, response);
    case "paginatedButtons":
      return handlePaginatedButtonsResponse(lbCtx, response);
  }
}

function handleTextResponse(lbCtx: LbContext, response: TextResponse) {
  return lbCtx.reply(response.text, {
    reply_markup: response.reply_markup,
  });
}

function handlePhotoResponse(lbCtx: LbContext, response: PhotoResponse) {
  return lbCtx.replyWithPhoto(response.photo, {
    caption: response.caption,
    reply_markup: response.reply_markup,
  });
}

function handlePaginatedTextResponse<T>(lbCtx: LbContext, response: PaginatedTextResponse<T>) {
  const pageSize = response.itemsPerPage ?? 10;
  return renderFirstPage(lbCtx, response, pageSize);
}

function handlePaginatedButtonsResponse<T>(lbCtx: LbContext, response: PaginatedButtonsResponse<T>) {
  const pageSize = response.itemsPerPage ?? 10;
  const buttonsPerRow = response.buttonsPerRow ?? 2;
  return renderFirstButtonsPage(lbCtx, response, pageSize, buttonsPerRow);
}

function buildKeyboard(
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

function totalPages(count: number, pageSize: number) {
  return Math.ceil(count / pageSize);
}

function defaultFooter(page: number, count: number, pageSize: number) {
  return `Page ${page} of ${totalPages(count, pageSize)}`;
}

function buildNavRow(page: number, hasNext: boolean, name: string) {
  const row: InlineKeyboardButton[] = [];

  if (page > 1) {
    row.push({ text: "⬅️ Previous", callback_data: `${name}_page:${page - 1}` });
  }

  if (hasNext) {
    row.push({ text: "Next ➡️", callback_data: `${name}_page:${page + 1}` });
  }

  return row;
}

async function renderFirstPage<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  pageSize: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    return lbCtx.reply("No data found.");
  }

  const renderPageWithResponse = (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
  ) => renderPage(lbCtx, response, data, page, pageSize);

  registerPaginationCallback(response.name, response.fetchPage, response.reply_markup, renderPageWithResponse, pageSize);

  return renderPageWithResponse(lbCtx, data, 1, pageSize);
}

function renderPage<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  data: PaginatedResponse<T>,
  page: number,
  pageSize: number,
) {
  const total = totalPages(data.count, pageSize);
  const hasNext = page < total;

  const items = data.results.map((item, index) =>
    response.formatItem(item, (page - 1) * pageSize + index),
  );

  const text = response.header + "\n\n" + items.join("\n") + "\n\n" + defaultFooter(page, data.count, pageSize);

  const navRow = buildNavRow(page, hasNext, response.name);
  const keyboard = buildKeyboard(
    [navRow],
    response.reply_markup,
  );

  return lbCtx.reply(text, {
    reply_markup: keyboard,
  });
}

async function renderFirstButtonsPage<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  pageSize: number,
  buttonsPerRow: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    return lbCtx.reply("No data found.");
  }

  const renderButtonsPageWithResponse = (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
  ) => renderButtonsPage(lbCtx, response, data, page, pageSize, buttonsPerRow);

  registerPaginationCallback(response.name, response.fetchPage, response.reply_markup, renderButtonsPageWithResponse, pageSize, buttonsPerRow);

  return renderButtonsPageWithResponse(lbCtx, data, 1, pageSize);
}

function renderButtonsPage<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  data: PaginatedResponse<T>,
  page: number,
  pageSize: number,
  buttonsPerRow: number,
) {
  const total = totalPages(data.count, pageSize);
  const hasNext = page < total;

  const buttons = data.results.map(response.itemToButton);
  const rows: InlineKeyboardButton[][] = [];

  for (let i = 0; i < buttons.length; i += buttonsPerRow) {
    rows.push(buttons.slice(i, i + buttonsPerRow));
  }

  const navRow = buildNavRow(page, hasNext, response.name);
  const keyboard = buildKeyboard(
    [...rows, navRow],
    response.reply_markup,
  );

  return lbCtx.reply("Select an item:", {
    reply_markup: keyboard,
  });
}

function registerPaginationCallback<T>(
  name: string,
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>,
  extraKeyboard: InlineKeyboard | undefined,
  renderPage: (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
    buttonsPerRow?: number,
  ) => Promise<unknown>,
  defaultPageSize: number,
  defaultButtonsPerRow?: number,
) {
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
          await lbCtx.editMessageText("No data found.");
          return;
        }

        await renderPage(lbCtx, data, page, defaultPageSize, defaultButtonsPerRow);
      } catch (error) {
        if (error instanceof Error) {
          await ctx.answerCallbackQuery(error.message);
          return;
        }

        await ctx.editMessageText("Failed to fetch data.");
      }
    },
  });
}
