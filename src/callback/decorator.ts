import { Context } from "grammy";
import { LbContext } from "@/types/context";
import { LeetCodeBotError } from "@/errors";
import { CALLBACKS_TO_REGISTER } from "./registry";
import { dispatchCallbackResponse } from "./response/dispatch";
import type { CallbackResponse } from "./response/types";

interface CallbackOptions {
  action: string | RegExp;
}

export function callback(options: CallbackOptions) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    CALLBACKS_TO_REGISTER.push({
      ...options,
      handler: async (ctx: Context) => {
        try {
          const lbCtx = new LbContext(ctx);
          await lbCtx.answerCallbackQuery();
          const response: CallbackResponse = await descriptor.value(lbCtx);
          await dispatchCallbackResponse(lbCtx, response);
        } catch (error) {
          if (error instanceof LeetCodeBotError) {
            await ctx.answerCallbackQuery(error.message);
            return;
          }

          await ctx.answerCallbackQuery("An error occurred.");
        }
      },
    });
  };
}
