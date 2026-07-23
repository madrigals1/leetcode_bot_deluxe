import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/utils/context";
import { DataNotFoundError } from "@/errors";
import { buildKeyboard, buildNavRow, totalPages, defaultFooter, registerPaginationCallback } from "./utils";
import type { RenderFirstPageOptions, RenderPageOptions } from "./types";
import type { PaginatedTextResponse } from "../types";

export async function renderFirstPage<T>({
  lbCtx,
  response,
  pageSize,
  reply,
}: RenderFirstPageOptions<T, PaginatedTextResponse<T>>) {
  const data = await response.fetchPage(1, lbCtx);

  if (data.results.length === 0) {
    throw new DataNotFoundError();
  }

  const renderPageWithResponse = (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
  ) => renderPage({ lbCtx, response, data, page, pageSize, reply });

  registerPaginationCallback({
    name: response.name,
    fetchPage: response.fetchPage,
    renderPage: renderPageWithResponse,
    defaultPageSize: pageSize,
    reply,
  });

  return renderPageWithResponse(lbCtx, data, 1, pageSize);
}

function renderPage<T>({
  lbCtx: _lbCtx,
  response,
  data,
  page,
  pageSize,
  reply,
}: RenderPageOptions<T, PaginatedTextResponse<T>>) {
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

  return reply(text, {
    reply_markup: keyboard,
  });
}
