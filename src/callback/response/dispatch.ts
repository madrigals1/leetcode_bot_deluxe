import { LbContext } from "@/utils/context";
import type {
  EditTextResponse,
  EditPhotoResponse,
  CommandRedirectResponse,
  CallbackResponse,
} from "./types";
import type { CommandResponse } from "@/command/response/types";
import { COMMANDS_TO_REGISTER } from "@/command/registry";
import {
  renderFirstPageEdit,
  renderFirstButtonsPageEdit,
} from "./pagination";

export async function dispatchCallbackResponse(
  lbCtx: LbContext,
  response: CallbackResponse,
) {
  switch (response.type) {
    case "editText":
      return handleEditTextResponse(lbCtx, response);
    case "editPhoto":
      return handleEditPhotoResponse(lbCtx, response);
    case "commandRedirect":
      return handleCommandRedirectResponse(lbCtx, response);
  }
}

function handleEditTextResponse(
  lbCtx: LbContext,
  response: EditTextResponse,
) {
  return lbCtx.editMessageText(response.text, {
    reply_markup: response.buttons,
  });
}

function handleEditPhotoResponse(
  lbCtx: LbContext,
  response: EditPhotoResponse,
) {
  return lbCtx.ctx.editMessageMedia(
    {
      type: "photo",
      media: response.photo,
      caption: response.caption,
    },
    {
      reply_markup: response.buttons,
    },
  );
}

async function handleCommandRedirectResponse(
  lbCtx: LbContext,
  response: CommandRedirectResponse,
) {
  const cmd = COMMANDS_TO_REGISTER.find((c) => c.name === response.command);
  if (!cmd) {
    return;
  }

  const result = await cmd.originalFn(lbCtx);
  await dispatchAsEdit(lbCtx, result);
}

async function dispatchAsEdit(
  lbCtx: LbContext,
  response: CommandResponse,
) {
  switch (response.type) {
    case "text":
      return lbCtx.editMessageText(response.text, {
        reply_markup: response.buttons,
      });
    case "photo":
      return lbCtx.ctx.editMessageMedia(
        {
          type: "photo",
          media: response.photo,
          caption: response.caption,
        },
        {
          reply_markup: response.buttons,
        },
      );
    case "paginatedText": {
      const pageSize = response.itemsPerPage ?? 10;
      return renderFirstPageEdit(lbCtx, response, pageSize);
    }
    case "paginatedButtons": {
      const pageSize = response.itemsPerPage ?? 10;
      const buttonsPerRow = response.buttonsPerRow ?? 2;
      return renderFirstButtonsPageEdit(lbCtx, response, pageSize, buttonsPerRow);
    }
  }
}
