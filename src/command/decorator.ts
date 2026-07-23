import { Context } from "grammy";
import { InvalidArgumentAmountError, UnauthorizedError } from "@/errors";
import { LbContext } from "@/types/context";
import { isOwnerOrPrivate } from "@/utils/chat";
import { dispatchResponse } from "@/command/response/dispatch";
import { COMMANDS_TO_REGISTER } from "./registry";

export type ParsedArgs = Record<string, string>;

interface CommandArg {
  name: string;
}

interface CommandOptions {
  name: string;
  args?: CommandArg[];
  requiresAdmin?: boolean;
}

function parseArgs(text: string, defs: CommandArg[]): ParsedArgs {
  const parts = text.split(/\s+/).slice(1);

  if (parts.length !== defs.length) {
    throw new InvalidArgumentAmountError(defs.length, parts.length);
  }

  const result: ParsedArgs = {};

  for (let i = 0; i < defs.length; i++) {
    result[defs[i].name] = parts[i];
  }

  return result;
}

export function command(options: CommandOptions) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalHandler = descriptor.value;

    COMMANDS_TO_REGISTER.push({
      ...options,
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);

        if (options.requiresAdmin && !(await isOwnerOrPrivate(ctx))) {
          throw new UnauthorizedError();
        }

        const args = options.args
          ? parseArgs(ctx.message?.text ?? "", options.args)
          : {};

        const response = await originalHandler(lbCtx, args);
        await dispatchResponse(lbCtx, response);
        return response;
      },
    });
  };
}
