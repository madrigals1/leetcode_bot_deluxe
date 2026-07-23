import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/utils/context";
import { DataNotFoundError } from "@/errors";
import { buildKeyboard, buildNavRow, totalPages, defaultFooter } from "@/command/response/pagination/utils";
import type { PaginatedTextResponse } from "@/command/response/types";
import type { PaginatedButtonsResponse } from "@/command/response/types";

export async function renderFirstPageEdit<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  pageSize: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
  }

  return renderPageEdit(lbCtx, response, data, 1, pageSize);
}

function renderPageEdit<T>(
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
    response.buttons,
  );

  return lbCtx.editMessageText(text, {
    reply_markup: keyboard,
  });
}

export async function renderFirstButtonsPageEdit<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  pageSize: number,
  buttonsPerRow: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
  }

  return renderButtonsPageEdit(lbCtx, response, data, 1, pageSize, buttonsPerRow);
}

function renderButtonsPageEdit<T>(
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
    response.buttons,
  );

  return lbCtx.editMessageText("Select an item:", {
    reply_markup: keyboard,
  });
}
