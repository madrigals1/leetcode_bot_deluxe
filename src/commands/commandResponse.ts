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

export async function dispatchCommandResponse(ctx: Context, response: CommandResponse) {
  const lbCtx = new LbContext(ctx);

  switch (response.type) {
    case "text":
      await lbCtx.reply(response.text, { reply_markup: response.reply_markup });
      break;
    case "photo":
      await lbCtx.replyWithPhoto(response.photo, {
        caption: response.caption,
        reply_markup: response.reply_markup,
      });
      break;
    case "paginatedText":
      await renderFirstPaginatedTextPage(lbCtx, response);
      break;
    case "paginatedButtons":
      await renderFirstPaginatedButtonsPage(lbCtx, response);
      break;
  }
}

async function renderFirstPaginatedTextPage<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
) {
  const pageSize = response.itemsPerPage ?? 10;
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    await lbCtx.reply("No data found.");
    return;
  }

  registerPaginationCallback(
    response.name,
    response.fetchPage,
    response.reply_markup,
    (lbCtx, data, page, pageSize) =>
      renderPaginatedTextPage(lbCtx, response, data, page, pageSize),
    pageSize,
  );

  await renderPaginatedTextPage(lbCtx, response, data, 1, pageSize);
}

async function renderFirstPaginatedButtonsPage<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
) {
  const pageSize = response.itemsPerPage ?? 10;
  const buttonsPerRow = response.buttonsPerRow ?? 2;
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    await lbCtx.reply("No data found.");
    return;
  }

  registerPaginationCallback(
    response.name,
    response.fetchPage,
    response.reply_markup,
    (lbCtx, data, page, pageSize) =>
      renderPaginatedButtonsPage(lbCtx, response, data, page, pageSize, buttonsPerRow),
    pageSize,
  );

  await renderPaginatedButtonsPage(lbCtx, response, data, 1, pageSize, buttonsPerRow);
}

function renderPaginatedTextPage<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  data: PaginatedResponse<T>,
  page: number,
  pageSize: number,
) {
  const total = Math.ceil(data.count / pageSize);
  const hasNext = page < total;

  const items = data.results.map((item, index) =>
    response.formatItem(item, (page - 1) * pageSize + index),
  );

  const text = response.header + "\n\n" + items.join("\n") + "\n\n" + `Page ${page} of ${total}`;

  const navRow: InlineKeyboardButton[] = [];

  if (page > 1) {
    navRow.push({ text: "⬅️ Previous", callback_data: `${response.name}_page:${page - 1}` });
  }

  if (hasNext) {
    navRow.push({ text: "Next ➡️", callback_data: `${response.name}_page:${page + 1}` });
  }

  const keyboard = new InlineKeyboard([...(navRow.length > 0 ? [navRow] : []), ...(response.reply_markup?.inline_keyboard ?? [])]);

  return lbCtx.reply(text, {
    reply_markup: keyboard,
  });
}

function renderPaginatedButtonsPage<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  data: PaginatedResponse<T>,
  page: number,
  pageSize: number,
  buttonsPerRow: number,
) {
  const total = Math.ceil(data.count / pageSize);
  const hasNext = page < total;

  const buttons = data.results.map(response.itemToButton);
  const rows: InlineKeyboardButton[][] = [];

  for (let i = 0; i < buttons.length; i += buttonsPerRow) {
    rows.push(buttons.slice(i, i + buttonsPerRow));
  }

  const navRow: InlineKeyboardButton[] = [];

  if (page > 1) {
    navRow.push({ text: "⬅️ Previous", callback_data: `${response.name}_page:${page - 1}` });
  }

  if (hasNext) {
    navRow.push({ text: "Next ➡️", callback_data: `${response.name}_page:${page + 1}` });
  }

  const keyboard = new InlineKeyboard([...rows, ...(navRow.length > 0 ? [navRow] : []), ...(response.reply_markup?.inline_keyboard ?? [])]);

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
  ) => Promise<unknown>,
  defaultPageSize: number,
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

        await renderPage(lbCtx, data, page, defaultPageSize);
      } catch (error) {
        if (error instanceof Error && "message" in error) {
          await ctx.answerCallbackQuery(error.message);
          return;
        }

        await ctx.editMessageText("Failed to fetch data.");
      }
    },
  });
}
