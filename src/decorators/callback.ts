import { Context } from "grammy";
import { LbContext } from "@/types/context";
import { LeetCodeBotError } from "@/errors";

interface CallbackOptions {
  action: string | RegExp;
}

interface CallbackMetadata extends CallbackOptions {
  handler: (ctx: Context) => void | Promise<void>;
}

export const callbacksRegisteredByDecorator: CallbackMetadata[] = [];

export function callback(options: CallbackOptions) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    callbacksRegisteredByDecorator.push({
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
