import { Context } from "grammy";
import { LbContext } from "../types/context";

interface CallbackOptions {
  action: string;
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
        const lbCtx = new LbContext(ctx);
        await lbCtx.answerCallbackQuery();
        return descriptor.value(lbCtx);
      },
    });
  };
}
