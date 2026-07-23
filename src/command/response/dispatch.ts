import { LbContext } from "@/utils/context";
import type {
  PaginatedTextResponse,
  PaginatedButtonsResponse,
  CommandResponse,
} from "./types";
import type { ReplyMethod } from "./pagination/types";
import { renderFirstPage } from "./pagination/text";
import { renderFirstButtonsPage } from "./pagination/button";

export async function dispatchResponse(
  lbCtx: LbContext,
  response: CommandResponse,
  reply: ReplyMethod,
) {
  switch (response.type) {
    case "text":
      return reply(response.text, {
        reply_markup: response.buttons,
      });
    case "photo":
      return lbCtx.replyWithPhoto(response.photo, {
        caption: response.caption,
        reply_markup: response.buttons,
      });
    case "paginatedText":
      return handlePaginatedTextResponse(lbCtx, response, reply);
    case "paginatedButtons":
      return handlePaginatedButtonsResponse(lbCtx, response, reply);
  }
}

function handlePaginatedTextResponse<T>(
  lbCtx: LbContext,
  response: PaginatedTextResponse<T>,
  reply: ReplyMethod,
) {
  const pageSize = response.itemsPerPage ?? 10;
  return renderFirstPage({ lbCtx, response, pageSize, reply });
}

function handlePaginatedButtonsResponse<T>(
  lbCtx: LbContext,
  response: PaginatedButtonsResponse<T>,
  reply: ReplyMethod,
) {
  const pageSize = response.itemsPerPage ?? 10;
  const buttonsPerRow = response.buttonsPerRow ?? 2;
  return renderFirstButtonsPage({ lbCtx, response, pageSize, buttonsPerRow, reply });
}
