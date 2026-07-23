import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/types/context";
import { DataNotFoundError } from "@/errors";
import { buildKeyboard, buildNavRow, totalPages, registerPaginationCallback } from "./utils";
import type { RenderFirstPageOptions, RenderPageOptions } from "./types";
import type { PaginatedButtonsResponse } from "../types";

export async function renderFirstButtonsPage<T>({
  lbCtx,
  response,
  pageSize,
  buttonsPerRow = 2,
}: RenderFirstPageOptions<T, PaginatedButtonsResponse<T>>) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
  }

  const renderButtonsPageWithResponse = (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
  ) => renderButtonsPage({ lbCtx, response, data, page, pageSize, buttonsPerRow });

  registerPaginationCallback({
    name: response.name,
    fetchPage: response.fetchPage,
    renderPage: renderButtonsPageWithResponse,
    defaultPageSize: pageSize,
    defaultButtonsPerRow: buttonsPerRow,
  });

  return renderButtonsPageWithResponse(lbCtx, data, 1, pageSize);
}

function renderButtonsPage<T>({
  lbCtx,
  response,
  data,
  page,
  pageSize,
  buttonsPerRow = 2,
}: RenderPageOptions<T, PaginatedButtonsResponse<T>>) {
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
    response.buttons,
  );

  return lbCtx.reply("Select an item:", {
    reply_markup: keyboard,
  });
}
