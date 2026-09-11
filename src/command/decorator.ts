import { Context } from "grammy";
import { LbContext } from "@/utils/context";
import { assertAuth } from "@/utils/chat";
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

        await assertAuth(ctx, options);

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
