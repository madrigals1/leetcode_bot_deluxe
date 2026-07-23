import { LbContext } from "@/utils/context";
import type { CallbackResponse } from "./types";
import type { TextResponse, PhotoResponse } from "@/command/response/types";
import { COMMANDS_TO_REGISTER } from "@/command/registry";
import { dispatchResponse } from "@/command/response/dispatch";

export async function dispatchCallbackResponse(
  lbCtx: LbContext,
  response: CallbackResponse,
) {
  const editReply = (text: string, options?: object) =>
    lbCtx.editMessageText(text, options);

  switch (response.type) {
    case "editText": {
      const cmdResponse: TextResponse = {
        type: "text",
        text: response.text,
        buttons: response.buttons,
      };
      return dispatchResponse(lbCtx, cmdResponse, editReply);
    }
    case "editPhoto": {
      const cmdResponse: PhotoResponse = {
        type: "photo",
        photo: response.photo,
        caption: response.caption,
        buttons: response.buttons,
      };
      return dispatchResponse(lbCtx, cmdResponse, editReply);
    }
    case "commandRedirect": {
      const cmd = COMMANDS_TO_REGISTER.find((c) => c.name === response.command);
      if (!cmd) {
        return;
      }
      const result = await cmd.originalFn(lbCtx);
      return dispatchResponse(lbCtx, result, editReply);
    }
  }
}
