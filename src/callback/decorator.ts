import { Context } from "grammy";
import { LbContext } from "@/types/context";
import { LeetCodeBotError } from "@/errors";
import { CALLBACKS_TO_REGISTER } from "./registry";

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
          return descriptor.value(lbCtx);
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
