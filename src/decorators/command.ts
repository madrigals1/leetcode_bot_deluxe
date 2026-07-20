import { Context, InlineKeyboard } from "grammy";
import { InvalidArgumentAmountError, UnauthorizedError } from "../errors";
import { LbContext } from "../types/context";
import { isOwnerOrPrivate } from "../utils/chat";

export type ParsedArgs = Record<string, string>;

interface CommandArg {
  name: string;
}

interface CommandResponse {
  text: string;
  reply_markup?: InlineKeyboard;
}

interface CommandOptions {
  name: string;
  args?: CommandArg[];
  requiresAdmin?: boolean;
}

interface CommandMetadata extends CommandOptions {
  handler: (ctx: Context) => CommandResponse | Promise<CommandResponse>;
}

export const commandsRegisteredByDecorator: CommandMetadata[] = [];

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

    commandsRegisteredByDecorator.push({
      ...options,
      handler: async (ctx: Context) => {
        const lbCtx = new LbContext(ctx);

        if (options.requiresAdmin && !(await isOwnerOrPrivate(ctx))) {
          throw new UnauthorizedError();
        }

        const args = options.args
          ? parseArgs(ctx.message?.text ?? "", options.args)
          : {};

        return originalHandler(lbCtx, args);
      },
    });
  };
}
