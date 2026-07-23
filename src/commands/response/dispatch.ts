import { LbContext } from "@/types/context";
import type {
  TextResponse,
  PhotoResponse,
  PaginatedTextResponse,
  PaginatedButtonsResponse,
  CommandResponse,
} from "./types";
import { renderFirstPage } from "./pagination/text";
import { renderFirstButtonsPage } from "./pagination/button";

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
