import { BotNotInitializedError } from "@/errors";

export function RequireBot(
  target: object,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (this: object, ...args: unknown[]) {
    if (!(target as Record<string, unknown>).bot) {
      throw new BotNotInitializedError();
    }
    return original.apply(this, args);
  };
}
