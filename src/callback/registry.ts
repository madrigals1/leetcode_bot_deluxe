import { Context } from "grammy";

export interface CallbackMetadata {
  action: string | RegExp;
  handler: (ctx: Context) => void | Promise<void>;
}

export const CALLBACKS_TO_REGISTER: CallbackMetadata[] = [];
