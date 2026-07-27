import { Context } from "grammy";
import { LbContext } from "@/utils/context";
import { LeetCodeBotError } from "@/errors";
import { CallbackRegistry } from "./registry";
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
    CallbackRegistry.addCallback({
      ...options,
      handler: async (ctx: Context) => {
        try {
          const lbCtx = new LbContext(ctx);
          await lbCtx.answerCallbackQuery();
          const response: CallbackResponse = await descriptor.value(lbCtx);
          await dispatchCallbackResponse(lbCtx, response);
        } catch (error) {
          if (error instanceof LeetCodeBotError) {
            await ctx.editMessageText(error.message);
            return;
          }

          await ctx.editMessageText("An error occurred.");
        }
      },
    });
  };
}
