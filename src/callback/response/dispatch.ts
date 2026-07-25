import { LbContext } from "@/utils/context";
import type { CallbackResponse } from "./types";
import type { TextResponse, PhotoResponse } from "@/command/response/types";
import { CommandRegistry } from "@/command/registry";
import { dispatchResponse } from "@/command/response/dispatch";

export async function dispatchCallbackResponse(
  lbCtx: LbContext,
  response: CallbackResponse,
) {
  const editReply = (text: string, options?: object) =>
    lbCtx.editMessageText(text, options);
  const editPhoto = (photo: string, options?: object) =>
    lbCtx.editPhoto(photo, options);

  switch (response.type) {
    case "editText": {
      const cmdResponse: TextResponse = {
        type: "text",
        text: response.text,
        buttons: response.buttons,
      };
      return dispatchResponse(lbCtx, cmdResponse, editReply, editPhoto);
    }
    case "editPhoto": {
      const cmdResponse: PhotoResponse = {
        type: "photo",
        photo: response.photo,
        caption: response.caption,
        buttons: response.buttons,
      };
      return dispatchResponse(lbCtx, cmdResponse, editReply, editPhoto);
    }
    case "commandRedirect": {
      const cmd = CommandRegistry.findByName(response.command);
      if (!cmd) {
        return;
      }
      const result = await cmd.originalFn(lbCtx);
      return dispatchResponse(lbCtx, result, editReply, editPhoto);
    }
  }
}
