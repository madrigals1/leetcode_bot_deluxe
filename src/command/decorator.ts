import { Context } from "grammy";
import { UnauthorizedError } from "@/errors";
import { LbContext } from "@/utils/context";
import { isOwnerOrPrivate, isSuperAdmin } from "@/utils/chat";
import { dispatchResponse } from "@/command/response/dispatch";
import type { CommandOptions } from "./types";
import { parseArgs, buildExample } from "./utils";
import { CommandRegistry } from "./registry";

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

        const superAdmin = isSuperAdmin(ctx);

        if (options.requiresSuperAdmin && !superAdmin) {
          throw new UnauthorizedError();
        }

        if (
          options.requiresAdmin
          && !superAdmin
          && !(await isOwnerOrPrivate(ctx))
        ) {
          throw new UnauthorizedError();
        }

        const parsedArgs = parseArgs(
          ctx.message?.text ?? "",
          options.args ?? [],
          buildExample(options),
        );

        const response = await originalHandler(lbCtx, parsedArgs);
        const reply = (text: string, options?: object) => lbCtx.reply(text, options);
        const replyPhoto = (photo: string, options?: object) =>
          lbCtx.replyWithPhoto(photo, options);
        await dispatchResponse(lbCtx, response, reply, replyPhoto);
        return response;
      },
    });
  };
}
