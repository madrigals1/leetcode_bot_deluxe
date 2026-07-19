import { Context, InlineKeyboard } from "grammy";
import { InvalidArgumentAmountError } from "../errors";

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
  isAdmin?: boolean;
}

interface CommandMetadata extends CommandOptions {
  handler: (
    ctx: Context,
    args: ParsedArgs,
  ) => CommandResponse | Promise<CommandResponse>;
}

export const commandsRegisteredByDecorator: CommandMetadata[] = [];

export function command(options: CommandOptions) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    commandsRegisteredByDecorator.push({
      ...options,
      handler: descriptor.value,
    });
  };
}

export function parseArgs({
  text = "",
  defs = [],
}: {
  text?: string;
  defs?: CommandArg[];
} = {}): ParsedArgs {
  if (!text || defs.length === 0) {
    return {};
  }

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
