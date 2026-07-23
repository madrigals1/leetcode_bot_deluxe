import type { InlineKeyboard } from "grammy";

type CallbackResponseType = "editText" | "editPhoto" | "commandRedirect";

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

export interface CommandRedirectResponse extends BaseCallbackResponse {
  type: "commandRedirect";
  command: string;
}

export type CallbackResponse =
  | EditTextResponse
  | EditPhotoResponse
  | CommandRedirectResponse;
