import { Context } from "grammy";
import { UnauthorizedError } from "@/errors";
import { LbContext } from "@/utils/context";
import { isOwnerOrPrivate } from "@/utils/chat";
import { dispatchResponse } from "@/command/response/dispatch";
import type { CommandArg } from "./utils";
import { parseArgs } from "./utils";
import { CommandRegistry } from "./registry";

export { type ParsedArgs, type CommandArg, parseArgs } from "./utils";

interface CommandOptions {
  name: string;
  description: string;
  args?: CommandArg[];
  requiresAdmin?: boolean;
}

export function command(options: CommandOptions) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalHandler = descriptor.value;

    CommandRegistry.addCommand({
      ...options,
      originalFn: originalHandler,
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);

        if (options.requiresAdmin && !(await isOwnerOrPrivate(ctx))) {
          throw new UnauthorizedError();
        }

        const args = options.args
          ? parseArgs(ctx.message?.text ?? "", options.args)
          : {};

        const response = await originalHandler(lbCtx, args);
        const reply = (text: string, options?: object) => lbCtx.reply(text, options);
        const replyPhoto = (photo: string, options?: object) =>
          lbCtx.replyWithPhoto(photo, options);
        await dispatchResponse(lbCtx, response, reply, replyPhoto);
        return response;
      },
    });
  };
}
