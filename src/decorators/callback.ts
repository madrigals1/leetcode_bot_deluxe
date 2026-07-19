import { Context } from "grammy";

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
      handler: descriptor.value,
    });
  };
}
