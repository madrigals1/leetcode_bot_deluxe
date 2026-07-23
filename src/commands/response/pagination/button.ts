import type { PaginatedResponse } from "../../../services/api";
import { LbContext } from "../../../types/context";
import { callbacksRegisteredByDecorator } from "../../../decorators/callback";
import { LeetCodeBotError, DataNotFoundError } from "../../../errors";
import type { PaginatedButtonsResponse } from "../types";
import { buildKeyboard, buildNavRow, totalPages } from "./utils";

export async function renderFirstButtonsPage<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  pageSize: number,
  buttonsPerRow: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
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
  const rows: import("grammy/types").InlineKeyboardButton[][] = [];

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
  extraKeyboard: import("grammy").InlineKeyboard | undefined,
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
    handler: async (ctx) => {
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
