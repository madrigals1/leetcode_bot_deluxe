import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/types/context";
import { DataNotFoundError } from "@/errors";
import type { PaginatedButtonsResponse } from "../types";
import { buildKeyboard, buildNavRow, totalPages, registerPaginationCallback } from "./utils";

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
