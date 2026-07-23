import { LbContext } from "@/utils/context";
import type {
  EditTextResponse,
  EditPhotoResponse,
  CallbackResponse,
} from "./types";

export async function dispatchCallbackResponse(
  lbCtx: LbContext,
  response: CallbackResponse,
) {
  switch (response.type) {
    case "editText":
      return handleEditTextResponse(lbCtx, response);
    case "editPhoto":
      return handleEditPhotoResponse(lbCtx, response);
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
