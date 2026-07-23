import type { InlineKeyboard } from "grammy";

type CallbackResponseType = "editText" | "editPhoto";

interface BaseCallbackResponse {
  type: CallbackResponseType;
  buttons?: InlineKeyboard;
}

export interface EditTextResponse extends BaseCallbackResponse {
  type: "editText";
  text: string;
}

export interface EditPhotoResponse extends BaseCallbackResponse {
  type: "editPhoto";
  photo: string;
  caption?: string;
}

export type CallbackResponse = EditTextResponse | EditPhotoResponse;
