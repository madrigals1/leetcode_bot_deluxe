import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/types/context";
import { DataNotFoundError } from "@/errors";
import type { PaginatedTextResponse } from "../types";
import { buildKeyboard, buildNavRow, totalPages, defaultFooter, registerPaginationCallback } from "./utils";

export async function renderFirstPage<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  pageSize: number,
) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
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
